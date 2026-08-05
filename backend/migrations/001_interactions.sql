-- ═══════════════════════════════════════════════════════════════════
-- Migração 001 — Log de interações de farming
--
-- Registra CADA ação feita num airdrop (check-in diário, mint, swap…),
-- por carteira, ao longo do tempo. É a base para calcular streak,
-- custo acumulado de gás e o painel "o que fazer hoje".
--
-- Por que não usar `public.tasks`: lá `completed` é BOOLEAN — modela
-- tarefa feita UMA vez ("mintar o Pioneer Badge"). Não guarda histórico,
-- então não dá para calcular sequência de dias.
--
-- Idempotente: pode rodar mais de uma vez sem erro.
-- Aplicar no Supabase (SQL Editor) — é lá que vivem users/airdrops/wallets.
-- ═══════════════════════════════════════════════════════════════════

-- ── Tipos de interação (lista fixa) ────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interaction_kind') THEN
    CREATE TYPE public.interaction_kind AS ENUM (
      'check-in',   -- check-in diário (alimenta o streak)
      'register',   -- registro/ativação inicial na plataforma
      'mint',       -- mint de badge ou NFT
      'swap',       -- troca de tokens
      'bridge',     -- ponte entre redes
      'stake',      -- staking / lock
      'claim',      -- resgate de recompensa ou airdrop
      'referral',   -- indicação de usuário
      'ai-task',    -- tarefa executada via agente de IA
      'transfer',   -- envio simples
      'social',     -- ação social (follow, retweet, Discord)
      'outro'       -- escape: nunca ficar preso por falta de tipo
    );
  END IF;
END
$$;

-- ── Tabela ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id    UUID NOT NULL REFERENCES public.users (id)     ON DELETE CASCADE,
  airdrop_id UUID NOT NULL REFERENCES public.airdrops (id)  ON DELETE CASCADE,
  -- Carteira é opcional: nem toda interação é on-chain (ex.: seguir no X).
  -- ON DELETE SET NULL preserva o histórico se a carteira for removida.
  wallet_id  UUID          REFERENCES public.wallets (id)   ON DELETE SET NULL,

  kind public.interaction_kind NOT NULL,

  -- Dia da interação, no fuso do usuário. É a chave do cálculo de streak:
  -- guardar só o timestamp faria "23h50" e "00h10" virarem dias diferentes
  -- conforme o fuso do servidor.
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  network       TEXT,
  chain_id      INTEGER,
  tx_hash       TEXT,
  -- NUMERIC (não float) para valores on-chain: sem erro de arredondamento.
  gas_cost      NUMERIC(38, 18),
  gas_currency  TEXT,
  points        NUMERIC(20, 4),
  note          TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT interactions_gas_cost_non_negative CHECK (gas_cost IS NULL OR gas_cost >= 0),
  CONSTRAINT interactions_chain_id_positive     CHECK (chain_id IS NULL OR chain_id > 0)
);

-- ── Índices ────────────────────────────────────────────────────────
-- Consulta mais quente: "interações deste airdrop, desta carteira, por dia"
-- (cálculo de streak). DESC porque a leitura é sempre do mais recente.
CREATE INDEX IF NOT EXISTS idx_interactions_streak
  ON public.interactions (airdrop_id, wallet_id, kind, occurred_on DESC);

CREATE INDEX IF NOT EXISTS idx_interactions_user_id
  ON public.interactions (user_id);

CREATE INDEX IF NOT EXISTS idx_interactions_airdrop_id
  ON public.interactions (airdrop_id);

-- Painel "hoje": tudo do usuário num intervalo de datas.
CREATE INDEX IF NOT EXISTS idx_interactions_user_date
  ON public.interactions (user_id, occurred_on DESC);

-- ── RLS ────────────────────────────────────────────────────────────
-- Mesma convenção das demais tabelas: acesso só pelo backend, que usa a
-- service role key. Nenhum acesso direto do cliente.
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'interactions'
      AND policyname = 'Backend only interactions'
  ) THEN
    CREATE POLICY "Backend only interactions"
      ON public.interactions FOR ALL USING (false);
  END IF;
END
$$;

-- ── Documentação ───────────────────────────────────────────────────
COMMENT ON TABLE  public.interactions IS
  'Log append-only de interações de farming. Base para streak, custo de gás e painel diário.';
COMMENT ON COLUMN public.interactions.occurred_on IS
  'Dia da interação no fuso do usuário. Chave do cálculo de streak.';
COMMENT ON COLUMN public.interactions.wallet_id IS
  'Opcional: interações off-chain não têm carteira. SET NULL preserva o histórico.';
