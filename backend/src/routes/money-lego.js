import MoneyLegoService from '../services/money-lego.js';
import { getPool } from '../config/database.js';
import logger from '../utils/logger.js';

export default async function moneyLegoRoutes(fastify, opts) {
  const pool = getPool();

  // Se não tem DB, retorna preview mode para todas as rotas
  function requireDB(reply) {
    if (!pool) {
      reply.status(503).send({
        success: false,
        error: 'Database not available (preview mode)',
        message: 'Configure DATABASE_URL to use Money Lego features',
      });
      return false;
    }
    return true;
  }

  const moneyLego = pool ? new MoneyLegoService(pool) : null;

  fastify.get('/graph', async (request, reply) => {
    if (!requireDB(reply)) return;
    try {
      const { airdropId, wallet } = request.query;
      if (!airdropId || !wallet) {
        return reply.status(400).send({ success: false, error: 'airdropId and wallet are required' });
      }
      const graph = await moneyLego.buildDependencyGraph(airdropId, wallet.toLowerCase());
      return { success: true, data: graph };
    } catch (error) {
      logger.error('[MoneyLego] Graph error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  fastify.get('/exit', async (request, reply) => {
    if (!requireDB(reply)) return;
    try {
      const { airdropId, wallet } = request.query;
      if (!airdropId || !wallet) {
        return reply.status(400).send({ success: false, error: 'airdropId and wallet are required' });
      }
      const sequence = await moneyLego.calculateExitSequence(airdropId, wallet.toLowerCase());
      return { success: true, data: sequence };
    } catch (error) {
      logger.error('[MoneyLego] Exit error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  fastify.get('/risk', async (request, reply) => {
    if (!requireDB(reply)) return;
    try {
      const { airdropId, wallet } = request.query;
      if (!airdropId || !wallet) {
        return reply.status(400).send({ success: false, error: 'airdropId and wallet are required' });
      }
      const risk = await moneyLego.checkCascadeRisk(airdropId, wallet.toLowerCase());
      return { success: true, data: risk };
    } catch (error) {
      logger.error('[MoneyLego] Risk error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  fastify.post('/positions', async (request, reply) => {
    if (!requireDB(reply)) return;
    try {
      const { airdropId, walletAddress, tokenOrigem, protocoloOrigem, posicaoOrigemId, tokenDestino, protocoloDestino, valor, riscoCascata } = request.body;
      if (!walletAddress || !tokenOrigem || !protocoloOrigem || !tokenDestino || !protocoloDestino) {
        return reply.status(400).send({ success: false, error: 'Missing required fields' });
      }
      const position = await moneyLego.createMoneyLegoPosition({
        airdropId: airdropId || null,
        walletAddress: walletAddress.toLowerCase(),
        tokenOrigem, protocoloOrigem, posicaoOrigemId,
        tokenDestino, protocoloDestino,
        valor: valor || 0, riscoCascata: riscoCascata || false,
      });
      return { success: true, data: position };
    } catch (error) {
      logger.error('[MoneyLego] Create position error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  fastify.post('/detect-looping', async (request, reply) => {
    if (!requireDB(reply)) return;
    try {
      const { walletAddress, protocol, asset } = request.body;
      if (!walletAddress || !protocol || !asset) {
        return reply.status(400).send({ success: false, error: 'walletAddress, protocol, asset required' });
      }
      const looping = await moneyLego.detectLooping(walletAddress.toLowerCase(), protocol, asset);
      return { success: true, data: looping };
    } catch (error) {
      logger.error('[MoneyLego] Looping error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  fastify.get('/unwind-time', async (request, reply) => {
    if (!requireDB(reply)) return;
    try {
      const { airdropId, wallet } = request.query;
      if (!airdropId || !wallet) {
        return reply.status(400).send({ success: false, error: 'airdropId and wallet are required' });
      }
      const sequence = await moneyLego.calculateExitSequence(airdropId, wallet.toLowerCase());
      const estimate = moneyLego.estimateUnwindTime(sequence.sequence);
      return { success: true, data: estimate };
    } catch (error) {
      logger.error('[MoneyLego] Unwind time error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
}
