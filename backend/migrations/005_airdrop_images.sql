-- Prints/screenshots por airdrop. Arquivos ficam no Supabase Storage
-- (bucket privado "airdrop-images"); esta tabela guarda só a referência.
-- Acesso sempre via backend (service_role) — mesmo padrão de RLS do resto do projeto.

CREATE TABLE IF NOT EXISTS public.airdrop_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airdrop_id UUID NOT NULL REFERENCES public.airdrops (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_airdrop_images_airdrop ON public.airdrop_images (airdrop_id);

ALTER TABLE public.airdrop_images ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'airdrop_images' AND policyname = 'airdrop_images_no_direct_access'
  ) THEN
    CREATE POLICY airdrop_images_no_direct_access ON public.airdrop_images FOR ALL USING (false);
  END IF;
END $$;

-- Bucket privado para os arquivos. Sem policies de storage.objects: só o
-- backend (service_role) acessa, do mesmo jeito que as tabelas acima.
INSERT INTO storage.buckets (id, name, public)
VALUES ('airdrop-images', 'airdrop-images', false)
ON CONFLICT (id) DO NOTHING;
