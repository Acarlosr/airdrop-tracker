import { FastifyRequest, FastifyReply } from 'fastify';
import {
  createInteraction,
  listInteractionsByAirdrop,
  getStreak,
  getTodayPanel,
  INTERACTION_KINDS,
  InteractionKind,
  CreateInteractionInput,
} from '../services/interactionsService.js';

interface CreateBody {
  airdrop_id?: string;
  wallet_id?: string | null;
  kind?: string;
  occurred_on?: string;
  network?: string | null;
  chain_id?: number | null;
  tx_hash?: string | null;
  gas_cost?: number | null;
  gas_currency?: string | null;
  points?: number | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
}

function getUserId(request: FastifyRequest, reply: FastifyReply): string | null {
  const user = request.user;
  if (!user?.sub) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  return user.sub;
}

function isKind(value: string): value is InteractionKind {
  return (INTERACTION_KINDS as readonly string[]).includes(value);
}

/** POST /api/interactions — registra uma interação (check-in, mint, swap…). */
export async function create(
  request: FastifyRequest<{ Body: CreateBody }>,
  reply: FastifyReply,
) {
  const userId = getUserId(request, reply);
  if (userId === null) return;

  const body = request.body ?? {};
  if (!body.airdrop_id) {
    return reply.status(400).send({ error: 'airdrop_id é obrigatório' });
  }
  if (!body.kind || !isKind(body.kind)) {
    return reply
      .status(400)
      .send({ error: `kind inválido. Valores aceitos: ${INTERACTION_KINDS.join(', ')}` });
  }
  if (body.occurred_on && !/^\d{4}-\d{2}-\d{2}$/.test(body.occurred_on)) {
    return reply.status(400).send({ error: 'occurred_on deve ser YYYY-MM-DD' });
  }

  const input: CreateInteractionInput = {
    airdrop_id: body.airdrop_id,
    wallet_id: body.wallet_id ?? null,
    kind: body.kind,
    occurred_on: body.occurred_on,
    network: body.network ?? null,
    chain_id: body.chain_id ?? null,
    tx_hash: body.tx_hash ?? null,
    gas_cost: body.gas_cost ?? null,
    gas_currency: body.gas_currency ?? null,
    points: body.points ?? null,
    note: body.note ?? null,
    metadata: body.metadata ?? {},
  };

  const row = await createInteraction(userId, input);
  if (!row) return reply.status(404).send({ error: 'Airdrop não encontrado' });
  return reply.status(201).send(row);
}

/** GET /api/interactions/airdrop/:airdropId — histórico de um airdrop. */
export async function listByAirdrop(
  request: FastifyRequest<{ Params: { airdropId: string } }>,
  reply: FastifyReply,
) {
  const userId = getUserId(request, reply);
  if (userId === null) return;
  const interactions = await listInteractionsByAirdrop(userId, request.params.airdropId);
  return reply.send({ interactions });
}

/** GET /api/interactions/airdrop/:airdropId/streak — streak de check-ins. */
export async function streak(
  request: FastifyRequest<{ Params: { airdropId: string } }>,
  reply: FastifyReply,
) {
  const userId = getUserId(request, reply);
  if (userId === null) return;
  const info = await getStreak(userId, request.params.airdropId);
  return reply.send(info);
}

/** GET /api/interactions/today — painel "hoje" ordenado por risco de perder streak. */
export async function today(request: FastifyRequest, reply: FastifyReply) {
  const userId = getUserId(request, reply);
  if (userId === null) return;
  const items = await getTodayPanel(userId);
  return reply.send({ items });
}
