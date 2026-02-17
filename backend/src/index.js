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
