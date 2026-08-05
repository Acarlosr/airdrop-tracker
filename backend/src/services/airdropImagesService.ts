import crypto from 'node:crypto';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { getAirdropById } from './supabaseService.js';

const db = () => getSupabaseAdmin();
const BUCKET = 'airdrop-images';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h — suficiente para exibir a galeria numa visita à página.

export interface AirdropImageRow {
  id: string;
  airdrop_id: string;
  user_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export interface AirdropImageView {
  id: string;
  caption: string | null;
  createdAt: string;
  url: string | null;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Faz upload de um print/screenshot para o Storage e cria a referência.
 * Retorna null se o airdrop não pertencer ao usuário (mesma checagem das
 * outras rotas de airdrop) ou se o tipo de arquivo não for imagem suportada.
 */
export async function uploadAirdropImage(
  userId: string,
  airdropId: string,
  file: { buffer: Buffer; mimetype: string },
  caption?: string | null,
): Promise<AirdropImageView | null> {
  const airdrop = await getAirdropById(airdropId, userId);
  if (!airdrop) return null;

  const ext = EXT_BY_MIME[file.mimetype];
  if (!ext) return null;

  const storagePath = `${userId}/${airdropId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await db()
    .storage.from(BUCKET)
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
  if (uploadError) throw uploadError;

  const row = {
    id: crypto.randomUUID(),
    airdrop_id: airdropId,
    user_id: userId,
    storage_path: storagePath,
    caption: caption ?? null,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await db().from('airdrop_images').insert(row).select().single();
  if (error) throw error;

  return toView(data as AirdropImageRow);
}

/** Lista as imagens de um airdrop do usuário, com URL assinada temporária. */
export async function listAirdropImages(userId: string, airdropId: string): Promise<AirdropImageView[]> {
  const { data, error } = await db()
    .from('airdrop_images')
    .select('*')
    .eq('user_id', userId)
    .eq('airdrop_id', airdropId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as AirdropImageRow[];
  return Promise.all(rows.map((r) => toView(r)));
}

/** Remove uma imagem (arquivo + referência). Retorna false se não existir/não for do usuário. */
export async function deleteAirdropImage(userId: string, imageId: string): Promise<boolean> {
  const { data } = await db().from('airdrop_images').select('*').eq('id', imageId).eq('user_id', userId).single();
  if (!data) return false;
  const row = data as AirdropImageRow;

  await db().storage.from(BUCKET).remove([row.storage_path]);
  const { error } = await db().from('airdrop_images').delete().eq('id', imageId).eq('user_id', userId);
  return !error;
}

async function toView(row: AirdropImageRow): Promise<AirdropImageView> {
  const { data } = await db().storage.from(BUCKET).createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
  return {
    id: row.id,
    caption: row.caption,
    createdAt: row.created_at,
    url: data?.signedUrl ?? null,
  };
}
