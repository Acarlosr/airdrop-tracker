/**
 * Variáveis de ambiente do frontend (Vite).
 * Use apenas variáveis VITE_* — nunca coloque SUPABASE_SERVICE_ROLE_KEY ou OPENROUTER_API_KEY aqui.
 * Referências explícitas para o Vite embutir em build.
 */
export const env = {
  APP_NAME: (import.meta.env.VITE_APP_NAME ?? 'ClaimOS'),
  API_URL: (import.meta.env.VITE_API_URL ?? ''),
  GOOGLE_CLIENT_ID: (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''),
  SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL ?? ''),
  SUPABASE_ANON_KEY: (import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''),
};
