import AirdropMonitoringService from '../services/airdrop-monitoring.js';
import { getPool } from '../config/database.js';
import logger from '../utils/logger.js';

export default async function monitoringRoutes(fastify, options) {
  // Usa o pool passado via options, ou fallback para getPool()
  const pool = options?.db || getPool();
  const monitoring = pool ? new AirdropMonitoringService(pool) : null;

  // Helper para verificar se monitoring está disponível
  function requireMonitoring(reply) {
    if (!monitoring) {
      reply.status(503).send({
        success: false,
        error: 'Database not available (preview mode)',
        message: 'Configure DATABASE_URL to enable monitoring'
      });
      return false;
    }
    return true;
  }

  // POST /api/monitoring/protocol
  fastify.post('/protocol', async (request, reply) => {
    if (!requireMonitoring(reply)) return;
    try {
      const { nome, tipo, chains, siteOficial, docs, handles, backing, pontuacaoDashboard } = request.body;
      if (!nome || !tipo) {
        return reply.status(400).send({ error: 'Nome e tipo são obrigatórios', success: false });
      }
      const protocol = await monitoring.createProtocol({
        nome, tipo, chains, siteOficial, docs, handles, backing, pontuacaoDashboard
      });
      logger.info(`Protocol created: ${nome}`);
      return { success: true, protocol };
    } catch (error) {
      logger.error('Error creating protocol:', error);
      return reply.status(500).send({ error: error.message, success: false });
    }
  });

  // POST /api/monitoring/event
  fastify.post('/event', async (request, reply) => {
    if (!requireMonitoring(reply)) return;
    try {
      const { protocoloId, origem, tipoEvento, conteudo, identificadorOrigem, linksAssociados, metadados } = request.body;
      if (!protocoloId || !conteudo) {
        return reply.status(400).send({ error: 'protocoloId e conteudo são obrigatórios', success: false });
      }
      const event = await monitoring.logEvent({
        protocoloId, origem: origem || 'manual', tipoEvento, conteudo,
        identificadorOrigem, linksAssociados, metadados
      });
      return { success: true, event };
    } catch (error) {
      logger.error('Error logging event:', error);
      return reply.status(500).send({ error: error.message, success: false });
    }
  });

  // GET /api/monitoring/protocol/:id/status
  fastify.get('/protocol/:id/status', async (request, reply) => {
    if (!requireMonitoring(reply)) return;
    try {
      const { id } = request.params;
      const status = await monitoring.getProtocolStatus(id);
      if (!status) {
        return reply.status(404).send({ error: 'Protocolo não encontrado', success: false });
      }
      return { success: true, ...status };
    } catch (error) {
      logger.error('Error getting protocol status:', error);
      return reply.status(500).send({ error: error.message, success: false });
    }
  });

  // GET /api/monitoring/protocol/:id/summary
  fastify.get('/protocol/:id/summary', async (request, reply) => {
    if (!requireMonitoring(reply)) return;
    try {
      const { id } = request.params;
      const summary = await monitoring.getProtocolSummary(id);
      if (!summary) {
        return reply.status(404).send({ error: 'Protocolo não encontrado', success: false });
      }
      return { success: true, summary };
    } catch (error) {
      logger.error('Error getting protocol summary:', error);
      return reply.status(500).send({ error: error.message, success: false });
    }
  });

  // GET /api/monitoring/protocols/pending-alerts
  fastify.get('/protocols/pending-alerts', async (request, reply) => {
    if (!requireMonitoring(reply)) return;
    try {
      const protocols = await monitoring.getProtocolsWithPendingAlerts();
      return { success: true, protocols, total: protocols.length };
    } catch (error) {
      logger.error('Error getting protocols with alerts:', error);
      return reply.status(500).send({ error: error.message, success: false });
    }
  });

  // PATCH /api/monitoring/alert/:id/acknowledge
  fastify.patch('/alert/:id/acknowledge', async (request, reply) => {
    if (!requireMonitoring(reply)) return;
    try {
      const { id } = request.params;
      await monitoring.acknowledgeAlert(id);
      return { success: true, message: 'Alerta marcado como reconhecido' };
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      return reply.status(500).send({ error: error.message, success: false });
    }
  });

  // POST /api/monitoring/detect-event-type (não precisa de DB)
  fastify.post('/detect-event-type', async (request, reply) => {
    try {
      const { conteudo } = request.body;
      if (!conteudo) {
        return reply.status(400).send({ error: 'conteudo é obrigatório', success: false });
      }
      // Usa apenas os métodos estáticos que não precisam de DB
      const dummyMonitor = new AirdropMonitoringService(null);
      const tipo = dummyMonitor.detectEventType(conteudo);
      const datas = dummyMonitor.extractDates(conteudo);
      const links = dummyMonitor.extractLinks(conteudo);
      return { success: true, tipo, datas, links };
    } catch (error) {
      logger.error('Error detecting event type:', error);
      return reply.status(500).send({ error: error.message, success: false });
    }
  });
}
