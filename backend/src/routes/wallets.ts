import { FastifyInstance } from 'fastify';
import * as walletController from '../controllers/walletController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export default async function walletsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', walletController.list);
  fastify.post('/', walletController.create);
}
