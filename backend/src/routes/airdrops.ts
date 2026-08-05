import { FastifyInstance } from 'fastify';
import * as airdropController from '../controllers/airdropController.js';
import * as imagesController from '../controllers/airdropImagesController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export default async function airdropsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', airdropController.list);
  fastify.get('/:id', airdropController.getOne);
  fastify.post('/', airdropController.create);
  fastify.put('/:id', airdropController.update);
  fastify.patch('/:id', airdropController.update);
  fastify.delete('/:id', airdropController.remove);

  // Prints/screenshots do airdrop (Supabase Storage).
  fastify.get('/:id/images', imagesController.list);
  fastify.post('/:id/images', imagesController.upload);
  fastify.delete('/:id/images/:imageId', imagesController.remove);
}
