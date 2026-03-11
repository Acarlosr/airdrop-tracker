import { FastifyRequest, FastifyReply } from 'fastify';
import {
  getAirdropsByUserId,
  createAirdrop,
  updateAirdrop,
  deleteAirdrop,
  AirdropRow,
} from '../services/supabaseService.js';

interface CreateBody {
  name: string;
  description?: string | null;
  network?: string | null;
  type?: string | null;
  phase?: string | null;
  potential?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

interface Params { id?: string }

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
  const list = await getAirdropsByUserId(userId);
  return reply.send({ airdrops: list });
}

export async function create(request: FastifyRequest<{ Body: CreateBody }>, reply: FastifyReply) {
  const userId = getUserId(request, reply);
  if (userId === null) return;
  const body = request.body;
  if (!body?.name?.trim()) {
    return reply.status(400).send({ error: 'name is required' });
  }
  const airdrop = await createAirdrop(userId, {
    name: body.name.trim(),
    description: body.description ?? null,
    network: body.network ?? null,
    type: body.type ?? null,
    phase: body.phase ?? null,
    potential: body.potential ?? null,
    start_date: body.start_date ?? null,
    end_date: body.end_date ?? null,
  });
  return reply.status(201).send(airdrop);
}

export async function update(request: FastifyRequest<{ Params: Params; Body: Partial<CreateBody> }>, reply: FastifyReply) {
  const userId = getUserId(request, reply);
  if (userId === null) return;
  const id = request.params.id;
  if (!id) return reply.status(400).send({ error: 'id is required' });

  const body = request.body ?? {};
  const allowed: Partial<AirdropRow> = {};
  if (body.name !== undefined) allowed.name = body.name;
  if (body.description !== undefined) allowed.description = body.description;
  if (body.network !== undefined) allowed.network = body.network;
  if (body.type !== undefined) allowed.type = body.type;
  if (body.phase !== undefined) allowed.phase = body.phase;
  if (body.potential !== undefined) allowed.potential = body.potential;
  if (body.start_date !== undefined) allowed.start_date = body.start_date;
  if (body.end_date !== undefined) allowed.end_date = body.end_date;

  const airdrop = await updateAirdrop(id, userId, allowed);
  if (!airdrop) return reply.status(404).send({ error: 'Airdrop not found' });
  return reply.send(airdrop);
}

export async function remove(request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) {
  const userId = getUserId(request, reply);
  if (userId === null) return;
  const id = request.params.id;
  if (!id) return reply.status(400).send({ error: 'id is required' });

  const ok = await deleteAirdrop(id, userId);
  if (!ok) return reply.status(404).send({ error: 'Airdrop not found' });
  return reply.status(204).send();
}
