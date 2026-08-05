# 🚀 Setup Rápido - Implementação Imediata

## PASSO 1: Preparar o Backend (15 minutos)

### 1.1 Instalar dependências necessárias

```bash
cd backend

# Instalar apenas o essencial primeiro (para testar)
npm install groq-sdk discord.js twitter-api-v2 socket.io bull axios

# Se quiser a versão completa com Web3:
npm install groq-sdk discord.js twitter-api-v2 socket.io bull axios ethers web3
```

### 1.2 Adicionar variáveis de ambiente (.env)

```env
# Existentes (já deve ter)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# ===== NOVAS - AI BOT =====
GROQ_API_KEY=gsk_... (get free at https://console.groq.com)
USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434

# ===== NOVAS - SOCIAL MONITOR =====
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
TWITTER_BEARER_TOKEN=... (get at https://developer.twitter.com)

DISCORD_BOT_TOKEN=... (create at https://discord.com/developers/applications)
DISCORD_AIRDROP_CHANNEL=... (canal ID no seu server)

# ===== WEBSOCKET =====
WS_ENABLED=true
WS_PORT=3001
```

### 1.3 Onde pegar as credenciais:

#### Groq API (GRATUITO)
1. Ir em https://console.groq.com
2. Login/Signup
3. Criar API Key
4. Copiar para `.env`

#### Twitter API v2 (GRATUITO)
1. https://developer.twitter.com/en/portal/dashboard
2. Criar "App"
3. Gerar "Bearer Token"
4. Copiar credenciais para `.env`

#### Discord Bot (GRATUITO)
1. https://discord.com/developers/applications
2. "New Application"
3. "Bot" → "Add Bot"
4. Copiar Token para `.env`
5. Adicionar bot ao seu server: https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=8

---

## PASSO 2: Criar Estrutura do Bot (30 minutos)

### 2.1 Criar arquivo base

```bash
touch backend/src/services/ai-bot.js
touch backend/src/routes/bot.js
touch backend/src/utils/bot-executor.js
```

### 2.2 Arquivo mais simples: `backend/src/services/ai-bot.js`

```javascript
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const aiBotService = {
  async processUserMessage(message, walletAddress, conversationHistory = []) {
    try {
      const systemPrompt = `Você é um assistente especializado em DeFi e airdrops.
      
Wallet do usuário: ${walletAddress}

Responda de forma concisa e útil. Se o usuário pedir para executar uma ação (claim, stake, vote),
responda com o formato JSON abaixo:

ACTION_START
{
  "type": "claim|stake|vote|bridge|swap",
  "protocol": "nome do protocolo",
  "chain": "rede (arbitrum|optimism|ethereum|polygon|base)"
}
ACTION_END

Exemplos de perguntas que você pode ajudar:
- "Quais airdrops sou elegível?"
- "Como fazer stake no Optimism?"
- "Qual é o melhor airdrop agora?"
- "Faça claim no Arbitrum"
`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-5), // Últimas 5 mensagens para contexto
        { role: 'user', content: message }
      ];

      const response = await groq.chat.completions.create({
        model: 'mixtral-8x7b-32768', // Modelo mais rápido grátis
        messages,
        temperature: 0.3,
        max_tokens: 512,
      });

      const aiResponse = response.choices[0].message.content;

      // Extrair ações JSON
      const actionMatch = aiResponse.match(/ACTION_START([\s\S]*?)ACTION_END/);
      const actions = actionMatch ? JSON.parse(actionMatch[1]) : null;

      return {
        response: aiResponse.replace(/ACTION_START[\s\S]*?ACTION_END/, '').trim(),
        actions: actions ? [actions] : [],
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Groq API error:', error);
      return {
        response: 'Desculpe, houve um erro ao processar sua mensagem.',
        error: error.message,
        actions: []
      };
    }
  }
};
```

### 2.3 Rota WebSocket simples: `backend/src/routes/bot.js`

```javascript
import express from 'express';
import { aiBotService } from '../services/ai-bot.js';
import { redis } from '../utils/redis.js'; // Seu cliente Redis

const router = express.Router();

router.post('/message', async (req, res) => {
  try {
    const { message, wallet } = req.body;

    // Buscar histórico da conversa
    const historyKey = `chat_history:${wallet}`;
    const cachedHistory = await redis.get(historyKey);
    const history = cachedHistory ? JSON.parse(cachedHistory) : [];

    // Processar mensagem
    const result = await aiBotService.processUserMessage(message, wallet, history);

    // Salvar no histórico
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: result.response });
    
    // Manter apenas últimas 20 mensagens
    if (history.length > 40) history.shift();
    
    await redis.setex(historyKey, 86400, JSON.stringify(history)); // 24 horas

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Histórico
router.get('/history/:wallet', async (req, res) => {
  try {
    const historyKey = `chat_history:${req.params.wallet}`;
    const history = await redis.get(historyKey);
    res.json({ history: history ? JSON.parse(history) : [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 2.4 Registrar rota no seu `backend/src/index.js`

```javascript
// Adicionar no seu server Fastify/Express
import botRouter from './routes/bot.js';

app.use('/api/bot', botRouter);
```

---

## PASSO 3: Componente React do Chat (30 minutos)

### 3.1 Arquivo: `frontend/src/components/AiBotChat.jsx`

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, MessageCircle } from 'lucide-react';

export function AiBotChat({ wallet }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Carregar histórico
    fetchHistory();
  }, [wallet]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/bot/history/${wallet.address}`);
      const data = await response.json();
      
      // Converter para formato de UI
      const formattedMessages = [];
      for (let i = 0; i < data.history.length; i += 2) {
        if (data.history[i]?.role === 'user') {
          formattedMessages.push({
            role: 'user',
            content: data.history[i].content
          });
        }
        if (data.history[i + 1]?.role === 'assistant') {
          formattedMessages.push({
            role: 'assistant',
            content: data.history[i + 1].content
          });
        }
      }
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !wallet) return;

    const userMessage = input;
    setInput('');

    // Adicionar mensagem do usuário na UI
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/bot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          wallet: wallet.address
        })
      });

      const data = await response.json();

      // Adicionar resposta do bot
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        actions: data.actions
      }]);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erro ao processar sua mensagem. Tente novamente.'
      }]);
    }

    setLoading(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-purple-500/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-4 rounded-t-lg border-b border-purple-700">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-5 h-5 text-purple-300" />
          <h2 className="text-lg font-bold text-white">Assistente de IA</h2>
        </div>
        <p className="text-xs text-purple-200">
          Peça para verificar airdrops, executar ações ou analisar oportunidades
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-sm">Olá! 👋</p>
            <p className="text-xs mt-2">Tente perguntar:</p>
            <p className="text-xs mt-1 text-purple-300">"Quais airdrops sou elegível?"</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-gray-800 text-gray-100 border border-purple-500/30 rounded-bl-none'
              }`}
            >
              <p>{msg.content}</p>
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 text-xs space-y-1">
                  {msg.actions.map((action, i) => (
                    <div key={i} className="bg-black/30 p-2 rounded">
                      ⚙️ {action.type} • {action.protocol} • {action.chain}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-purple-500/30 px-4 py-3 rounded-lg rounded-bl-none">
              <Loader className="w-4 h-4 animate-spin text-purple-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-purple-500/30 p-4 bg-gray-800/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua pergunta ou comando..."
            className="flex-1 bg-gray-700 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
            disabled={loading || !wallet}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !wallet}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {!wallet && <p className="text-xs text-red-400 mt-2">Conecte sua wallet para usar o bot</p>}
      </form>
    </div>
  );
}
```

### 3.2 Importar no seu Dashboard

```jsx
// frontend/src/pages/Dashboard.jsx

import { AiBotChat } from '../components/AiBotChat';

export function Dashboard({ wallet }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Coluna 1: Airdrops */}
      <div>
        {/* Seu código de airdrops */}
      </div>

      {/* Coluna 2: Bot de IA */}
      <div>
        <AiBotChat wallet={wallet} />
      </div>

      {/* Coluna 3: Alertas */}
      <div>
        {/* Seus alertas */}
      </div>
    </div>
  );
}
```

---

## PASSO 4: Social Feed Agregado (45 minutos)

### 4.1 Serviço simples: `backend/src/services/social-feed.js`

```javascript
import axios from 'axios';
import { redis } from '../utils/redis.js';
import { db } from '../utils/database.js';

const CACHE_DURATION = 300; // 5 minutos

export const socialFeedService = {
  // Buscar tweets com airdrop keywords
  async fetchTwitterPosts(keywords = ['airdrop', 'claim', 'snapshot']) {
    try {
      const query = keywords.join(' OR ');
      
      // Usar API v2 do Twitter (bearer token required)
      const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        },
        params: {
          query: `${query} lang:en -is:retweet`,
          max_results: 100,
          'tweet.fields': 'created_at,public_metrics',
          expansions: 'author_id',
          'user.fields': 'username,verified'
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Twitter fetch error:', error);
      return [];
    }
  },

  // Buscar mensagens Discord (usando webhook ou bot)
  async fetchDiscordMessages(channelId) {
    try {
      // Se você tem acesso ao Discord bot com READ_MESSAGE_HISTORY permission
      const cacheKey = `discord:${channelId}`;
      
      // Verificar cache primeiro
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      // Buscar do banco de dados
      const result = await db.query(
        'SELECT * FROM social_posts WHERE source = $1 AND channel_id = $2 ORDER BY created_at DESC LIMIT 50',
        ['discord', channelId]
      );

      // Cache por 5 minutos
      await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(result.rows));

      return result.rows;
    } catch (error) {
      console.error('Discord fetch error:', error);
      return [];
    }
  },

  // Agregar ambas as fontes
  async getUnifiedFeed(options = {}) {
    const { limit = 50, skip = 0, keywords = [] } = options;

    try {
      const cacheKey = 'unified_feed:all';
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      // Buscar de ambas as fontes em paralelo
      const [twitterPosts, discordPosts] = await Promise.all([
        this.fetchTwitterPosts(keywords),
        this.fetchDiscordMessages(process.env.DISCORD_AIRDROP_CHANNEL)
      ]);

      // Combinar e ordenar por timestamp
      const unified = [
        ...twitterPosts.map(post => ({
          id: post.id,
          source: 'twitter',
          author: post.author_id,
          content: post.text,
          timestamp: new Date(post.created_at),
          url: `https://twitter.com/i/web/status/${post.id}`,
          metrics: post.public_metrics
        })),
        ...discordPosts.map(post => ({
          id: post.id,
          source: 'discord',
          author: post.author,
          content: post.content,
          timestamp: new Date(post.created_at),
          url: `https://discord.com/channels/${post.guild_id}/${post.channel_id}/${post.id}`
        }))
      ].sort((a, b) => b.timestamp - a.timestamp);

      // Paginar
      const paginated = unified.slice(skip, skip + limit);

      // Cache
      await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(paginated));

      return paginated;
    } catch (error) {
      console.error('Unified feed error:', error);
      return [];
    }
  }
};
```

### 4.2 Rota: `backend/src/routes/social.js`

```javascript
import express from 'express';
import { socialFeedService } from '../services/social-feed.js';

const router = express.Router();

// GET /api/social/feed
router.get('/feed', async (req, res) => {
  try {
    const { limit = 50, skip = 0, keywords = '' } = req.query;
    
    const keywordArray = keywords ? keywords.split(',') : [];
    
    const posts = await socialFeedService.getUnifiedFeed({
      limit: parseInt(limit),
      skip: parseInt(skip),
      keywords: keywordArray
    });

    res.json({ posts, total: posts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 4.3 Componente React: `frontend/src/components/SocialFeed.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Twitter, MessageCircle, Zap, Search } from 'lucide-react';

export function SocialFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFeed();
    
    // Recarregar a cada 2 minutos
    const interval = setInterval(fetchFeed, 120000);
    return () => clearInterval(interval);
  }, [search]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/social/feed?keywords=${search}&limit=50`
      );
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error('Error fetching feed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-4">📢 Feed Social</h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por palavras-chave (airdrop, claim, etc)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-blue-800/50 border border-blue-700 rounded pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-white"
          />
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Carregando...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            Nenhum post encontrado para "{search}"
          </div>
        ) : (
          posts.map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {post.source === 'twitter' && (
                    <Twitter className="w-4 h-4 text-blue-400" />
                  )}
                  {post.source === 'discord' && (
                    <MessageCircle className="w-4 h-4 text-purple-400" />
                  )}
                  <span className="text-xs text-gray-400">
                    {post.timestamp && new Date(post.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <p className="text-white text-sm line-clamp-3 mb-2">{post.content}</p>

              {post.metrics && (
                <div className="text-xs text-gray-400 flex gap-4">
                  <span>❤️ {post.metrics.like_count}</span>
                  <span>💬 {post.metrics.reply_count}</span>
                  <span>🔄 {post.metrics.retweet_count}</span>
                </div>
              )}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
```

### 4.4 Registrar no Dashboard

```jsx
import { SocialFeed } from '../components/SocialFeed';

export function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <AiBotChat wallet={wallet} />
      </div>
      <div>
        <SocialFeed />
      </div>
    </div>
  );
}
```

---

## PASSO 5: Testar Tudo (20 minutos)

### 5.1 Iniciar o servidor

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Redis (se local)
redis-server
```

### 5.2 Testar Bot no Frontend

1. Conectar wallet
2. Ir para a aba do bot
3. Digitar: `"Quais airdrops sou elegível?"`
4. Observar resposta do Groq

### 5.3 Testar Social Feed

1. Ir para a aba Social Feed
2. Buscar por "airdrop"
3. Ver posts do Twitter e Discord

---

## Checklist de Implementação

- [ ] Instalar dependências npm
- [ ] Configurar `.env` com API keys
- [ ] Criar estrutura de arquivos do bot
- [ ] Testar rota `/api/bot/message` com Postman
- [ ] Integrar componente `AiBotChat` no Dashboard
- [ ] Criar serviço de social feed
- [ ] Testar rota `/api/social/feed`
- [ ] Integrar componente `SocialFeed` no Dashboard
- [ ] Configurar WebSocket (opcional, para real-time)
- [ ] Adicionar logging e tratamento de erros

---

## Dúvidas Comuns

**P: Preciso de Redis?**
R: Não obrigatoriamente, mas ajuda muito com cache. Para MVP, pode usar memória.

**P: Quanto custa?**
R: Groq + Twitter API + Discord = GRÁTIS. Não há custo.

**P: Posso fazer isso em 1 semana?**
R: Sim! Com esse setup você tem MVP em 3-5 dias.

**P: Como adicionar mais chains?**
R: Adicione endereços de contratos ao arquivo de configuração.

