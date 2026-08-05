-- ClaimOS — schema Supabase
-- Execute no SQL Editor do projeto Supabase (Dashboard → SQL Editor).

-- Tabela de usuários (Google Sign-In, sem Supabase Auth)
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

-- Airdrops
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

-- Carteiras
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT,
  network TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets (user_id);

-- Tarefas (por airdrop/carteira)
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

-- Alertas
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

-- RLS (opcional): desabilitar RLS para uso com service_role no backend
-- Se quiser ativar RLS depois, defina políticas por user_id.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Política para service_role bypass (service_role ignora RLS por padrão no Supabase)
-- Usuários anônimos/authenticated não acessam; apenas o backend com service_role.
CREATE POLICY "Backend only users" ON public.users FOR ALL USING (false);
CREATE POLICY "Backend only airdrops" ON public.airdrops FOR ALL USING (false);
CREATE POLICY "Backend only wallets" ON public.wallets FOR ALL USING (false);
CREATE POLICY "Backend only tasks" ON public.tasks FOR ALL USING (false);
CREATE POLICY "Backend only alerts" ON public.alerts FOR ALL USING (false);

-- Comentário: o backend usa SUPABASE_SERVICE_ROLE_KEY, que bypassa RLS.
-- Essas políticas garantem que nenhum client (anon/authenticated) acesse direto.

-- =========================================================================
-- Tabelas adicionais (implementadas no código, faltando no schema original)
-- =========================================================================

-- Posições Money Lego (cadeias de composição DeFi)
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

-- Posições DeFi genéricas (staking, lending, borrowing, LP, looping)
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

-- Social posts (feed agregado Twitter/Discord)
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

-- Conversas do bot de IA
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations (user_id);

-- Fila de ações (automação)
CREATE TABLE IF NOT EXISTS public.action_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_action_queue_status ON public.action_queue (status);

-- Eventos de monitoramento de protocolos
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

-- Alertas de monitoramento
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

-- RLS para tabelas adicionais
ALTER TABLE public.money_lego_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defi_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrop_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrop_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backend only money_lego" ON public.money_lego_positions FOR ALL USING (false);
CREATE POLICY "Backend only defi" ON public.defi_positions FOR ALL USING (false);
CREATE POLICY "Backend only social" ON public.social_posts FOR ALL USING (false);
CREATE POLICY "Backend only conversations" ON public.conversations FOR ALL USING (false);
CREATE POLICY "Backend only action_queue" ON public.action_queue FOR ALL USING (false);
CREATE POLICY "Backend only events" ON public.airdrop_events FOR ALL USING (false);
CREATE POLICY "Backend only alerts" ON public.airdrop_alerts FOR ALL USING (false);
