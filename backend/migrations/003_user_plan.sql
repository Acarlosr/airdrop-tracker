-- ═══════════════════════════════════════════════════════════════════
-- Migração 003 — Plano do usuário (base de monetização)
--
-- Adiciona `plan` em users: 'free' (padrão) ou 'pro'.
-- Nenhuma cobrança acontece aqui — o plano é atribuído manualmente
-- (ou por integração futura de billing). O backend usa o valor para
-- aplicar limites (ex.: nº de carteiras no plano free).
--
-- Idempotente: pode rodar mais de uma vez sem erro.
-- Aplicar no Supabase (SQL Editor), depois da 002.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_plan_valid'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_plan_valid CHECK (plan IN ('free', 'pro'));
  END IF;
END
$$;

COMMENT ON COLUMN public.users.plan IS
  'Plano do usuário: free (limites) ou pro. Atribuído manualmente por enquanto.';
