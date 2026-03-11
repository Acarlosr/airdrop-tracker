# Como usar o .env no seu projeto (frontend)

1. **Copie o exemplo**
   ```bash
   cp .env.example .env
   ```

2. **Preencha no Cursor (ou no `.env` na raiz do frontend)**

   ```env
   VITE_APP_NAME=ClaimOS
   VITE_API_URL=http://localhost:3000
   VITE_GOOGLE_CLIENT_ID=1092509332412-si1upsj1hp61bgv6fbso9ch1j417t1k2.apps.googleusercontent.com

   VITE_SUPABASE_URL=https://otntqxsnhueunulazbag.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
   ```

   - **VITE_APP_NAME** — Nome exibido no app (sidebar, tela de login).
   - **VITE_API_URL** — URL do backend. Com `http://localhost:3000`, as chamadas vão para `http://localhost:3000/api`. Em dev com proxy do Vite, pode deixar vazio para usar `/api` no mesmo host.
   - **VITE_GOOGLE_CLIENT_ID** — Client ID do Google OAuth (obrigatório para login com Google).
   - **VITE_SUPABASE_URL** e **VITE_SUPABASE_ANON_KEY** — Para usar Supabase direto no frontend (ex.: Realtime, Storage). A **anon key** é segura no frontend; **nunca** use a **service_role** aqui.

3. **Reinicie o servidor de desenvolvimento** após alterar o `.env`:
   ```bash
   npm run dev
   ```

As variáveis são lidas em `src/lib/env.js` e usadas em `api.js` (baseURL), `Login.jsx` (Google + nome do app) e `Layout.jsx` (nome do app).
