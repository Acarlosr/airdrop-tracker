/**
 * Preview Mode Entry Point
 * Roda o backend sem depender de Bull (Redis), DB, ou scheduler.
 * Ideal para desenvolvimento rápido e preview do frontend.
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';

// ── Routes ───────────────────────────────────────────────────────
import authRoutes from './routes/auth.js';
import airdropsRoutes from './routes/airdrops.js';
import walletsRoutes from './routes/wallets.js';
import aiRoutes from './routes/ai.js';
import eligibilityRoutes from './routes/eligibility.js';
import alertsRoutes from './routes/alerts.js';
import analyticsRoutes from './routes/analytics.js';
import botRoutes from './routes/bot.js';
import socialRoutes from './routes/social.js';
import monitoringRoutes from './routes/monitoring.js';
import transactionRoutes from './routes/transactions.js';
import aiRobotRoutes from './routes/ai-robot.js';
import moneyLegoRoutes from './routes/money-lego.js';
import defiPortfolioRoutes from './routes/defi-portfolio.js';

// ── Services (lightweight) ──────────────────────────────────────
import { initDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';

const fastify = Fastify({ logger: false });

await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
});

// ── Health & Root ────────────────────────────────────────────────
fastify.get('/health', async () => ({
  status: 'ok',
  version: '2.0.0 (preview)',
  timestamp: new Date().toISOString(),
}));

fastify.get('/', async () => ({
  name: 'ClaimOS API (Preview)',
  version: '2.0.0',
  status: 'running',
  mode: 'preview',
  routes: [
    '/api/auth', '/api/airdrops', '/api/wallets', '/api/ai',
    '/api/eligibility', '/api/alerts', '/api/analytics',
    '/api/bot', '/api/social', '/api/monitoring', '/api/transactions',
    '/api/ai-robot', '/api/money-lego', '/api/defi-portfolio',
  ],
}));

// ── Register all 14 route groups ─────────────────────────────────
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(airdropsRoutes, { prefix: '/api/airdrops' });
fastify.register(walletsRoutes, { prefix: '/api/wallets' });
fastify.register(aiRoutes, { prefix: '/api/ai' });
fastify.register(eligibilityRoutes, { prefix: '/api/eligibility' });
fastify.register(alertsRoutes, { prefix: '/api/alerts' });
fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
fastify.register(botRoutes, { prefix: '/api/bot' });
fastify.register(socialRoutes, { prefix: '/api/social' });
fastify.register(monitoringRoutes, { prefix: '/api/monitoring' });
fastify.register(transactionRoutes, { prefix: '/api/transactions' });
fastify.register(aiRobotRoutes, { prefix: '/api/ai-robot' });
fastify.register(moneyLegoRoutes, { prefix: '/api/money-lego' });
fastify.register(defiPortfolioRoutes, { prefix: '/api/defi-portfolio' });

// ── Error handler ────────────────────────────────────────────────
fastify.setErrorHandler((err, _request, reply) => {
  console.error('[ERROR]', err.message);
  reply.status(err.statusCode ?? 500).send({
    error: err.message ?? 'Internal Server Error',
    statusCode: err.statusCode ?? 500,
  });
});

// ── Start ────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);

try {
  await initDatabase();
  await initRedis();
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 ClaimOS Preview ON :${PORT}`);
  console.log(`   Frontend → http://localhost:5173`);
  console.log(`   API       → http://localhost:${PORT}/health`);
  console.log(`   Mode      → Preview (no DB, no Redis, no Bull)`);
} catch (err) {
  console.error('❌ Failed to start:', err.message);
  process.exit(1);
}
