-- ═══════════════════════════════════════════════════════════════════
-- Migração 002 — Links e critérios por airdrop
--
-- A tela de detalhe (frontend) já edita `links` (website, twitter,
-- discord) e `criteria` (guia, tags, custo, potencial), mas o banco
-- não tinha colunas para persistir — os dados morriam no estado local.
--
-- `links`: objeto { website, twitter, discord, ... } — URLs oficiais
-- do projeto (ex.: aave.com, hyperliquid.xyz, x.com/projeto).
-- `criteria`: objeto livre com guia passo-a-passo, tags e metadados.
--
-- Idempotente: pode rodar mais de uma vez sem erro.
-- Aplicar no Supabase (SQL Editor), depois da 001.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.airdrops
  ADD COLUMN IF NOT EXISTS links    JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS criteria JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.airdrops.links IS
  'URLs oficiais do projeto: { website, twitter, discord, ... }. Só links verificados pelo usuário.';
COMMENT ON COLUMN public.airdrops.criteria IS
  'Guia e metadados editáveis: { guide: {...}, tags: [...] }.';
