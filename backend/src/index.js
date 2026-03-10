import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Routes
import airdropRoutes from './routes/airdrops.js';
import eligibilityRoutes from './routes/eligibility.js';
import alertsRoutes from './routes/alerts.js';
import analyticsRoutes from './routes/analytics.js';
import walletRoutes from './routes/wallets.js';
import botRoutes from './routes/bot.js';
import socialRoutes from './routes/social.js';
import authRoutes from './routes/auth.js';
import monitoringRoutes from './routes/monitoring.js';
import transactionRoutes from './routes/transactions.js';
import aiRobotRoutes from './routes/ai-robot.js';
import { startScheduler } from './jobs/scheduler.js';
import './jobs/worker.js'; // Start worker process

// Services
import { initDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : true
});

await fastify.register(rateLimit, {
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  timeWindow: process.env.RATE_LIMIT_WINDOW || '15 minutes'
});

// Health check
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
});

// Register routes
fastify.register(airdropRoutes, { prefix: '/api/airdrops' });
fastify.register(eligibilityRoutes, { prefix: '/api/eligibility' });
fastify.register(alertsRoutes, { prefix: '/api/alerts' });
fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
fastify.register(walletRoutes, { prefix: '/api/wallets' });
fastify.register(botRoutes, { prefix: '/api/bot' });
fastify.register(socialRoutes, { prefix: '/api/social' });
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(monitoringRoutes, { prefix: '/api/monitoring' });
fastify.register(transactionRoutes, { prefix: '/api/transactions' });
fastify.register(aiRobotRoutes, { prefix: '/api/ai-robot' });

// Root info route
fastify.get('/', async () => ({
  name: 'Airdrop Tracker API',
  version: '1.0.0',
  status: 'running',
  frontend: 'http://localhost:5173',
  docs: '/api/health',
  routes: ['/api/airdrops', '/api/wallets', '/api/alerts', '/api/analytics', '/api/eligibility', '/api/monitoring', '/api/social', '/api/bot', '/api/auth', '/api/transactions', '/api/ai-robot'],
}));

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  reply.status(error.statusCode || 500).send({
    error: error.message || 'Internal Server Error',
    statusCode: error.statusCode || 500
  });
});

// Startup
const start = async () => {
  try {
    // Initialize database
    logger.info('Connecting to database...');
    await initDatabase();

    // Initialize Redis cache
    logger.info('Connecting to Redis...');
    await initRedis();

    // Start server
    const port = parseInt(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    logger.info(`🚀 Server running on port ${port}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🤖 AI Provider: ${process.env.USE_OLLAMA === 'true' ? 'Ollama (local)' : 'OpenRouter'}`);
    logger.info(`💾 Cache: ${process.env.REDIS_URL ? 'Redis enabled' : 'No cache'}`);

    // Start AI Robot scheduler
    if (process.env.AI_ROBOT_ENABLED !== 'false') {
      await startScheduler();
      logger.info('🤖 AI Robot automated scheduler jobs loaded');
    }

  } catch (err) {
    logger.error('Error starting server:', err);
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
