import { FastifyInstance } from 'fastify';
import * as airdropController from '../controllers/airdropController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export default async function airdropsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', airdropController.list);
  fastify.post('/', airdropController.create);
  fastify.put('/:id', airdropController.update);
  fastify.delete('/:id', airdropController.remove);
}
