import { FastifyRequest, FastifyReply } from 'fastify';
import { verifySessionToken } from '../services/googleAuthService.js';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Middleware que exige Authorization: Bearer <JWT> e preenche request.user.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);
  const payload = verifySessionToken(token);

  if (!payload) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  request.user = {
    sub: payload.sub,
    email: payload.email,
    name: payload.name ?? null,
    picture: payload.picture ?? null,
  };
}
