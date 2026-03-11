import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

import { env } from './lib/env.js';

import authRoutes from './routes/auth.js';
import airdropsRoutes from './routes/airdrops.js';
import walletsRoutes from './routes/wallets.js';
import aiRoutes from './routes/ai.js';

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

fastify.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
}));

fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(airdropsRoutes, { prefix: '/api/airdrops' });
fastify.register(walletsRoutes, { prefix: '/api/wallets' });
fastify.register(aiRoutes, { prefix: '/api/ai' });

fastify.setErrorHandler((err, _request, reply) => {
  fastify.log.error(err);
  reply.status(err.statusCode ?? 500).send({
    error: err.message ?? 'Internal Server Error',
    statusCode: err.statusCode ?? 500,
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    fastify.log.info(`ClaimOS backend running on port ${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
