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
