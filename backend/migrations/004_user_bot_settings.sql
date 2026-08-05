-- Configuração por usuário do robô do Telegram + chave OpenRouter.
-- Tokens ficam cifrados (AES-256-GCM) antes de chegar aqui — o backend
-- nunca grava texto puro nestas colunas. Ver backend/src/lib/crypto.ts.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS telegram_bot_token_enc TEXT,
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS openrouter_api_key_enc TEXT,
  ADD COLUMN IF NOT EXISTS openrouter_model TEXT NOT NULL DEFAULT 'z-ai/glm-4.5-air:free',
  ADD COLUMN IF NOT EXISTS daily_brief_enabled BOOLEAN NOT NULL DEFAULT false;
