# ClaimOS — Backend

API do **ClaimOS** (Node.js + Fastify): autenticação (Google OTP), CRUD de airdrops, elegibilidade, IA, blockchain e monitoramento.

Este diretório é **independente** do frontend. Pode ser implantado sozinho (ex.: Railway, Render) e expor uma URL base para o frontend em produção.

## Desenvolvimento local

```bash
cd backend
npm install
cp .env.example .env
# Configure as variáveis no .env (DATABASE_URL, REDIS_URL, chaves de API, etc.)
npm run dev
```

A API sobe em `http://localhost:3000`. O frontend em dev usa proxy para `/api` nessa porta.

## Scripts

- `npm run dev` — servidor com hot-reload (nodemon)
- `npm run start` — servidor em produção (`node src/index.js`)
- `npm run db:setup` — setup/migrações do banco (se existir script)
- `npm run batch` — processamento em lote (se configurado)

## Deploy (ex.: Railway / Render)

1. Crie um novo serviço conectado a este repositório.
2. **Root Directory:** `backend` (obrigatório).
3. **Build Command:** `npm install` (ou deixe o padrão do provedor).
4. **Start Command:** `npm run start` ou `node src/index.js`
5. **Variáveis de ambiente** — configure no painel do provedor (não commite `.env`):
   - `PORT` — geralmente definido pelo provedor (Railway/Render injetam automaticamente).
   - `NODE_ENV=production`
   - `DATABASE_URL` — PostgreSQL (ex.: Supabase).
   - `REDIS_URL` — opcional; sem Redis, OTP/sessão funcionam em modo dev.
   - `JWT_SECRET` — obrigatório em produção.
   - Chaves de API conforme `.env.example`: Google OAuth, Groq/OpenRouter, Moralis, etc.

Após o deploy, use a URL do backend (ex.: `https://seu-backend.railway.app`) como `VITE_API_URL` no frontend (Vercel) para que o app em produção chame a API correta.

## Estrutura relevante

- `src/` — rotas, serviços (auth, IA, blockchain), config (DB, Redis).
- `src/index.js` — entrada do servidor Fastify.
- `.env.example` — lista de variáveis; copie para `.env` local e preencha.
