import AirdropMonitoringService from '../services/airdrop-monitoring.js';
import logger from '../utils/logger.js';

export default async function monitoringRoutes(fastify, options) {
  const db = options.db;
  const monitoring = new AirdropMonitoringService(db);

  // POST /api/monitoring/protocol - Criar novo protocolo
  fastify.post('/protocol', async (request, reply) => {
    try {
      const {
        nome, tipo, chains, siteOficial, docs,
        handles, backing, pontuacaoDashboard
      } = request.body;

      if (!nome || !tipo) {
        return reply.status(400).send({ 
          error: 'Nome e tipo são obrigatórios',
          success: false 
        });
      }

      const protocol = await monitoring.createProtocol({
        nome, tipo, chains, siteOficial, docs, handles, backing, pontuacaoDashboard
      });

      logger.info(`Protocol created: ${nome}`);

      return {
        success: true,
        protocol
      };
    } catch (error) {
      logger.error('Error creating protocol:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false 
      });
    }
  });

  // POST /api/monitoring/event - Registrar evento
  fastify.post('/event', async (request, reply) => {
    try {
      const {
        protocoloId, origem, tipoEvento, conteudo,
        identificadorOrigem, linksAssociados, metadados
      } = request.body;

      if (!protocoloId || !conteudo) {
        return reply.status(400).send({ 
          error: 'protocoloId e conteudo são obrigatórios',
          success: false 
        });
      }

      const event = await monitoring.logEvent({
        protocoloId, origem: origem || 'manual', tipoEvento, conteudo,
        identificadorOrigem, linksAssociados, metadados
      });

      return {
        success: true,
        event
      };
    } catch (error) {
      logger.error('Error logging event:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false 
      });
    }
  });

  // GET /api/monitoring/protocol/:id/status - Status completo do protocolo
  fastify.get('/protocol/:id/status', async (request, reply) => {
    try {
      const { id } = request.params;

      const status = await monitoring.getProtocolStatus(id);

      if (!status) {
        return reply.status(404).send({ 
          error: 'Protocolo não encontrado',
          success: false 
        });
      }

      return {
        success: true,
        ...status
      };
    } catch (error) {
      logger.error('Error getting protocol status:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false 
      });
    }
  });

  // GET /api/monitoring/protocol/:id/summary - Resumo do protocolo
  fastify.get('/protocol/:id/summary', async (request, reply) => {
    try {
      const { id } = request.params;

      const summary = await monitoring.getProtocolSummary(id);

      if (!summary) {
        return reply.status(404).send({ 
          error: 'Protocolo não encontrado',
          success: false 
        });
      }

      return {
        success: true,
        summary
      };
    } catch (error) {
      logger.error('Error getting protocol summary:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false 
      });
    }
  });

  // GET /api/monitoring/protocols/pending-alerts - Protocolos com alertas
  fastify.get('/protocols/pending-alerts', async (request, reply) => {
    try {
      const protocols = await monitoring.getProtocolsWithPendingAlerts();

      return {
        success: true,
        protocols,
        total: protocols.length
      };
    } catch (error) {
      logger.error('Error getting protocols with alerts:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false 
      });
    }
  });

  // PATCH /api/monitoring/alert/:id/acknowledge - Marcar alerta como lido
  fastify.patch('/alert/:id/acknowledge', async (request, reply) => {
    try {
      const { id } = request.params;

      await monitoring.acknowledgeAlert(id);

      return {
        success: true,
        message: 'Alerta marcado como reconhecido'
      };
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false 
      });
    }
  });

  // POST /api/monitoring/detect-event-type - Testar detecção de tipo
  fastify.post('/detect-event-type', async (request, reply) => {
    try {
      const { conteudo } = request.body;

      if (!conteudo) {
        return reply.status(400).send({ 
          error: 'conteudo é obrigatório',
          success: false 
        });
      }

      const tipo = monitoring.detectEventType(conteudo);
      const datas = monitoring.extractDates(conteudo);
      const links = monitoring.extractLinks(conteudo);

      return {
        success: true,
        tipo,
        datas,
        links
      };
    } catch (error) {
      logger.error('Error detecting event type:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false 
      });
    }
  });
}
