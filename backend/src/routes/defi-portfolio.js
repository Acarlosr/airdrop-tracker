import DefiPortfolioService from '../services/defi-portfolio.js';
import logger from '../utils/logger.js';

export default async function defiPortfolioRoutes(fastify, opts) {
  const portfolio = new DefiPortfolioService();

  fastify.get('/wallet/:address/positions', async (request, reply) => {
    try {
      const { address } = request.params;
      if (!address) return reply.status(400).send({ success: false, error: 'Wallet address is required' });
      const positions = await portfolio.getWalletPositions(address.toLowerCase());
      return { success: true, data: positions };
    } catch (error) {
      logger.error('[DeFi] Positions error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  fastify.get('/wallet/:address/lending', async (request, reply) => {
    try {
      const { address } = request.params;
      if (!address) return reply.status(400).send({ success: false, error: 'Wallet address is required' });
      const lending = await portfolio.getLendingPositions(address.toLowerCase());
      return { success: true, data: lending };
    } catch (error) {
      logger.error('[DeFi] Lending error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  fastify.get('/wallet/:address/lp', async (request, reply) => {
    try {
      const { address } = request.params;
      if (!address) return reply.status(400).send({ success: false, error: 'Wallet address is required' });
      const lp = await portfolio.getLPPositions(address.toLowerCase());
      return { success: true, data: lp };
    } catch (error) {
      logger.error('[DeFi] LP error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  fastify.get('/wallet/:address/money-lego', async (request, reply) => {
    try {
      const { address } = request.params;
      if (!address) return reply.status(400).send({ success: false, error: 'Wallet address is required' });
      const chains = await portfolio.detectMoneyLegoChains(address.toLowerCase());
      return { success: true, data: chains };
    } catch (error) {
      logger.error('[DeFi] Money Lego detection error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  fastify.get('/wallet/:address/metrics', async (request, reply) => {
    try {
      const { address } = request.params;
      if (!address) return reply.status(400).send({ success: false, error: 'Wallet address is required' });
      const walletAddress = address.toLowerCase();
      const [positions, lending] = await Promise.all([
        portfolio.getWalletPositions(walletAddress),
        portfolio.getLendingPositions(walletAddress),
      ]);
      // positions é {tokens, protocols} - extrair o array de tokens para calcular métricas
      const tokens = positions.tokens || [];
      const metrics = portfolio.calculatePortfolioMetrics(tokens, lending);
      return { success: true, data: metrics };
    } catch (error) {
      logger.error('[DeFi] Metrics error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
}
