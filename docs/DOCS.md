# Documentação completa — ClaimOS

Documentação do DApp **ClaimOS**: uso, configuração, deploy e referência técnica.

---

## 1. O que é o ClaimOS

O **ClaimOS** é uma plataforma para monitorar, organizar e acompanhar airdrops de criptomoedas. Com ela você pode:

- Cadastrar airdrops (mainnet e testnet) com datas, fase, valor estimado e redes
- Vincular carteiras e acompanhar status por airdrop
- Ver painel com métricas, gráficos P&L e próximos eventos
- Usar o assistente de IA para análises e estratégias
- Gerenciar redes (RPC, explorer) em Configurações

**Stack:** Frontend React + Vite; Backend Node.js + Fastify (ou legado em JS); Supabase; OpenRouter (IA); autenticação Google + JWT.

---

## 2. Estrutura do repositório

| Parte     | Pasta      | Descrição |
|----------|------------|-----------|
| Frontend | `frontend/` | Interface: Painel, Airdrops, Portfólio, Carteiras, Alertas, Configurações, Robô de IA, Documentação |
| Backend  | `backend/`  | API: auth, airdrops, wallets, IA (OpenRouter) |

Cada parte tem seu próprio `package.json` e pode ser implantada de forma independente (ex.: Vercel + Railway).

---

## 3. Variáveis de ambiente

### Frontend (`frontend/.env`)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `VITE_APP_NAME` | Não | Nome do app (ex.: ClaimOS). Padrão: ClaimOS |
| `VITE_API_URL` | Não* | URL do backend (ex.: http://localhost:3000). *Obrigatório em produção se não usar proxy |
| `VITE_GOOGLE_CLIENT_ID` | Sim (para Google) | Client ID do Google OAuth |
| `VITE_SUPABASE_URL` | Não | URL do projeto Supabase (uso direto no cliente) |
| `VITE_SUPABASE_ANON_KEY` | Não | Chave anônima do Supabase (nunca use service_role no frontend) |

### Backend (`backend/.env`)

| Variável | Descrição |
|----------|-----------|
| `NODE_ENV` | development / production |
| `PORT` | Porta do servidor (ex.: 3000) |
| `CORS_ORIGIN` | Origem permitida (ex.: http://localhost:5173) |
| `GOOGLE_CLIENT_ID` | Client ID do Google (validação do token) |
| `GOOGLE_CLIENT_SECRET` | Opcional |
| `JWT_SECRET` | Segredo para assinar o JWT de sessão |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (só no backend, nunca no frontend) |
| `OPENROUTER_API_KEY` | Chave da API OpenRouter |
| `OPENROUTER_MODEL` | Modelo (ex.: z-ai/glm-4.5-air:free) |
| `LOG_LEVEL` | info / debug / error |
| `RATE_LIMIT_MAX` | Requisições por janela |
| `RATE_LIMIT_WINDOW` | Janela (ex.: 15m) |

---

## 4. Como rodar localmente

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com GOOGLE_CLIENT_ID, JWT_SECRET, SUPABASE_*, OPENROUTER_*
npm run dev
```

Servidor sobe em `http://localhost:3000` (ou na porta definida em `PORT`).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edite .env: VITE_GOOGLE_CLIENT_ID, VITE_API_URL=http://localhost:3000
npm run dev
```

Acesse **http://localhost:5173**. O proxy do Vite encaminha `/api` para o backend.

### Rodar os dois (raiz do projeto)

```bash
npm run preview
# ou
npm run dev
```

(Conforme configurado no `package.json` da raiz.)

---

## 5. Deploy em produção

### Frontend (Vercel)

1. Conecte o repositório ao Vercel.
2. **Root Directory:** `frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. Em **Environment Variables** defina:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_API_URL` (URL do backend em produção)

### Backend (Railway / Render / outro)

1. Conecte o repositório; Root Directory = `backend`.
2. **Build:** `npm install` (e `npm run build` se for TypeScript).
3. **Start:** `npm run start` ou `node dist/index.js`.
4. No painel do provedor, configure todas as variáveis do backend (GOOGLE_CLIENT_ID, JWT_SECRET, SUPABASE_*, OPENROUTER_*, etc.).

As chaves de produção **não** são preenchidas na aba Configurações do app; use sempre o painel do provedor (Environment Variables).

---

## 6. Abas do DApp

| Aba | Descrição |
|-----|-----------|
| **Painel** | Resumo, métricas (investido, reclamado, P&L, airdrops ativos), gráficos, próximos eventos, alertas recentes, assistente de IA (colapsável). |
| **Airdrops** | Lista por rede (Todos / Mainnet / Testnet), criar, editar, remover e abrir detalhes de cada airdrop. |
| **Portfólio** | Composição, posições, Money Lego, análise de alavancagem. |
| **Transações** | Histórico e registro de transações. |
| **Carteiras** | Cadastro e gestão de endereços. |
| **Alertas** | Notificações e prioridade. |
| **Robô de IA** | Status, insights e chat com o assistente. |
| **Configurações** | Notificações, instruções de deploy, redes (RPC, explorer) para usar nos airdrops. |
| **Documentação** | Esta documentação (rota `/docs`). |

---

## 7. Redes e airdrops

- Em **Configurações → Redes** você cadastra redes (mainnet/testnet) com RPC e URLs do explorer.
- Ao criar um airdrop, escolhe uma rede da lista ou usa **"Adicionar nova rede"** para ir às configurações.
- Cada airdrop pode ter: nome, protocolo, rede, status, fase, datas (snapshot, claim, TGE, vesting), valor estimado, oferta total, categorias e carteiras vinculadas.
- Na lista de airdrops, cada card tem botão **Remover** (ícone de lixeira ao passar o mouse).

---

## 8. Autenticação

- **Entrar / Criar conta** (canto superior direito) abre o modal de login.
- Login com **Google**: configure `VITE_GOOGLE_CLIENT_ID` no frontend e `GOOGLE_CLIENT_ID` no backend. O backend valida o token e devolve um JWT.
- O JWT é armazenado no frontend e enviado no header `Authorization: Bearer <token>` nas requisições protegidas.
- A rota `/login` redireciona para a raiz; o único ponto de entrada é o botão no header.

---

## 9. API (backend)

Endpoints principais (prefixo `/api`):

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/google` | Login com Google (body: `{ credential }`) |
| GET | `/auth/me` | Dados do usuário (Bearer JWT) |
| GET | `/airdrops` | Listar airdrops do usuário |
| POST | `/airdrops` | Criar airdrop |
| PUT | `/airdrops/:id` | Atualizar airdrop |
| DELETE | `/airdrops/:id` | Remover airdrop |
| GET | `/wallets` | Listar carteiras |
| POST | `/wallets` | Adicionar carteira |
| POST | `/ai/analyze` | Analisar airdrop (OpenRouter) |
| GET | `/ai/strategy` | Estratégia geral (OpenRouter) |

O backend legado (JS) pode expor rotas adicionais (analytics, transactions, alerts, bot, etc.); o backend ClaimOS em TypeScript expõe o conjunto acima.

---

## 10. Rodapé do app

No rodapé de cada página constam:

- **Data:** © [ano] ClaimOS
- **Construído:** texto indicando a stack (React, Vite, Fastify, Supabase)
- **Documentação:** link para `/docs` (esta documentação dentro do DApp)

---

## 11. Referências

- **README.md** (raiz) — Visão geral, instalação e arquitetura.
- **frontend/README.md** — Deploy e variáveis do frontend.
- **backend/README.md** e **backend/README-CLAIMOS.md** — Deploy e variáveis do backend.
- **frontend/ENV.md** e **backend/ENV.md** — Uso do `.env` no projeto.

---

*Documentação ClaimOS — atualizada para o estado atual do DApp.*
