import { FastifyInstance } from 'fastify';
import { loginWithGoogle, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/google', loginWithGoogle);
  fastify.get('/me', { preHandler: [requireAuth] }, getMe);
}
