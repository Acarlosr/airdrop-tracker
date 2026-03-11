import { FastifyRequest, FastifyReply } from 'fastify';
import { analyzeAirdrop, getStrategy } from '../services/openrouterService.js';

interface AnalyzeBody {
  name?: string;
  description?: string;
}

export async function analyze(request: FastifyRequest<{ Body: AnalyzeBody }>, reply: FastifyReply) {
  const body = request.body ?? {};
  const name = String(body.name ?? '').trim() || 'Airdrop';
  const description = String(body.description ?? '').trim();
  const analysis = await analyzeAirdrop(name, description);
  return reply.send({ analysis });
}

export async function strategy(_request: FastifyRequest, reply: FastifyReply) {
  const strategyText = await getStrategy();
  return reply.send({ strategy: strategyText });
}
