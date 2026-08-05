import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../middlewares/requireAuth.js';
import { buildDailyBrief, sendDailyBriefForUser } from '../services/dailyBriefService.js';

export default async function briefRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);

  /** GET /api/brief/preview — mostra o resumo do dia sem enviar. */
  fastify.get('/preview', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user?.sub;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    const text = await buildDailyBrief(userId);
    return reply.send({ text });
  });

  /** POST /api/brief/send — monta e envia agora para o Telegram do usuário logado. */
  fastify.post('/send', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user?.sub;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    const result = await sendDailyBriefForUser(userId);
    return reply.status(result.sent ? 200 : 502).send(result);
  });
}
