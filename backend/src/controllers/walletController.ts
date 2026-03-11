import { FastifyRequest, FastifyReply } from 'fastify';
import { getWalletsByUserId, createWallet } from '../services/supabaseService.js';

interface CreateBody {
  address: string;
  label?: string | null;
  network?: string | null;
}

function getUserId(request: FastifyRequest, reply: FastifyReply): string | null {
  const user = request.user;
  if (!user?.sub) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  return user.sub;
}

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const userId = getUserId(request, reply);
  if (userId === null) return;
  const list = await getWalletsByUserId(userId);
  return reply.send({ wallets: list });
}

export async function create(request: FastifyRequest<{ Body: CreateBody }>, reply: FastifyReply) {
  const userId = getUserId(request, reply);
  if (userId === null) return;
  const body = request.body;
  if (!body?.address?.trim()) {
    return reply.status(400).send({ error: 'address is required' });
  }
  const wallet = await createWallet(userId, {
    address: body.address.trim(),
    label: body.label ?? null,
    network: body.network ?? null,
  });
  return reply.status(201).send(wallet);
}
