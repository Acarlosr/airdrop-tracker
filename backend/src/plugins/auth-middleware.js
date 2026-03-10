import fp from 'fastify-plugin';
import { verifySessionToken } from '../services/auth.js';
import logger from '../utils/logger.js';

/**
 * Fastify auth middleware plugin.
 * Adds `fastify.authenticate` preHandler that validates JWT
 * and attaches decoded user to `request.user`.
 *
 * Usage in routes:
 *   fastify.get('/protected', { preHandler: [fastify.authenticate] }, handler)
 */
async function authMiddleware(fastify) {
    fastify.decorate('authenticate', async (request, reply) => {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.slice(7);
        const decoded = verifySessionToken(token);

        if (!decoded) {
            return reply.code(401).send({ error: 'Invalid or expired token' });
        }

        request.user = decoded;
    });
}

export default fp(authMiddleware, {
    name: 'auth-middleware',
});
