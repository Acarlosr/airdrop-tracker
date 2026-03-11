import { FastifyInstance } from 'fastify';
import * as aiController from '../controllers/aiController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export default async function aiRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);

  fastify.post('/analyze', aiController.analyze);
  fastify.get('/strategy', aiController.strategy);
}
