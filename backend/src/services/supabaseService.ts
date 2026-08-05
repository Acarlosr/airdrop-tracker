import crypto from 'node:crypto';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

const db = () => getSupabaseAdmin();

export interface UserRow {
  id: string;
  google_id: string;
  email: string;
  name: string | null;
  picture: string | null;
  plan?: 'free' | 'pro';
  created_at: string;
  updated_at: string;
}

/** Limites por plano. Ajustar aqui quando os planos evoluírem. */
export const PLAN_LIMITS = {
  free: { maxWallets: 3 },
  pro: { maxWallets: Infinity },
} as const;

/**
 * Retorna o plano do usuário ('free' se a coluna ainda não existir).
 */
export async function getUserPlan(userId: string): Promise<'free' | 'pro'> {
  const { data } = await db().from('users').select('plan').eq('id', userId).single();
  return data?.plan === 'pro' ? 'pro' : 'free';
}

export interface AirdropRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  network: string | null;
  type: string | null;
  phase: string | null;
  potential: string | null;
  start_date: string | null;
  end_date: string | null;
  links: Record<string, unknown> | null;
  criteria: Record<string, unknown> | null;
  created_at: string;
  updated_at?: string;
}

export interface WalletRow {
  id: string;
  user_id: string;
  address: string;
  label: string | null;
  network: string | null;
  created_at: string;
}

/**
 * Cria ou atualiza usuário pelo Google e retorna o registro.
 */
export async function upsertUserByGoogle(googleId: string, data: {
  email: string;
  name: string | null;
  picture: string | null;
}): Promise<UserRow | null> {
  const { data: existing } = await db()
    .from('users')
    .select('*')
    .eq('google_id', googleId)
    .single();

  const row = {
    google_id: googleId,
    email: data.email,
    name: data.name,
    picture: data.picture,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data: updated, error } = await db()
      .from('users')
      .update(row)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return updated as UserRow;
  }

  const { data: inserted, error } = await db()
    .from('users')
    .insert({
      ...row,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return inserted as UserRow;
}

/**
 * Busca usuário por ID.
 */
export async function getUserById(id: string): Promise<UserRow | null> {
  const { data, error } = await db().from('users').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as UserRow;
}

/**
 * Lista airdrops do usuário.
 */
export async function getAirdropsByUserId(userId: string): Promise<AirdropRow[]> {
  const { data, error } = await db()
    .from('airdrops')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AirdropRow[];
}

/**
 * Busca um airdrop do usuário por ID.
 */
export async function getAirdropById(id: string, userId: string): Promise<AirdropRow | null> {
  const { data, error } = await db()
    .from('airdrops')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return data as AirdropRow;
}

/**
 * Cria airdrop.
 */
export async function createAirdrop(userId: string, body: {
  name: string;
  description?: string | null;
  network?: string | null;
  type?: string | null;
  phase?: string | null;
  potential?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  links?: Record<string, unknown> | null;
  criteria?: Record<string, unknown> | null;
}): Promise<AirdropRow> {
  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: body.name,
    description: body.description ?? null,
    network: body.network ?? null,
    type: body.type ?? null,
    phase: body.phase ?? null,
    potential: body.potential ?? null,
    start_date: body.start_date ?? null,
    end_date: body.end_date ?? null,
    links: body.links ?? {},
    criteria: body.criteria ?? {},
    created_at: new Date().toISOString(),
  };
  const { data, error } = await db().from('airdrops').insert(row).select().single();
  if (error) throw error;
  return data as AirdropRow;
}

/**
 * Atualiza airdrop (apenas do dono).
 */
export async function updateAirdrop(id: string, userId: string, body: Partial<AirdropRow>): Promise<AirdropRow | null> {
  const { data: existing } = await db().from('airdrops').select('id').eq('id', id).eq('user_id', userId).single();
  if (!existing) return null;

  const { data, error } = await db()
    .from('airdrops')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as AirdropRow;
}

/**
 * Deleta airdrop (apenas do dono).
 */
export async function deleteAirdrop(id: string, userId: string): Promise<boolean> {
  const { error } = await db().from('airdrops').delete().eq('id', id).eq('user_id', userId);
  return !error;
}

/**
 * Lista carteiras do usuário.
 */
export async function getWalletsByUserId(userId: string): Promise<WalletRow[]> {
  const { data, error } = await db()
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as WalletRow[];
}

/**
 * Adiciona carteira ao usuário.
 */
export async function createWallet(userId: string, body: {
  address: string;
  label?: string | null;
  network?: string | null;
}): Promise<WalletRow> {
  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    address: body.address,
    label: body.label ?? null,
    network: body.network ?? null,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await db().from('wallets').insert(row).select().single();
  if (error) throw error;
  return data as WalletRow;
}
