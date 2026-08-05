import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';

import { env } from './lib/env.js';

// ── Auth + TypeScript routes ──────────────────────────────────────
import authRoutes from './routes/auth.js';
import airdropsRoutes from './routes/airdrops.js';
import walletsRoutes from './routes/wallets.js';
import aiRoutes from './routes/ai.js';
import interactionsRoutes from './routes/interactions.js';
import briefRoutes from './routes/brief.js';
import settingsRoutes from './routes/settings.js';
import { startDailyBriefScheduler } from './services/dailyBriefService.js';

// ── JavaScript ESM routes (convivem com TypeScript via tsx) ───────
import eligibilityRoutes from './routes/eligibility.js';
import alertsRoutes from './routes/alerts.js';
import analyticsRoutes from './routes/analytics.js';
import botRoutes from './routes/bot.js';
import socialRoutes from './routes/social.js';
import monitoringRoutes from './routes/monitoring.js';
import transactionRoutes from './routes/transactions.js';
import aiRobotRoutes from './routes/ai-robot.js';

// ── NOVAS rotas (Money Lego + DeFi Portfolio) ────────────────────
import moneyLegoRoutes from './routes/money-lego.js';
import defiPortfolioRoutes from './routes/defi-portfolio.js';

// ── Services ──────────────────────────────────────────────────────
import { initDatabase, getPool } from './config/database.js';
import { initRedis } from './config/redis.js';
import { startScheduler } from './jobs/scheduler.js';
import logger from './utils/logger.js';
import { authenticateRequest } from './services/auth.js';

const fastify = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport:
      env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss Z' } }
        : undefined,
  },
});

await fastify.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});

await fastify.register(rateLimit, {
  max: env.RATE_LIMIT_MAX,
  timeWindow: env.RATE_LIMIT_WINDOW,
});

// Upload de prints/screenshots — limite de 8MB por arquivo.
await fastify.register(multipart, {
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
});

// Todas as APIs de produto são privadas. Apenas autenticação permanece pública.
fastify.addHook('onRequest', async (request, reply) => {
  if (!request.url.startsWith('/api/') || request.url.startsWith('/api/auth/')) return;
  const user = authenticateRequest(request);
  if (!user) {
    return reply.status(401).send({ error: 'Sessão ausente, inválida ou expirada.' });
  }
  (request as typeof request & { user: unknown }).user = user;
});

fastify.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '2.0.0',
}));

fastify.get('/', async () => ({
  name: 'ClaimOS API',
  version: '2.0.0',
  status: 'running',
  routes: [
    '/api/auth', '/api/airdrops', '/api/wallets', '/api/ai',
    '/api/eligibility', '/api/alerts', '/api/analytics',
    '/api/bot', '/api/social', '/api/monitoring', '/api/transactions',
    '/api/ai-robot', '/api/money-lego', '/api/defi-portfolio',
    '/api/interactions', '/api/brief', '/api/settings',
  ],
}));

// ── TypeScript routes ─────────────────────────────────────────────
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(airdropsRoutes, { prefix: '/api/airdrops' });
fastify.register(walletsRoutes, { prefix: '/api/wallets' });
fastify.register(aiRoutes, { prefix: '/api/ai' });
fastify.register(interactionsRoutes, { prefix: '/api/interactions' });
fastify.register(briefRoutes, { prefix: '/api/brief' });
fastify.register(settingsRoutes, { prefix: '/api/settings' });

// ── JavaScript routes ─────────────────────────────────────────────
fastify.register(eligibilityRoutes, { prefix: '/api/eligibility' });
fastify.register(alertsRoutes, { prefix: '/api/alerts' });
fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
fastify.register(botRoutes, { prefix: '/api/bot' });
fastify.register(socialRoutes, { prefix: '/api/social' });
// ✅ FIX: monitoring recebe o pool do banco
fastify.register(monitoringRoutes, { prefix: '/api/monitoring', db: getPool() });
fastify.register(transactionRoutes, { prefix: '/api/transactions' });
fastify.register(aiRobotRoutes, { prefix: '/api/ai-robot' });

// ── NOVAS rotas ──────────────────────────────────────────────────
fastify.register(moneyLegoRoutes, { prefix: '/api/money-lego' });
fastify.register(defiPortfolioRoutes, { prefix: '/api/defi-portfolio' });

fastify.setErrorHandler((err, _request, reply) => {
  fastify.log.error(err);
  reply.status(err.statusCode ?? 500).send({
    error: err.message ?? 'Internal Server Error',
    statusCode: err.statusCode ?? 500,
  });
});

const start = async () => {
  try {
    if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'change-me-in-production') {
      throw new Error('JWT_SECRET must be configured in production');
    }
    // Initialize database
    logger.info('Connecting to database...');
    await initDatabase();

    // Initialize Redis cache
    logger.info('Connecting to Redis...');
    await initRedis();

    // Start server
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`ClaimOS backend running on port ${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);

    // Start AI Robot scheduler
    if (env.AI_ROBOT_ENABLED) {
      await import('./jobs/worker.js');
      await startScheduler();
      logger.info('AI Robot scheduler started');
    }

    // Resumo diário no Telegram (DAILY_BRIEF_HOUR, padrão 9h)
    startDailyBriefScheduler();
    logger.info('Daily brief scheduler started');
  } catch (err) {
    logger.error({ err }, 'Error starting server');
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
