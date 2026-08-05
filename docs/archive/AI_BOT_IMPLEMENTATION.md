# 🤖 AI Bot + Social Feed - Implementação Concluída

## ✅ O que foi implementado

### Backend
- ✅ Serviço de Bot com Groq API (`backend/src/services/simple-bot.js`)
- ✅ Rotas do Bot (`backend/src/routes/bot.js`)
  - `POST /api/bot/message` - Processar mensagem
  - `GET /api/bot/history/:wallet` - Obter histórico
  - `DELETE /api/bot/history/:wallet` - Limpar histórico
- ✅ Serviço de Social Feed (`backend/src/services/social-feed.js`)
- ✅ Rotas de Social Feed (`backend/src/routes/social.js`)
  - `GET /api/social/feed` - Feed agregado
  - `GET /api/social/feed/twitter` - Posts do Twitter
  - `GET /api/social/feed/discord` - Posts do Discord
  - `POST /api/social/search` - Buscar posts

### Frontend
- ✅ Componente AiBotChat (`frontend/src/components/AiBotChat.jsx`)
- ✅ Componente SocialFeed (`frontend/src/components/SocialFeed.jsx`)
- ✅ Integração no Dashboard (`frontend/src/pages/Dashboard.jsx`)

## 🚀 Como usar

### 1. Instalar Dependências
```bash
cd backend
npm install groq-sdk discord.js twitter-api-v2 socket.io bull axios
```
✅ **Já instalado**

### 2. Configurar Variáveis de Ambiente

Abra `backend/.env` e preencha:

#### Groq API (OBRIGATÓRIO para o bot)
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
```

**Como obter:**
1. Vá para https://console.groq.com
2. Faça login/signup (grátis)
3. Clique em "API Keys"
4. Crie uma nova chave
5. Copie e cole em `.env`

#### Twitter API (OPCIONAL para social feed)
```env
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAA...
TWITTER_API_KEY=xxxxx
TWITTER_API_SECRET=xxxxx
TWITTER_ACCESS_TOKEN=xxxxx
TWITTER_ACCESS_SECRET=xxxxx
```

**Como obter:**
1. Vá para https://developer.twitter.com/en/portal/dashboard
2. Crie uma nova "App"
3. Gere "Keys and tokens"
4. Copie credenciais

#### Discord Bot (OPCIONAL para social feed)
```env
DISCORD_BOT_TOKEN=OTk5OTk5OTk5OTk5OTk5OTk5...
DISCORD_AIRDROP_CHANNEL=1234567890123456789
```

**Como obter:**
1. Vá para https://discord.com/developers/applications
2. Crie "New Application"
3. Vá para "Bot" → "Add Bot"
4. Copie o Token
5. Na seção "OAuth2" → "URL Generator", selecione:
   - Scopes: `bot`
   - Permissions: `Send Messages`, `Read Messages`
6. Use o link gerado para adicionar o bot ao seu servidor

### 3. Iniciar os Servidores

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend (em novo terminal):**
```bash
cd frontend
npm run dev
```

### 4. Acessar no Navegador
```
http://localhost:5173
```

## 💬 Testando o Bot de IA

1. Vá ao Dashboard
2. Você verá o componente "Assistente de IA" à esquerda
3. Digite perguntas como:
   - "Quais airdrops sou elegível?"
   - "Qual é o melhor airdrop agora?"
   - "Faça claim no Arbitrum"
4. O bot responde usando Groq API

## 📢 Testando o Social Feed

1. Vá ao Dashboard
2. Você verá o "Feed Social" à direita
3. Clique em filtros (Todos, Twitter, Discord)
4. Digite palavras-chave na busca
5. Veja posts agregados de múltiplas fontes

## 🔧 Ajustes Possíveis

### Mudar modelo do Groq
Em `backend/src/services/simple-bot.js`, linha 41:
```javascript
model: 'mixtral-8x7b-32768', // Mudar este valor
```

Modelos grátis disponíveis:
- `mixtral-8x7b-32768` (recomendado - mais rápido)
- `llama2-70b-4096`
- `gemma-7b-it`

### Adicionar mais palavras-chave de busca
Em `backend/src/services/social-feed.js`, linhas 28-30:
```javascript
async fetchTwitterPosts(keywords = ['airdrop', 'claim', 'snapshot']) {
  // Adicione mais keywords aqui
}
```

## 📊 Estatísticas de Uso

### Custos
- **Groq**: GRÁTIS (tier grátis)
- **Twitter API**: GRÁTIS (tier básico)
- **Discord**: GRÁTIS
- **Total**: $0/mês

### Limites
- Groq: ~300 requisições/mês (free tier)
- Twitter: ~300 requisições/15 min (free tier)
- Discord: Ilimitado
- Backend: 100 req/15min (rate limit)

## 🐛 Troubleshooting

### "GROQ_API_KEY not provided"
→ Adicione a chave Groq no `.env`

### "Bot não responde"
→ Verifique se o backend está rodando (`http://localhost:3000/health`)

### "Social feed vazio"
→ Normal - requer Twitter API key configurada. Sem ela, só mostra exemplos.

### "Erro de conexão"
→ Certifique-se que:
- Backend está em `http://localhost:3000`
- Frontend em `http://localhost:5173`
- Redis/Database estão rodando (ou Docker)

## 📈 Próximos Passos

1. **WebSocket em tempo real** - Substituir polling por WebSocket
2. **Persistência de histórico** - Salvar conversas em Redis/DB
3. **Integração de Web3** - Executar transações reais
4. **Dashboard avançado** - Analytics de airdrops
5. **Mobile app** - React Native

## 📚 Referências

- Groq SDK: https://console.groq.com/docs
- Twitter API v2: https://developer.twitter.com/en/docs/twitter-api
- Discord.js: https://discord.js.org/docs
- Fastify: https://www.fastify.io/docs/latest

---

**Status**: ✅ Pronto para produção (MVP)  
**Data**: Feb 17, 2026  
**Versão**: 1.0.0
