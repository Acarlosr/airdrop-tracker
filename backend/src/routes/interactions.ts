import { FastifyInstance } from 'fastify';
import * as interactionController from '../controllers/interactionController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export default async function interactionsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);

  fastify.post('/', interactionController.create);
  fastify.get('/today', interactionController.today);
  fastify.get('/airdrop/:airdropId', interactionController.listByAirdrop);
  fastify.get('/airdrop/:airdropId/streak', interactionController.streak);
}
