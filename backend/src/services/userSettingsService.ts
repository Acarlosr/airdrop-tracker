import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { encryptSecret, decryptSecret, previewSecret } from '../lib/crypto.js';

const db = () => getSupabaseAdmin();

interface UserSettingsRow {
  telegram_bot_token_enc: string | null;
  telegram_chat_id: string | null;
  openrouter_api_key_enc: string | null;
  openrouter_model: string | null;
  daily_brief_enabled: boolean | null;
}

/** Visão segura (sem segredos em texto puro) para mostrar na tela de Configurações. */
export interface UserSettingsView {
  telegramConfigured: boolean;
  telegramChatId: string | null;
  telegramTokenPreview: string | null;
  openrouterConfigured: boolean;
  openrouterKeyPreview: string | null;
  openrouterModel: string;
  dailyBriefEnabled: boolean;
}

/** Visão interna (com segredos decifrados) para uso só dentro do backend ao enviar mensagens. */
export interface UserSettingsSecrets {
  telegramBotToken: string | null;
  telegramChatId: string | null;
  openrouterApiKey: string | null;
  openrouterModel: string;
  dailyBriefEnabled: boolean;
}

async function fetchRow(userId: string): Promise<UserSettingsRow | null> {
  const { data, error } = await db()
    .from('users')
    .select('telegram_bot_token_enc, telegram_chat_id, openrouter_api_key_enc, openrouter_model, daily_brief_enabled')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data as UserSettingsRow;
}

export async function getUserSettingsView(userId: string): Promise<UserSettingsView> {
  const row = await fetchRow(userId);
  const telegramToken = row?.telegram_bot_token_enc ? safeDecrypt(row.telegram_bot_token_enc) : null;
  const openrouterKey = row?.openrouter_api_key_enc ? safeDecrypt(row.openrouter_api_key_enc) : null;

  return {
    telegramConfigured: !!(telegramToken && row?.telegram_chat_id),
    telegramChatId: row?.telegram_chat_id ?? null,
    telegramTokenPreview: telegramToken ? previewSecret(telegramToken) : null,
    openrouterConfigured: !!openrouterKey,
    openrouterKeyPreview: openrouterKey ? previewSecret(openrouterKey) : null,
    openrouterModel: row?.openrouter_model ?? 'z-ai/glm-4.5-air:free',
    dailyBriefEnabled: row?.daily_brief_enabled ?? false,
  };
}

/** Usado internamente (envio de mensagens) — nunca expor via API. */
export async function getUserSettingsSecrets(userId: string): Promise<UserSettingsSecrets> {
  const row = await fetchRow(userId);
  return {
    telegramBotToken: row?.telegram_bot_token_enc ? safeDecrypt(row.telegram_bot_token_enc) : null,
    telegramChatId: row?.telegram_chat_id ?? null,
    openrouterApiKey: row?.openrouter_api_key_enc ? safeDecrypt(row.openrouter_api_key_enc) : null,
    openrouterModel: row?.openrouter_model ?? 'z-ai/glm-4.5-air:free',
    dailyBriefEnabled: row?.daily_brief_enabled ?? false,
  };
}

function safeDecrypt(stored: string): string | null {
  try {
    return decryptSecret(stored);
  } catch {
    return null;
  }
}

export interface SaveSettingsInput {
  telegramBotToken?: string | null;
  telegramChatId?: string | null;
  openrouterApiKey?: string | null;
  openrouterModel?: string | null;
  dailyBriefEnabled?: boolean;
}

/**
 * Salva as configurações do usuário. Campos omitidos (undefined) não são
 * tocados; enviar string vazia '' remove o valor (desconfigura).
 */
export async function saveUserSettings(userId: string, input: SaveSettingsInput): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.telegramBotToken !== undefined) {
    update.telegram_bot_token_enc = input.telegramBotToken ? encryptSecret(input.telegramBotToken) : null;
  }
  if (input.telegramChatId !== undefined) {
    update.telegram_chat_id = input.telegramChatId || null;
  }
  if (input.openrouterApiKey !== undefined) {
    update.openrouter_api_key_enc = input.openrouterApiKey ? encryptSecret(input.openrouterApiKey) : null;
  }
  if (input.openrouterModel !== undefined) {
    update.openrouter_model = input.openrouterModel || 'z-ai/glm-4.5-air:free';
  }
  if (input.dailyBriefEnabled !== undefined) {
    update.daily_brief_enabled = input.dailyBriefEnabled;
  }

  const { error } = await db().from('users').update(update).eq('id', userId);
  if (error) throw error;
}

/** Todos os usuários com o resumo diário habilitado e Telegram configurado. */
export async function listDailyBriefRecipients(): Promise<string[]> {
  const { data, error } = await db()
    .from('users')
    .select('id, telegram_bot_token_enc, telegram_chat_id, daily_brief_enabled')
    .eq('daily_brief_enabled', true);
  if (error || !data) return [];
  return (data as Array<{ id: string; telegram_bot_token_enc: string | null; telegram_chat_id: string | null }>)
    .filter((u) => u.telegram_bot_token_enc && u.telegram_chat_id)
    .map((u) => u.id);
}
