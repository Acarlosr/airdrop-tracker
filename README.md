# 🤖 ClaimOS — Automação de Airdrops com IA

Plataforma de monitoramento, análise e automação de airdrops com foco em baixo custo, elegibilidade e inteligência operacional.

A **ClaimOS** centraliza descoberta de oportunidades, monitoramento social, análise multi-chain, checagem de carteiras e alertas inteligentes em uma única experiência.

---

## 📁 Estrutura do repositório (Frontend e Backend separados)

O repositório está organizado em **duas partes bem separadas** para facilitar o deploy em provedores diferentes e manter atualizações independentes:

| Parte      | Diretório   | Deploy recomendado | Descrição |
|-----------|-------------|----------------------|-----------|
| **Frontend** | [`frontend/`](./frontend) | **Vercel** (ou Netlify, etc.) | App React (Vite): painel, airdrops, portfólio, login. Configure **Root Directory = `frontend`** e variáveis `VITE_*`. |
| **Backend**  | [`backend/`](./backend)  | **Railway**, **Render** ou similar | API Fastify: auth, CRUD airdrops, IA, blockchain. Configure **Root Directory = `backend`** e variáveis de ambiente (DB, Redis, API keys). |

- **Frontend:** ver [frontend/README.md](./frontend/README.md) para comandos locais e instruções de deploy (Vercel).
- **Backend:** ver [backend/README.md](./backend/README.md) para comandos locais e deploy (Railway/Render).

Cada serviço tem seu próprio `package.json` e pode ser implantado de forma **independente**. No Vercel, aponte o projeto para a pasta `frontend`; no Railway/Render, aponte para a pasta `backend`. Depois, defina `VITE_API_URL` no frontend com a URL do backend em produção.

---

## 🌟 Características

- **💰 Low-Cost by Design** - Arquitetura otimizada para tier gratuito
- **🤖 IA Multi-Model** - Ollama local + OpenRouter + Groq
- **⛓️ Multi-Chain** - Ethereum, Arbitrum, Optimism, Base, Polygon
- **📱 Monitoramento Social** - Twitter/X e Discord
- **🔔 Alertas Inteligentes** - Telegram e Discord webhooks
- **📊 Dashboard Web** - Interface React moderna
- **🔄 Batch Processing** - Processamento noturno econômico
- **🧠 Elegibilidade Assistida** - Verificação de carteiras com sugestões de ação
- **🧩 Arquitetura Evolutiva** - Preparada para filas, workers e automações assíncronas
- **🛠️ Open Source Friendly** - Base pensada para extensão, customização e contribuição

---

## 🏗️ Arquitetura

### Visão Geral

A plataforma foi desenhada para funcionar bem desde o modo econômico até cenários de maior volume, separando visualização, coleta, análise e processamento operacional.

### Stack Tecnológica

**Backend**
- Node.js + Fastify
- PostgreSQL (Supabase free tier)
- Redis (Upstash free tier)
- Ollama local + OpenRouter + Groq

**Frontend**
- React + Vite
- TailwindCSS
- Chart.js

**APIs Blockchain**
- Moralis API (40k requests/mês grátis)
- Public RPCs
- Etherscan API (5 calls/sec grátis)

**Deploy**
- Frontend: Vercel
- Backend: Railway/Render
- Cron simples: GitHub Actions
- Evolução assíncrona: Redis + workers

### Camadas Principais

- **Frontend** para dashboard, visualização de airdrops, login, alertas e operação manual
- **Backend API** para autenticação, CRUD de airdrops, checagem de elegibilidade, análise social e integrações
- **Camada de IA** para classificação de posts, extração de critérios, priorização e enriquecimento
- **Camada blockchain** para consulta de histórico, critérios e sinais on-chain
- **Camada assíncrona** para batch processing, filas, retries e tarefas pesadas
- **Persistência e cache** para dados, sessões temporárias, OTPs, jobs e alertas

---

## 📦 Instalação

### Pré-requisitos

```bash
# Node.js 18+
node --version

# Ollama (opcional, para IA local)
curl https://ollama.ai/install.sh | sh
ollama pull llama3.1:8b
Backend
bash
cd backend
npm install
cp .env.example .env
# Configure suas API keys no .env
npm run dev
Frontend
bash
cd frontend
npm install
npm run dev
Docker (Opcional)
bash
docker-compose up -d
⚙️ Configuração
Variáveis de Ambiente (.env)
text
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# IA
OPENROUTER_API_KEY=sk-or-...
USE_OLLAMA=true
GROQ_API_KEY=gsk_...

# Blockchain
MORALIS_API_KEY=...

# Social
TWITTER_BEARER_TOKEN=...
DISCORD_BOT_TOKEN=...

# Notificações
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Wallets monitoradas
WALLET_ADDRESSES=0x...,0x...
Observações
O projeto pode operar em modo econômico usando o máximo possível de recursos gratuitos.

Ollama é opcional, mas útil para reduzir custo com inferência local.

Redis é recomendado para cache, sessões temporárias, OTPs e evolução da camada assíncrona.

A configuração das chaves define o alcance real das integrações.

🔐 Login e código OTP
Você não precisa cadastrar banco de dados no Supabase apenas para receber o código OTP em desenvolvimento.

O OTP é gerado pelo backend e, em modo dev, pode aparecer na interface ou no terminal.

O PostgreSQL (Supabase) é usado para dados da plataforma, mas o fluxo de login não depende dele para funcionar em desenvolvimento.

O Redis é opcional para armazenar OTP e sessão pendente; sem Redis, o fluxo continua funcionando em modo de desenvolvimento.

Para testar localmente, basta subir backend e frontend e usar o modo dev na tela de login.

🚀 Uso
Dashboard Web
Acesse:

bash
http://localhost:5173
No dashboard, você pode acompanhar:

Lista de airdrops ativos

Status de elegibilidade

Alertas prioritários

Histórico de transações

Conteúdo detalhado de protocolos

Dicas e passos para participação

Aba Airdrops – conteúdo completo do protocolo
Ao abrir um airdrop, a tela de detalhes pode exibir conteúdo completo do protocolo no campo criteria.guide.

Campo no criteria.guide	Descrição
description	Sobre o projeto
obs	Observações sobre airdrop, pontos e TGE
farm_value	Valor estimado do farm
funding	Funding e investidores
steps	Array de { title, content } com passos
tips	Lista de dicas
faq	Array de { question, answer }
potential	alto, médio ou fraco
cost	baixo ou alto
status_label	EM ANDAMENTO, ENCERRADO, etc.
Exemplo ao criar ou atualizar um airdrop:

js
criteria: {
  guide: {
    description: "...",
    obs: "...",
    farm_value: "Gratuito",
    funding: "US$15M, fundos X e Y",
    steps: [
      { title: "Conectar wallet", content: "..." }
    ],
    tips: ["Use a rede correta"],
    faq: [
      { question: "Precisa de bridge?", answer: "Depende do protocolo" }
    ],
    potential: "alto",
    cost: "baixo",
    status_label: "EM ANDAMENTO"
  },
  minTx: 5
}
🔌 API Endpoints
bash
# Listar airdrops
GET /api/airdrops

# Verificar elegibilidade
POST /api/eligibility/check
{
  "wallet": "0x...",
  "airdrop": "arbitrum-phase-2"
}

# Obter alertas
GET /api/alerts?priority=high

# Análise de post do Twitter/X
POST /api/analyze/tweet
{
  "tweetId": "123..."
}
Endpoints previstos para evolução
bash
# Rodar batch manual
POST /api/jobs/run-daily-batch

# Reprocessar análise de protocolo
POST /api/jobs/reanalyze-airdrop/:id

# Listar jobs
GET /api/jobs

# Ver status de execução
GET /api/jobs/:id
💡 Como Funciona
1. Coleta de Dados
text
Posts + fontes monitoradas
→ Coleta e normalização
→ Classificação por IA
→ Extração de critérios
→ Registro no sistema
2. Análise e Priorização
text
Post detectado
→ Classificação de urgência
→ Extração de deadline
→ Resumo de critérios
→ Score de prioridade
3. Verificação de Elegibilidade
text
Wallet conectada
→ Consulta histórico on-chain
→ Verificação de critérios
→ Cálculo de pontuação
→ Sugestão de ações
4. Alertas Inteligentes
text
Evento relevante
→ Classificação
→ Priorização
→ Envio de alerta
→ Atualização da interface
5. Processamento Assíncrono
text
Tarefa pesada
→ Fila Redis
→ Worker processa
→ Retry automático
→ Log e rastreabilidade
📊 Custos Estimados
Cenário	Custo/Mês	Capacidade
Tier Gratuito	$0	até 100 posts/dia e 5 wallets
Micro-Budget	$10-20	até 500 posts/dia e 20 wallets
Scale-Up	$50+	maior volume, mais jobs e automações
ROI estimado: um único airdrop relevante já pode compensar vários meses de operação enxuta.

🗂️ Estrutura do Projeto
bash
airdrop-tracker/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── ai/               # Ollama, OpenRouter, Groq
│   │   │   ├── blockchain/       # Moralis, RPCs, Etherscan
│   │   │   ├── social/           # Twitter/X, Discord
│   │   │   ├── notifications/    # Telegram, Discord webhooks
│   │   │   └── eligibility/      # Regras e scoring
│   │   ├── routes/               # Endpoints da API
│   │   ├── utils/                # Helpers, cache, validações
│   │   ├── jobs/                 # Jobs simples e batchs
│   │   └── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── pages/                # Dashboard, Settings, Login
│   │   ├── services/             # Cliente da API
│   │   └── hooks/                # Hooks customizados
│   └── package.json
├── worker/                       # Evolução assíncrona
│   ├── src/
│   │   ├── queues/
│   │   ├── processors/
│   │   ├── schedulers/
│   │   └── index.js
│   └── package.json
├── scripts/
│   ├── batch-analyzer.js
│   └── setup-db.js
└── docker-compose.yml
🔐 Segurança
✅ API keys em variáveis de ambiente

✅ Rate limiting configurado

✅ Validação de inputs

✅ CORS configurado

✅ Logs sanitizados

✅ Separação progressiva entre API e tarefas pesadas

✅ Base pronta para retries e controle operacional

🛠️ Desenvolvimento
Adicionar Novo Airdrop
javascript
// backend/src/data/airdrops.js
{
  id: 'new-airdrop',
  name: 'New Protocol',
  chain: 'arbitrum',
  status: 'active',
  criteria: {
    minTx: 10,
    minVolume: 100,
    snapshot: '2024-12-31'
  }
}
Customizar Análise de IA
javascript
// backend/src/services/ai/prompts.js
export const AIRDROP_ANALYSIS_PROMPT = `
Analise o seguinte post e identifique:
1. É anúncio de airdrop?
2. Urgência (crítico/alto/normal)
3. Critérios de elegibilidade
4. Deadline
5. Principais ações do usuário
`;
Fluxo recomendado de evolução
Consolidar coleta e análise social

Melhorar checagem de elegibilidade

Estruturar camada assíncrona com Redis

Separar processamento pesado em worker

Adicionar observabilidade, retries e rastreabilidade

📈 Roadmap
 Setup inicial

 Integração OpenRouter

 Monitoramento Twitter/X

 Dashboard básico

 Login com OTP em modo dev

 Integração Discord

 Worker desacoplado com filas

 Scheduler operacional para análises e alertas

 Análise preditiva de airdrops

 Mobile app (React Native)

 Marketplace de estratégias

🤝 Contribuindo
Pull requests são bem-vindos. Para mudanças maiores, abra uma issue primeiro para alinhar objetivo, impacto técnico e abordagem.

Ideias de contribuição:

Novas integrações blockchain

Novos conectores sociais

Estratégias de scoring

Melhorias de UI/UX

Observabilidade e logs

Filas, workers e scheduler

📝 Licença
MIT

🙏 Créditos
Construído com:

Ollama - IA local gratuita

OpenRouter - Agregador de LLMs

Groq - Inferência rápida

Moralis - APIs blockchain

Supabase - Database

Upstash - Redis serverless

Vercel - Hosting

