import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middlewares/requireAuth.js';
import { getSettings, putSettings, testTelegram, getFreeModels } from '../controllers/settingsController.js';

export default async function settingsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', getSettings);
  fastify.put('/', putSettings);
  fastify.post('/test-telegram', testTelegram);
  fastify.get('/free-models', getFreeModels);
}
