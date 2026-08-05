import crypto from 'node:crypto';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

const db = () => getSupabaseAdmin();

/** Tipos de interação — espelha o ENUM public.interaction_kind da migração 001. */
export const INTERACTION_KINDS = [
  'check-in',
  'register',
  'mint',
  'swap',
  'bridge',
  'stake',
  'claim',
  'referral',
  'ai-task',
  'transfer',
  'social',
  'outro',
] as const;

export type InteractionKind = (typeof INTERACTION_KINDS)[number];

export interface InteractionRow {
  id: string;
  user_id: string;
  airdrop_id: string;
  wallet_id: string | null;
  kind: InteractionKind;
  occurred_on: string;
  occurred_at: string;
  network: string | null;
  chain_id: number | null;
  tx_hash: string | null;
  gas_cost: string | null;
  gas_currency: string | null;
  points: string | null;
  note: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateInteractionInput {
  airdrop_id: string;
  wallet_id?: string | null;
  kind: InteractionKind;
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

/** Data de hoje em YYYY-MM-DD (fuso do servidor; o cliente pode mandar a dele). */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Registra uma interação. Retorna null se o airdrop não pertencer ao usuário.
 */
export async function createInteraction(
  userId: string,
  input: CreateInteractionInput,
): Promise<InteractionRow | null> {
  const { data: airdrop } = await db()
    .from('airdrops')
    .select('id')
    .eq('id', input.airdrop_id)
    .eq('user_id', userId)
    .single();
  if (!airdrop) return null;

  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    airdrop_id: input.airdrop_id,
    wallet_id: input.wallet_id ?? null,
    kind: input.kind,
    occurred_on: input.occurred_on ?? todayISO(),
    occurred_at: new Date().toISOString(),
    network: input.network ?? null,
    chain_id: input.chain_id ?? null,
    tx_hash: input.tx_hash ?? null,
    gas_cost: input.gas_cost ?? null,
    gas_currency: input.gas_currency ?? null,
    points: input.points ?? null,
    note: input.note ?? null,
    metadata: input.metadata ?? {},
    created_at: new Date().toISOString(),
  };

  const { data, error } = await db().from('interactions').insert(row).select().single();
  if (error) throw error;
  return data as InteractionRow;
}

/**
 * Lista interações de um airdrop do usuário (mais recentes primeiro).
 */
export async function listInteractionsByAirdrop(
  userId: string,
  airdropId: string,
  limit = 100,
): Promise<InteractionRow[]> {
  const { data, error } = await db()
    .from('interactions')
    .select('*')
    .eq('user_id', userId)
    .eq('airdrop_id', airdropId)
    .order('occurred_on', { ascending: false })
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as InteractionRow[];
}

export interface StreakInfo {
  /** Dias consecutivos com check-in, terminando hoje ou ontem. */
  streak: number;
  /** true se já houve check-in hoje. */
  checkedInToday: boolean;
  lastCheckIn: string | null;
}

/**
 * Calcula o streak de check-ins de um airdrop.
 * Regra: dias consecutivos com pelo menos um check-in, contando a partir
 * de hoje (ou de ontem, se hoje ainda não houve — o streak ainda não quebrou).
 */
export async function getStreak(userId: string, airdropId: string): Promise<StreakInfo> {
  const { data, error } = await db()
    .from('interactions')
    .select('occurred_on')
    .eq('user_id', userId)
    .eq('airdrop_id', airdropId)
    .eq('kind', 'check-in')
    .order('occurred_on', { ascending: false })
    .limit(400);
  if (error) throw error;

  const days = [...new Set(((data ?? []) as { occurred_on: string }[]).map((r) => r.occurred_on))];
  if (days.length === 0) return { streak: 0, checkedInToday: false, lastCheckIn: null };

  const today = todayISO();
  const MS_DAY = 86_400_000;
  const yesterday = new Date(Date.parse(today) - MS_DAY).toISOString().slice(0, 10);

  const checkedInToday = days[0] === today;
  if (days[0] !== today && days[0] !== yesterday) {
    return { streak: 0, checkedInToday: false, lastCheckIn: days[0] };
  }

  let streak = 1;
  for (let i = 1; i < days.length; i += 1) {
    const gap = (Date.parse(days[i - 1]) - Date.parse(days[i])) / MS_DAY;
    if (gap === 1) streak += 1;
    else break;
  }
  return { streak, checkedInToday, lastCheckIn: days[0] };
}

export interface TodayItem {
  airdrop_id: string;
  name: string;
  network: string | null;
  phase: string | null;
  potential: string | null;
  streak: number;
  checkedInToday: boolean;
  lastCheckIn: string | null;
}

/**
 * Painel "hoje": airdrops do usuário com o estado do check-in de cada um,
 * ordenados por risco de perder o streak (maior streak pendente primeiro).
 */
export async function getTodayPanel(userId: string): Promise<TodayItem[]> {
  const { data: airdrops, error } = await db()
    .from('airdrops')
    .select('id, name, network, phase, potential')
    .eq('user_id', userId);
  if (error) throw error;

  const items: TodayItem[] = [];
  for (const a of (airdrops ?? []) as {
    id: string;
    name: string;
    network: string | null;
    phase: string | null;
    potential: string | null;
  }[]) {
    const s = await getStreak(userId, a.id);
    items.push({
      airdrop_id: a.id,
      name: a.name,
      network: a.network,
      phase: a.phase,
      potential: a.potential,
      streak: s.streak,
      checkedInToday: s.checkedInToday,
      lastCheckIn: s.lastCheckIn,
    });
  }

  return items.sort((x, y) => {
    if (x.checkedInToday !== y.checkedInToday) return x.checkedInToday ? 1 : -1;
    return y.streak - x.streak;
  });
}
