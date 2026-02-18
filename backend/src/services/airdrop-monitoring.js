import logger from '../utils/logger.js';

/**
 * Airdrop Monitoring Service
 * Gerencia protocolos, eventos e alertas de testnet
 */

export class AirdropMonitoringService {
  constructor(db) {
    this.db = db;
    
    // Palavras-chave para detecção automática de eventos
    this.keywords = {
      snapshot: ['snapshot', 'season end', 'epoch', 'phase end', 'qualification closed'],
      ruleChange: ['updated rules', 'changes to points', 'new weighting', 'reset', 'season rules', 'criteria changed'],
      quest: ['quest', 'campaign', 'galxe', 'zealy', 'layer3', 'intract', 'mission', 'task'],
      mainnet: ['token generation event', 'TGE', 'mainnet launch', 'airdrop distribution', 'claim portal', 'token transfer'],
      bug: ['rollback', 'issue', 'bug', 'temporary disable', 'exploit', 'paused', 'maintenance'],
      maintenance: ['maintenance', 'RPC down', 'reset', 'upgrade', 'downtime'],
      integration: ['integration', 'listado', 'supported', 'new chain', 'new L2', 'bridge support'],
      governance: ['governance', 'proposal', 'vote', 'voting', 'poll', 'dao']
    };

    // Palavras-chave em português
    this.keywordsPt = {
      snapshot: ['snapshot', 'fim de season', 'época', 'fim da fase', 'qualificação encerrada'],
      ruleChange: ['regras atualizadas', 'mudanças de pontos', 'novo peso', 'reset', 'regras da season', 'critérios mudaram'],
      quest: ['missão', 'campanha', 'desafio', 'tarefa'],
      mainnet: ['evento de geração de tokens', 'TGE', 'lançamento mainnet', 'distribuição airdrop', 'portal claim'],
      bug: ['rollback', 'problema', 'bug', 'desativar temporário', 'exploit', 'pausado', 'manutenção'],
      maintenance: ['manutenção', 'RPC', 'reset', 'atualização', 'tempo de inatividade'],
      integration: ['integração', 'suportado', 'nova chain', 'novo L2', 'bridge'],
      governance: ['governança', 'proposta', 'votação', 'poll', 'dao']
    };
  }

  /**
   * Criar protocolo no monitoramento
   */
  async createProtocol({
    nome,
    tipo, // DEX, perpDEX, lending, bridge, L2, infra
    chains,
    siteOficial,
    docs,
    handles, // { twitter, discord, github, blog }
    backing = 'unknown',
    pontuacaoDashboard = null
  }) {
    try {
      const result = await this.db.query(
        `INSERT INTO airdrop_protocols (
          name, type, supported_chains, site_url, docs_url, 
          twitter_handle, discord_url, github_url, blog_url,
          backing_score, points_dashboard_url, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *`,
        [
          nome, tipo, JSON.stringify(chains), siteOficial, docs,
          handles.twitter, handles.discord, handles.github, handles.blog,
          backing, pontuacaoDashboard
        ]
      );

      logger.info(`Protocol created: ${nome}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating protocol:', error);
      throw error;
    }
  }

  /**
   * Registrar evento monitorado
   */
  async logEvent({
    protocoloId,
    origem, // 'twitter' ou 'discord'
    tipoEvento,
    conteudo,
    identificadorOrigem,
    linksAssociados = [],
    metadados = {}
  }) {
    try {
      // Detectar tipo de evento automaticamente se não fornecido
      let tipoDetectado = tipoEvento;
      if (!tipoDetectado) {
        tipoDetectado = this.detectEventType(conteudo);
      }

      const result = await this.db.query(
        `INSERT INTO airdrop_events (
          protocol_id, origin, event_type, content, 
          source_identifier, associated_links, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *`,
        [
          protocoloId, origem, tipoDetectado, conteudo,
          identificadorOrigem, JSON.stringify(linksAssociados), JSON.stringify(metadados)
        ]
      );

      logger.info(`Event logged: ${tipoDetectado} for protocol ${protocoloId}`);

      // Verificar se gera alerta
      await this.checkAndCreateAlert(result.rows[0]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error logging event:', error);
      throw error;
    }
  }

  /**
   * Detectar tipo de evento automaticamente
   */
  detectEventType(texto) {
    if (!texto) return 'announcement';

    const textoLower = texto.toLowerCase();

    for (const [tipo, palavras] of Object.entries(this.keywords)) {
      if (palavras.some(palavra => textoLower.includes(palavra))) {
        return tipo;
      }
    }

    for (const [tipo, palavras] of Object.entries(this.keywordsPt)) {
      if (palavras.some(palavra => textoLower.includes(palavra))) {
        return tipo;
      }
    }

    return 'announcement';
  }

  /**
   * Extrair datas importantes do conteúdo
   */
  extractDates(texto) {
    const datas = [];
    
    // Padrão: "DD/MM/YYYY" ou "YYYY-MM-DD"
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/g;
    const matches = texto.match(dateRegex);

    if (matches) {
      datas.push(...matches);
    }

    // Padrão: "January 15, 2024" ou "15 January 2024"
    const monthRegex = /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/gi;
    const monthMatches = texto.match(monthRegex);

    if (monthMatches) {
      datas.push(...monthMatches);
    }

    return datas;
  }

  /**
   * Extrair links do conteúdo
   */
  extractLinks(texto) {
    const linkRegex = /https?:\/\/[^\s]+/g;
    return texto.match(linkRegex) || [];
  }

  /**
   * Detectar necessidade de criar alerta
   */
  async checkAndCreateAlert(event) {
    const tiposComAlerta = ['snapshot', 'ruleChange', 'mainnet', 'bug', 'quest'];

    if (!tiposComAlerta.includes(event.event_type)) {
      return;
    }

    const alertas = [];
    const datas = this.extractDates(event.content);
    const links = this.extractLinks(event.content);

    // Criar alerta com base no tipo
    switch (event.event_type) {
      case 'snapshot':
        alertas.push({
          tipo: 'SNAPSHOT_COMING',
          prioridade: 'HIGH',
          mensagem: '⚠️ SNAPSHOT DETECTADO',
          datas
        });
        break;

      case 'ruleChange':
        alertas.push({
          tipo: 'RULE_CHANGED',
          prioridade: 'HIGH',
          mensagem: '📋 REGRAS ALTERADAS',
          datas
        });
        break;

      case 'mainnet':
        alertas.push({
          tipo: 'MAINNET_TGE',
          prioridade: 'CRITICAL',
          mensagem: '🚀 MAINNET/TGE ANUNCIADO',
          datas
        });
        break;

      case 'bug':
        alertas.push({
          tipo: 'BUG_ISSUE',
          prioridade: 'MEDIUM',
          mensagem: '🐛 BUG/PROBLEMA REPORTADO',
          datas
        });
        break;

      case 'quest':
        alertas.push({
          tipo: 'QUEST_CAMPAIGN',
          prioridade: 'MEDIUM',
          mensagem: '🎯 NOVA CAMPANHA/QUEST',
          links
        });
        break;
    }

    // Salvar alertas
    for (const alerta of alertas) {
      await this.db.query(
        `INSERT INTO airdrop_alerts (
          event_id, alert_type, priority, message, 
          associated_dates, associated_links, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          event.id, alerta.tipo, alerta.prioridade, alerta.mensagem,
          JSON.stringify(alerta.datas || []), JSON.stringify(alerta.links || [])
        ]
      );
    }

    logger.info(`Alerts created for event ${event.id}: ${alertas.length} alertas`);
  }

  /**
   * Obter protocolo com status atual
   */
  async getProtocolStatus(protocoloId) {
    try {
      // Dados básicos
      const protocolResult = await this.db.query(
        `SELECT * FROM airdrop_protocols WHERE id = $1`,
        [protocoloId]
      );

      if (protocolResult.rows.length === 0) {
        return null;
      }

      const protocolo = protocolResult.rows[0];

      // Eventos recentes
      const eventsResult = await this.db.query(
        `SELECT * FROM airdrop_events 
         WHERE protocol_id = $1 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [protocoloId]
      );

      // Alertas ativos
      const alertsResult = await this.db.query(
        `SELECT ae.* FROM airdrop_alerts ae
         JOIN airdrop_events e ON ae.event_id = e.id
         WHERE e.protocol_id = $1 AND ae.acknowledged = false
         ORDER BY ae.priority DESC, ae.created_at DESC`,
        [protocoloId]
      );

      // Checklist de monitoramento
      const checklist = this.generateMonitoringChecklist(eventsResult.rows);

      return {
        protocolo,
        events: eventsResult.rows,
        activeAlerts: alertsResult.rows,
        checklist,
        summary: {
          totalEvents: eventsResult.rows.length,
          snapshotDetected: eventsResult.rows.some(e => e.event_type === 'snapshot'),
          lastSnapshot: eventsResult.rows.find(e => e.event_type === 'snapshot')?.created_at,
          mainnetAnnounced: eventsResult.rows.some(e => e.event_type === 'mainnet'),
          openAlerts: alertsResult.rows.length
        }
      };
    } catch (error) {
      logger.error('Error getting protocol status:', error);
      throw error;
    }
  }

  /**
   * Gerar checklist de monitoramento
   */
  generateMonitoringChecklist(events) {
    return {
      // X (Twitter)
      twitterMonitoring: {
        eligibilityThreadsFound: events.some(e => 
          e.content?.toLowerCase().includes('eligible') || 
          e.content?.toLowerCase().includes('qualify')
        ),
        maintenanceAnnounced: events.some(e => e.event_type === 'maintenance'),
        newIntegrations: events.some(e => e.event_type === 'integration'),
        featureUpdates: events.some(e => e.event_type === 'ruleChange'),
        campaignsActive: events.some(e => e.event_type === 'quest')
      },

      // Discord
      discordMonitoring: {
        announcementsMonitored: true, // Sempre ativo se conectado
        snapshotAnnounced: events.some(e => e.event_type === 'snapshot'),
        rulesUpdated: events.some(e => e.event_type === 'ruleChange'),
        campaignsFound: events.some(e => e.event_type === 'quest'),
        bugsReported: events.some(e => e.event_type === 'bug'),
        governanceActive: events.some(e => e.event_type === 'governance')
      },

      // Padrões gerais
      patterns: {
        checklistCompleto: events.length > 0,
        alertasAtivos: events.some(e => ['snapshot', 'mainnet', 'ruleChange'].includes(e.event_type)),
        statusAtualizado: true,
        prontoPara: this.identifyReadiness(events)
      }
    };
  }

  /**
   * Identificar se está pronto para ação
   */
  identifyReadiness(events) {
    const tipos = new Set(events.map(e => e.event_type));

    const readiness = [];

    if (tipos.has('snapshot')) readiness.push('snapshot_detected');
    if (tipos.has('quest')) readiness.push('campaigns_active');
    if (tipos.has('ruleChange')) readiness.push('rules_updated');
    if (tipos.has('mainnet')) readiness.push('mainnet_coming');

    if (readiness.length === 0) {
      readiness.push('baseline_monitoring');
    }

    return readiness;
  }

  /**
   * Obter resumo de protocolo para card
   */
  async getProtocolSummary(protocoloId) {
    try {
      const result = await this.db.query(
        `SELECT 
          p.id, p.name, p.type, p.twitter_handle, p.discord_url,
          p.points_dashboard_url, p.backing_score,
          COUNT(e.id) as total_events,
          SUM(CASE WHEN e.event_type = 'snapshot' THEN 1 ELSE 0 END) as snapshot_count,
          SUM(CASE WHEN e.event_type = 'mainnet' THEN 1 ELSE 0 END) as mainnet_count,
          SUM(CASE WHEN e.event_type = 'quest' THEN 1 ELSE 0 END) as quest_count,
          SUM(CASE WHEN a.acknowledged = false THEN 1 ELSE 0 END) as open_alerts,
          MAX(e.created_at) as last_update
        FROM airdrop_protocols p
        LEFT JOIN airdrop_events e ON p.id = e.protocol_id
        LEFT JOIN airdrop_alerts a ON e.id = a.event_id
        WHERE p.id = $1
        GROUP BY p.id`,
        [protocoloId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting protocol summary:', error);
      throw error;
    }
  }

  /**
   * Listar protocolos com alertas pendentes
   */
  async getProtocolsWithPendingAlerts() {
    try {
      const result = await this.db.query(
        `SELECT DISTINCT p.id, p.name, p.type, 
          COUNT(DISTINCT a.id) as pending_alerts,
          MAX(a.created_at) as last_alert_time
        FROM airdrop_protocols p
        JOIN airdrop_events e ON p.id = e.protocol_id
        JOIN airdrop_alerts a ON e.id = a.event_id
        WHERE a.acknowledged = false
        GROUP BY p.id, p.name, p.type
        ORDER BY pending_alerts DESC, last_alert_time DESC`,
        []
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting protocols with pending alerts:', error);
      throw error;
    }
  }

  /**
   * Marcar alerta como reconhecido
   */
  async acknowledgeAlert(alertId) {
    try {
      await this.db.query(
        `UPDATE airdrop_alerts 
         SET acknowledged = true, acknowledged_at = NOW()
         WHERE id = $1`,
        [alertId]
      );

      logger.info(`Alert ${alertId} acknowledged`);
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }
}

export default AirdropMonitoringService;
