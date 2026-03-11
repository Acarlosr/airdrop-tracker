# Onde alterar — Auth no backend (mapeamento)

O backend usa **JavaScript**, não TypeScript. Abaixo está o mapeamento entre os pontos que você citou e os **arquivos reais** no backend.

---

## Mapeamento: referência → arquivo no projeto

| Você pediu (exemplo em TS) | No projeto ClaimOS (onde alterar) |
|----------------------------|-------------------------------------|
| `src/routes/auth.ts` | **`src/routes/auth.js`** — rotas POST `/google`, `/otp/verify`, `/otp/resend`, `/dev/request-otp`, GET `/me`. |
| `src/controllers/authController.ts` | **Não existe.** A lógica dos handlers está **dentro de `src/routes/auth.js`**. Para separar: crie `src/controllers/authController.js` e mova a lógica (chamadas a serviços + montagem da resposta) para funções como `loginWithGoogle`, `verifyOtp`, `getMe`; em `auth.js` só chame o controller. |
| `src/services/googleAuthService.ts` | **Parcialmente em `src/services/auth.js`** — função `verifyGoogleToken(idToken)`. Para separar: crie `src/services/googleAuthService.js` com essa função e importe em `auth.js` ou no controller. |
| `src/services/sessionService.ts` | **Parcialmente em `src/services/auth.js`** — funções `createSessionToken`, `verifySessionToken`, `setPendingUser`, `getPendingUser`, `generateAndStoreOTP`, `verifyOTP`. Para separar: crie `src/services/sessionService.js` com JWT + OTP + pending user e importe nas rotas/controller. |
| `src/lib/supabaseAdmin.ts` | **Não existe.** O projeto usa **PostgreSQL** (`src/config/database.js`) e **Redis** (`src/config/redis.js`), não Supabase Admin SDK. Se quiser usar Supabase (ex.: Auth Admin): crie `src/lib/supabaseAdmin.js` e configure o client; use onde precisar de usuários/roles no Supabase. |
| `src/middlewares/requireAuth.ts` | **`src/plugins/auth-middleware.js`** — plugin Fastify que adiciona `fastify.authenticate` (valida Bearer JWT e coloca `request.user`). **Não está registrado** em `src/index.js`; para usar: `fastify.register(require('./plugins/auth-middleware.js'))` e em rotas protegidas use `{ preHandler: [fastify.authenticate] }`. |

---

## Resumo rápido — arquivos que existem

| O que alterar | Arquivo |
|---------------|---------|
| Rotas de auth (Google, OTP, /me, dev request-otp) | **`src/routes/auth.js`** |
| Verificação Google, OTP, JWT, usuário pendente | **`src/services/auth.js`** |
| Middleware “exige autenticação” (JWT → request.user) | **`src/plugins/auth-middleware.js`** |

---

## Estrutura atual vs. estrutura “separada”

- **Hoje:** `routes/auth.js` chama diretamente `services/auth.js` (tudo em um serviço).
- **Se quiser igual ao desenho TS:**  
  - **Controller:** `src/controllers/authController.js` — funções que recebem `request/reply`, chamam serviços e enviam resposta.  
  - **Google:** `src/services/googleAuthService.js` — só `verifyGoogleToken`.  
  - **Sessão/OTP/JWT:** `src/services/sessionService.js` — `createSessionToken`, `verifySessionToken`, OTP e pending user.  
  - **Rotas:** `src/routes/auth.js` — só declara rotas e chama o controller.  
  - **Middleware:** registrar `src/plugins/auth-middleware.js` em `src/index.js` e usar `fastify.authenticate` nas rotas que exigem login.

---

## Supabase

Não há `supabaseAdmin` hoje. Persistência é PostgreSQL (config em `src/config/database.js`) e cache/sessão temporária em Redis. Para integrar Supabase Auth Admin, crie `src/lib/supabaseAdmin.js` (ou `src/config/supabase.js`) e use onde for necessário.
