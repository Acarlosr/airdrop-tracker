# Como usar o .env no backend (no Cursor)

1. **Crie ou edite o arquivo `.env`** na pasta `backend/` (na raiz do backend, não na do projeto).

2. **Cole e preencha** (use seus valores reais apenas no `.env` local; nunca commite o `.env`):

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

GOOGLE_CLIENT_ID=1092509332412-....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
JWT_SECRET=gere-uma-string-longa-aleatoria-aqui

SUPABASE_URL=https://otntqxsnhueunulazbag.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=z-ai/glm-4.5-air:free

LOG_LEVEL=info
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15m
AI_ROBOT_ENABLED=true
AI_ROBOT_SCAN_INTERVAL=30
```

3. **Onde obter cada valor**
   - **GOOGLE_CLIENT_ID** / **GOOGLE_CLIENT_SECRET** — [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Credenciais → cliente OAuth 2.0.
   - **JWT_SECRET** — Gere uma string longa e aleatória (ex.: `openssl rand -base64 32`).
   - **SUPABASE_URL** / **SUPABASE_SERVICE_ROLE_KEY** — Dashboard do Supabase → Settings → API (a **service_role** é secreta; não use no frontend).
   - **OPENROUTER_API_KEY** — [OpenRouter](https://openrouter.ai/) → API Keys.

4. **Rodar o backend**
   ```bash
   cd backend
   npm run dev
   ```

**Importante:** O `.env` deve estar no `.gitignore`. Nunca commite `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY` ou `JWT_SECRET`.
