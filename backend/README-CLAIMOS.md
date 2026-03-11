# ClaimOS Backend (TypeScript)

Backend do ClaimOS com **Fastify**, **TypeScript**, **Supabase** (service_role), **Google Sign-In** e **OpenRouter**.

## Estrutura

```
backend/
├── src/
│   ├── controllers/   # auth, airdrop, wallet, ai
│   ├── routes/        # auth, airdrops, wallets, ai
│   ├── services/      # googleAuth, supabase, openrouter
│   ├── middlewares/   # requireAuth
│   ├── lib/           # supabaseAdmin, env
│   └── index.ts
├── supabase-schema.sql # SQL para criar tabelas no Supabase
├── .env.example
├── package.json
└── tsconfig.json
```

## Como rodar

1. **Instalar dependências**

   ```bash
   cd backend
   npm install
   ```

2. **Configurar ambiente**

   ```bash
   cp .env.example .env
   # Edite .env e preencha:
   # - GOOGLE_CLIENT_ID
   # - JWT_SECRET
   # - SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
   # - OPENROUTER_API_KEY (para rotas /ai)
   ```

3. **Criar tabelas no Supabase**

   - Abra o [Dashboard do Supabase](https://supabase.com/dashboard) → seu projeto → **SQL Editor**.
   - Cole o conteúdo de `supabase-schema.sql` e execute.

4. **Subir o servidor**

   ```bash
   npm run dev
   ```

   O backend sobe em `http://localhost:3000`. Rotas sob `/api` (ex.: `POST /api/auth/google`, `GET /api/airdrops`).

## Scripts

- `npm run dev` — desenvolvimento com hot-reload (`tsx watch`)
- `npm run build` — compila TypeScript para `dist/`
- `npm run start` — roda `node dist/index.js` (produção)
- `npm run typecheck` — verifica tipos sem gerar arquivos

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/google | Login com Google (body: `{ credential }`) |
| GET | /api/auth/me | Dados do usuário (Bearer JWT) |
| GET | /api/airdrops | Listar airdrops do usuário |
| POST | /api/airdrops | Criar airdrop |
| PUT | /api/airdrops/:id | Atualizar airdrop |
| DELETE | /api/airdrops/:id | Deletar airdrop |
| GET | /api/wallets | Listar carteiras |
| POST | /api/wallets | Adicionar carteira |
| POST | /api/ai/analyze | Analisar airdrop (OpenRouter) |
| GET | /api/ai/strategy | Estratégia geral (OpenRouter) |

## Regras

- **SUPABASE_SERVICE_ROLE_KEY** e **OPENROUTER_API_KEY** só no backend; nunca no frontend.
- Todo acesso ao Supabase usa o client com **service_role**.
- Token Google é sempre validado no servidor com **google-auth-library**.
- JWT com expiração de 7 dias; CORS apenas para `CORS_ORIGIN`.
