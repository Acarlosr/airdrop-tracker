# 🎯 Airdrop Tracker - Agregador Low-Cost

Agregador inteligente de airdrops usando IA e APIs gratuitas para maximizar suas chances de elegibilidade.

## 🌟 Características

- **💰 100% Gratuito** - Arquitetura otimizada para tier gratuito
- **🤖 IA Multi-Model** - Ollama local + OpenRouter + Groq
- **⛓️ Multi-Chain** - Ethereum, Arbitrum, Optimism, Base, Polygon
- **📱 Monitoramento Social** - Twitter/X e Discord
- **🔔 Alertas Inteligentes** - Telegram/Discord webhooks
- **📊 Dashboard** - Interface React moderna
- **🔄 Batch Processing** - Processamento noturno econômico

## 🏗️ Arquitetura

### Stack Tecnológica

**Backend:**
- Node.js + Fastify
- PostgreSQL (Supabase free tier)
- Redis (Upstash free tier)
- Ollama (local) + OpenRouter + Groq

**Frontend:**
- React + Vite
- TailwindCSS
- Chart.js

**APIs Blockchain:**
- Moralis API (40k requests/mês grátis)
- Public RPCs
- Etherscan API (5 calls/sec grátis)

**Deploy:**
- Frontend: Vercel (grátis)
- Backend: Railway/Render (grátis)
- Cron: GitHub Actions

## 📦 Instalação

### Pré-requisitos

```bash
# Node.js 18+
node --version

# Ollama (opcional, para IA local)
curl https://ollama.ai/install.sh | sh
ollama pull llama3.1:8b
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configure suas API keys no .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker (Recomendado)

```bash
docker-compose up -d
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# Database (Supabase grátis)
DATABASE_URL=postgresql://...

# Redis (Upstash grátis)
REDIS_URL=redis://...

# AI - OpenRouter (tier gratuito)
OPENROUTER_API_KEY=sk-or-...
USE_OLLAMA=true
GROQ_API_KEY=gsk_...

# Blockchain - Moralis (40k req/mês grátis)
MORALIS_API_KEY=...

# Social
TWITTER_BEARER_TOKEN=...
DISCORD_BOT_TOKEN=...

# Notificações
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Suas Wallets
WALLET_ADDRESSES=0x...,0x...
```

## 🚀 Uso

### Dashboard Web
Acesse `http://localhost:5173` para ver:
- Lista de airdrops ativos
- Status de elegibilidade
- Alertas prioritários
- Histórico de transações

### API Endpoints

```bash
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

# Análise de post do Twitter
POST /api/analyze/tweet
{
  "tweetId": "123..."
}
```

## 💡 Como Funciona

### 1. Coleta de Dados (Batch Noturno - $0)
```
3:00 AM → Ollama analisa posts do dia
       → Extrai anúncios de airdrops
       → Classifica urgência
       → Gera relatório diário
```

### 2. Alertas em Tempo Real (OpenRouter Free)
```
Post urgente detectado → Groq classifica
                      → Telegram alerta
                      → Dashboard atualiza
```

### 3. Verificação de Elegibilidade
```
Wallet conectada → Moralis API consulta histórico
                 → Verifica critérios
                 → Calcula pontuação
                 → Sugere ações
```

## 📊 Custos Estimados

| Cenário | Custo/Mês | Capacidade |
|---------|-----------|------------|
| Tier Gratuito | $0 | 100 posts/dia, 5 wallets |
| Micro-Budget | $10-20 | 500 posts/dia, 20 wallets |
| Scale-Up | $50 | Ilimitado |

**ROI:** 1 airdrop de $50 = 5 meses de tier gratuito

## 🗂️ Estrutura do Projeto

```
airdrop-tracker/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── ai/          # Ollama, OpenRouter, Groq
│   │   │   ├── blockchain/  # Moralis, RPCs, Etherscan
│   │   │   ├── social/      # Twitter, Discord monitors
│   │   │   └── notifications/ # Telegram, Discord webhooks
│   │   ├── routes/          # API endpoints
│   │   ├── utils/           # Helpers, cache
│   │   └── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Dashboard, Settings
│   │   └── services/        # API client
│   └── package.json
├── scripts/
│   ├── batch-analyzer.js    # Cron job noturno
│   └── setup-db.js          # Database init
└── docker-compose.yml
```

## 🔐 Segurança

- ✅ API keys em variáveis de ambiente
- ✅ Rate limiting configurado
- ✅ Validação de inputs
- ✅ CORS configurado
- ✅ Logs sanitizados

## 🛠️ Desenvolvimento

### Adicionar Novo Airdrop

```javascript
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
```

### Customizar Análise de IA

```javascript
// backend/src/services/ai/prompts.js
export const AIRDROP_ANALYSIS_PROMPT = `
Analise o seguinte post e identifique:
1. É anúncio de airdrop?
2. Urgência (crítico/alto/normal)
3. Critérios de elegibilidade
4. Deadline
...
`;
```

## 📈 Roadmap

- [x] Setup inicial
- [x] Integração OpenRouter
- [x] Monitoramento Twitter
- [x] Dashboard básico
- [ ] Integração Discord
- [ ] Mobile app (React Native)
- [ ] Análise preditiva de airdrops
- [ ] Marketplace de estratégias

## 🤝 Contribuindo

Pull requests são bem-vindos! Para mudanças grandes, abra uma issue primeiro.

## 📝 Licença

MIT

## 🙏 Créditos

Construído com:
- [Ollama](https://ollama.ai) - IA local gratuita
- [OpenRouter](https://openrouter.ai) - Agregador de LLMs
- [Moralis](https://moralis.io) - APIs blockchain
- [Supabase](https://supabase.com) - Database
- [Vercel](https://vercel.com) - Hosting

---

⭐ **Dica:** Configure alertas no Telegram para não perder airdrops elegíveis!
