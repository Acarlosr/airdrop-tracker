# 🚀 Setup Rápido

## Instalação Local (Sem Docker)

### 1. Pré-requisitos

```bash
# Node.js 18+
node --version

# PostgreSQL (ou use Supabase free tier)
# Redis (ou use Upstash free tier)

# Ollama (opcional, para IA local gratuita)
curl https://ollama.ai/install.sh | sh
ollama pull llama3.1:8b
```

### 2. Backend

```bash
cd backend
npm install

# Configure .env
cp .env.example .env
# Edite .env com suas API keys

# Setup database
npm run db:setup

# Start
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:5173

## Instalação com Docker (Recomendado)

```bash
# Configure .env no backend
cp backend/.env.example backend/.env
# Edite backend/.env

# Start tudo
docker-compose up -d

# Setup database
docker-compose exec backend npm run db:setup
```

Acesse: http://localhost:5173

## Configuração Mínima (.env)

```env
# Database (Use Supabase free tier)
DATABASE_URL=postgresql://...

# Redis (Use Upstash free tier ou deixe vazio)
REDIS_URL=redis://...

# AI - Escolha uma:
USE_OLLAMA=true  # Local, grátis
# OU
OPENROUTER_API_KEY=sk-or-...  # Cloud, 50 req/dia grátis

# Blockchain
MORALIS_API_KEY=...  # 40k req/mês grátis

# Suas wallets (separadas por vírgula)
WALLET_ADDRESSES=0x...,0x...
```

## APIs Gratuitas Necessárias

### Obrigatórias:
- [Moralis](https://moralis.io) - Blockchain data (40k req/mês grátis)

### Opcionais:
- [OpenRouter](https://openrouter.ai) - AI (50 req/dia grátis)
- [Groq](https://groq.com) - Fast AI (tier gratuito)
- [Supabase](https://supabase.com) - PostgreSQL (500MB grátis)
- [Upstash](https://upstash.com) - Redis (10k commands/dia grátis)

## Verificar Setup

```bash
# Backend health
curl http://localhost:3000/health

# Listar airdrops
curl http://localhost:3000/api/airdrops

# Dashboard
open http://localhost:5173
```

## Problemas Comuns

### Backend não conecta ao banco
```bash
# Verifique DATABASE_URL
echo $DATABASE_URL

# Teste conexão
psql $DATABASE_URL
```

### Ollama não funciona
```bash
# Verifique se está rodando
ollama list

# Start Ollama
ollama serve
```

### Redis não conecta
```bash
# Use modo sem cache (OK para começar)
# Deixe REDIS_URL vazio no .env
```

## Próximos Passos

1. ✅ Adicione suas wallets em `/wallets`
2. ✅ Configure notificações Telegram (opcional)
3. ✅ Rode batch analyzer: `npm run batch`
4. ✅ Configure cron para análise noturna

## Suporte

- Issues: https://github.com/Acarlosr/airdrop-tracker/issues
- Docs: Ver README.md principal
