-- ═══════════════════════════════════════════════════════════════════
-- Apply-all — projeto Supabase novo do zero
--
-- Cola isto de uma vez no SQL Editor de um projeto Supabase VAZIO.
-- É a concatenação, na ordem certa, de:
--   backend/supabase-schema.sql (schema base)
--   backend/migrations/001_interactions.sql
--   backend/migrations/002_airdrop_links.sql
--   backend/migrations/003_user_plan.sql
--
-- Não é um arquivo novo de verdade — é conveniência para reconfiguração.
-- Se o projeto Supabase já tiver dados, use os arquivos originais em
-- ordem (schema → 001 → 002 → 003), não este.
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────── schema base ─────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users (google_id);

CREATE TABLE IF NOT EXISTS public.airdrops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  network TEXT,
  type TEXT,
  phase TEXT,
  potential TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_airdrops_user_id ON public.airdrops (user_id);

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT,
  network TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets (user_id);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airdrop_id UUID REFERENCES public.airdrops (id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.wallets (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_airdrop_id ON public.tasks (airdrop_id);

CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  airdrop_id UUID REFERENCES public.airdrops (id) ON DELETE SET NULL,
  type TEXT,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts (user_id);

CREATE TABLE IF NOT EXISTS public.money_lego_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airdrop_id TEXT,
  wallet_address TEXT NOT NULL,
  token_origem TEXT NOT NULL,
  protocolo_origem TEXT NOT NULL,
  posicao_origem_id INTEGER,
  token_destino TEXT NOT NULL,
  protocolo_destino TEXT NOT NULL,
  valor_usd DECIMAL DEFAULT 0,
  data_entrada TIMESTAMPTZ DEFAULT NOW(),
  risco_cascata BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'ativa',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_money_lego_wallet ON public.money_lego_positions (wallet_address);
CREATE INDEX IF NOT EXISTS idx_money_lego_airdrop ON public.money_lego_positions (airdrop_id);

CREATE TABLE IF NOT EXISTS public.defi_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  protocolo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  token TEXT NOT NULL,
  valor_usd DECIMAL DEFAULT 0,
  data_entrada TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'ativa',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defi_wallet ON public.defi_positions (wallet_address);
CREATE INDEX IF NOT EXISTS idx_defi_protocolo ON public.defi_positions (protocolo);

CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  post_id TEXT,
  content TEXT NOT NULL,
  parsed_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_source ON public.social_posts (source);
CREATE INDEX IF NOT EXISTS idx_social_created ON public.social_posts (created_at DESC);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations (user_id);

CREATE TABLE IF NOT EXISTS public.action_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_action_queue_status ON public.action_queue (status);

CREATE TABLE IF NOT EXISTS public.airdrop_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id TEXT,
  origin TEXT,
  event_type TEXT,
  content TEXT,
  source_identifier TEXT,
  associated_links JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_protocol ON public.airdrop_events (protocol_id);

CREATE TABLE IF NOT EXISTS public.airdrop_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.airdrop_events (id) ON DELETE SET NULL,
  alert_type TEXT,
  priority TEXT,
  message TEXT,
  associated_dates JSONB DEFAULT '{}',
  associated_links JSONB DEFAULT '[]',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_priority ON public.airdrop_alerts (priority);
CREATE INDEX IF NOT EXISTS idx_alerts_ack ON public.airdrop_alerts (acknowledged);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_lego_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defi_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrop_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrop_alerts ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','airdrops','wallets','tasks','alerts',
    'money_lego_positions','defi_positions','social_posts','conversations',
    'action_queue','airdrop_events','airdrop_alerts']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND policyname = 'Backend only ' || t
    ) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (false)', 'Backend only ' || t, t);
    END IF;
  END LOOP;
END
$$;

-- ───────────────────────── migração 001 ────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interaction_kind') THEN
    CREATE TYPE public.interaction_kind AS ENUM (
      'check-in', 'register', 'mint', 'swap', 'bridge', 'stake',
      'claim', 'referral', 'ai-task', 'transfer', 'social', 'outro'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users (id)     ON DELETE CASCADE,
  airdrop_id UUID NOT NULL REFERENCES public.airdrops (id)  ON DELETE CASCADE,
  wallet_id  UUID          REFERENCES public.wallets (id)   ON DELETE SET NULL,
  kind public.interaction_kind NOT NULL,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  network       TEXT,
  chain_id      INTEGER,
  tx_hash       TEXT,
  gas_cost      NUMERIC(38, 18),
  gas_currency  TEXT,
  points        NUMERIC(20, 4),
  note          TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT interactions_gas_cost_non_negative CHECK (gas_cost IS NULL OR gas_cost >= 0),
  CONSTRAINT interactions_chain_id_positive     CHECK (chain_id IS NULL OR chain_id > 0)
);

CREATE INDEX IF NOT EXISTS idx_interactions_streak
  ON public.interactions (airdrop_id, wallet_id, kind, occurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions (user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_airdrop_id ON public.interactions (airdrop_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_date
  ON public.interactions (user_id, occurred_on DESC);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'interactions' AND policyname = 'Backend only interactions'
  ) THEN
    CREATE POLICY "Backend only interactions" ON public.interactions FOR ALL USING (false);
  END IF;
END
$$;

-- ───────────────────────── migração 002 ────────────────────────────

ALTER TABLE public.airdrops
  ADD COLUMN IF NOT EXISTS links    JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS criteria JSONB NOT NULL DEFAULT '{}';

-- ───────────────────────── migração 003 ────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_plan_valid') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_plan_valid CHECK (plan IN ('free', 'pro'));
  END IF;
END
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Fim. Confira no dashboard: Table Editor deve mostrar users, airdrops,
-- wallets, tasks, alerts, interactions e as demais tabelas acima.
-- ═══════════════════════════════════════════════════════════════════
