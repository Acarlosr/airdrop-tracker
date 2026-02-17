# 📋 Plano de Implementação - Airdrop Tracker v2.0
## Bot de IA + Aba Social Integrada

---

## ✅ VIABILIDADE: 100% POSSÍVEL

Seu projeto já tem a stack perfeita para isso! Você já usa:
- **Node.js + Fastify** (backend robusto)
- **React + Vite** (frontend moderno)
- **APIs de IA** (Ollama, OpenRouter, Groq)
- **Monitoramento Social** (Twitter/Discord)

---

# 🤖 PARTE 1: BOT DE IA PARA INTERAÇÕES

## 1.1 Arquitetura do Bot

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND REACT                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Aba "AI Bot Assistant"                           │   │
│  │ ┌──────────────────────────────────────────────┐ │   │
│  │ │ Chat Interface + Ações Automáticas           │ │   │
│  │ │                                              │ │   │
│  │ │ User: "Fazer claim no Arbitrum airdrop"     │ │   │
│  │ │ Bot:  "Conectando wallet... Executando..."  │ │   │
│  │ └──────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────┬──────────────────┘
                                       │ WebSocket
┌──────────────────────────────────────▼──────────────────┐
│                   BACKEND NODE.JS                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ AI Bot Service (novo)                            │   │
│  │                                                  │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ 1. Message Queue (Redis)                    │ │   │
│  │ │ 2. IA Processing (Groq/OpenRouter)         │ │   │
│  │ │ 3. Action Executor (Web3, Blockchain)      │ │   │
│  │ │ 4. Status Tracker                          │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ External Services                                │   │
│  │ • Web3.js (Blockchain interactions)            │   │
│  │ • Etherscan API (verificações)                 │   │
│  │ • Moralis API (dados de wallet)                │   │
│  │ • Telegram API (confirmações)                  │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## 1.2 Funcionalidades do Bot

### Modo Conversacional (IA)
```
User: "Quais airdrops sou elegível?"
Bot Responde com:
  ✓ Lista de airdrops baseado na wallet
  ✓ Critérios atendidos/não atendidos
  ✓ Próximas datas importantes

User: "Faça um stake no Optimism"
Bot Executa:
  1. Verifica rede atual
  2. Valida permissões
  3. Constrói transação
  4. Aguarda confirmação
  5. Relata resultado
```

### Modo Automático
```
Detecta oportunidade de airdrop
    ↓
Análise de elegibilidade (você tem critérios?)
    ↓
Bot avisa (Telegram + Discord)
    ↓
Você aprova/rejeita
    ↓
Bot executa ação automaticamente
```

## 1.3 Tecnologias Necessárias

| Componente | Lib/Tech | Propósito |
|-----------|----------|-----------|
| Chat Interface | Socket.io | Comunicação real-time |
| IA Processing | Groq API | Análise rápida de intenções |
| Execução de Ações | Web3.js v4 | Interações com blockchain |
| Fila de Tarefas | Bull (Redis) | Processar ações em fila |
| Confirmações | Ethers.js | Envio de transações |
| Monitoramento | Pino Logger | Logs estruturados |

---

# 🌐 PARTE 2: ABA COM BROWSER SOCIAL

## 2.1 Arquitetura da Aba Social

```
┌────────────────────────────────────────────────────────────┐
│                FRONTEND - Nova Aba: "Social Feed"          │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Layout em 2 Colunas                                 │ │
│  │                                                      │ │
│  │  ┌─────────────────────┐  ┌──────────────────────┐ │ │
│  │  │   Discord Feed      │  │  X/Twitter Feed      │ │ │
│  │  │                     │  │                      │ │ │
│  │  │ • Anúncios         │  │ • Tweets filtrados  │ │ │
│  │  │ • Novidades        │  │ • Menções do bot    │ │ │
│  │  │ • Notificações     │  │ • Trending topics   │ │ │
│  │  │ • Links diretos    │  │ • Links diretos     │ │ │
│  │  └─────────────────────┘  └──────────────────────┘ │ │
│  │                                                      │ │
│  │ ┌────────────────────────────────────────────────┐ │ │
│  │ │ Filtros & Busca                               │ │ │
│  │ │ • Por protocolo  • Por urgência               │ │ │
│  │ │ • Por data       • Por relevância              │ │ │
│  │ └────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST/WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                   BACKEND NODE.JS                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Social Aggregator Service (novo)                    │   │
│  │                                                      │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ Discord Monitor                               │   │   │
│  │ │ • Web scraping (Cheerio)                      │   │   │
│  │ │ • Discord.js para channels específicos        │   │   │
│  │ │ • Webhook parsing                             │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ Twitter/X Monitor                             │   │   │
│  │ │ • Twitter API v2                              │   │   │
│  │ │ • Stream de keywords                          │   │   │
│  │ │ • Análise de sentimento                       │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ Data Processing                               │   │   │
│  │ │ • Parsing de anúncios                         │   │   │
│  │ │ • Classificação com IA (Groq)                │   │   │
│  │ │ • Cache em PostgreSQL                         │   │   │
│  │ │ • Deduplicação                                │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Data Sources                                         │   │
│  │ • Discord API + Web scraping                       │   │
│  │ • Twitter API v2 (premium free tier)               │   │
│  │ • PostgreSQL cache                                 │   │
│  │ • Redis (feed real-time)                           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## 2.2 Funcionalidades Concretas

### Discord Integration
```javascript
✓ Conectar Discord com OAuth2
✓ Listar servidores que você é membro
✓ Monitorar canais específicos (#announcements, #airdrop)
✓ Exibir mensagens em tempo real
✓ Criar alertas por palavra-chave
✓ Link direto para mensagem original
```

### Twitter/X Integration
```javascript
✓ Conectar com conta X
✓ Seguir usuários específicos (protocolos)
✓ Monitorar hashtags (#airdrop, #protocol)
✓ Buscar por keywords em tempo real
✓ Feed filtrado por relevância
✓ Link direto para tweet
✓ Retweets de protocolos importantes
```

### Agregação Inteligente
```javascript
✓ Combinar feeds Discord + Twitter
✓ Remover duplicatas
✓ Ordenar por urgência/relevância
✓ Timeline unificada
✓ Full-text search
✓ Filtros avançados (por protocolo, date range, etc)
```

---

# 🛠️ IMPLEMENTAÇÃO PASSO A PASSO

## FASE 1: Bot de IA (Semana 1-2)

### 1. Criar estrutura do bot

```bash
# No seu backend
mkdir -p src/services/ai-bot
touch src/services/ai-bot/index.js
touch src/services/ai-bot/actions.js
touch src/services/ai-bot/prompts.js
touch src/services/ai-bot/executor.js
```

### 2. Arquivo: `backend/src/services/ai-bot/index.js`

```javascript
import Groq from 'groq-sdk';
import { EventEmitter } from 'events';
import { actionExecutor } from './executor.js';

export class AiBotService extends EventEmitter {
  constructor(redisClient) {
    super();
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.redis = redisClient;
    this.conversationHistory = new Map();
  }

  // Processar mensagem do usuário
  async processMessage(userId, message, walletAddress) {
    try {
      // 1. Recuperar histórico da conversa
      const history = await this.getConversationHistory(userId);

      // 2. Construir prompt com contexto
      const systemPrompt = this.buildSystemPrompt(walletAddress);
      
      // 3. Chamar Groq IA
      const response = await this.groq.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 1024,
      });

      const aiResponse = response.choices[0].message.content;

      // 4. Detectar se há ação a executar
      const actions = this.parseActions(aiResponse);

      if (actions.length > 0) {
        // Processar ações em fila
        for (const action of actions) {
          await this.queueAction(userId, action);
          this.emit('action-queued', { userId, action });
        }
      }

      // 5. Salvar no histórico
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: aiResponse });
      await this.saveConversationHistory(userId, history);

      return {
        response: aiResponse,
        actions,
        status: 'success'
      };

    } catch (error) {
      console.error('Bot error:', error);
      return {
        response: 'Desculpe, houve um erro ao processar sua solicitação.',
        error: error.message,
        status: 'error'
      };
    }
  }

  // Sistema de prompts dinâmicos
  buildSystemPrompt(walletAddress) {
    return `Você é um assistente especializado em airdrops e DeFi.
    
Wallet do usuário: ${walletAddress}

Você pode ajudar com:
1. Verificar elegibilidade em airdrops
2. Executar transações (stake, claim, vote)
3. Analisar oportunidades
4. Fornecer informações de projetos

Quando o usuário pedir para executar uma ação, responda com a ação em JSON:
[ACTION]
{
  "type": "claim|stake|vote|swap|bridge",
  "protocol": "nome do protocolo",
  "amount": "valor se aplicável",
  "chain": "rede blockchain"
}
[/ACTION]

Seja conciso e sempre confirme ações antes de executar.`;
  }

  parseActions(text) {
    const actionRegex = /\[ACTION\](.*?)\[\/ACTION\]/gs;
    const matches = text.matchAll(actionRegex);
    const actions = [];

    for (const match of matches) {
      try {
        const action = JSON.parse(match[1]);
        actions.push(action);
      } catch (e) {
        console.error('Failed to parse action:', match[1]);
      }
    }

    return actions;
  }

  async getConversationHistory(userId) {
    const key = `chat:${userId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : [];
  }

  async saveConversationHistory(userId, history) {
    const key = `chat:${userId}`;
    await this.redis.setex(key, 86400, JSON.stringify(history)); // 24 horas
  }

  async queueAction(userId, action) {
    await this.redis.lpush(`queue:${userId}`, JSON.stringify(action));
  }
}

export default AiBotService;
```

### 3. Arquivo: `backend/src/services/ai-bot/executor.js`

```javascript
import { ethers } from 'ethers';

export class ActionExecutor {
  constructor(wallet) {
    this.wallet = wallet; // Conectada ao provider
  }

  async executeAction(action, userWallet) {
    const { type, protocol, chain, amount } = action;

    try {
      switch (type) {
        case 'claim':
          return await this.executeClaim(protocol, chain);
        
        case 'stake':
          return await this.executeStake(protocol, chain, amount);
        
        case 'vote':
          return await this.executeVote(protocol, chain);
        
        case 'swap':
          return await this.executeSwap(protocol, amount, chain);
        
        default:
          throw new Error(`Action type unknown: ${type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        type
      };
    }
  }

  async executeClaim(protocol, chain) {
    // Exemplo: reivindicar airdrop
    console.log(`Claiming ${protocol} on ${chain}`);
    
    // Buscar contrato do protocolo
    const contractInfo = await this.getProtocolContract(protocol, chain);
    
    // Construir e enviar transação
    const tx = await this.wallet.sendTransaction({
      to: contractInfo.address,
      data: contractInfo.claimAbi.encodeFunctionData('claim', [])
    });

    const receipt = await tx.wait();
    
    return {
      success: true,
      hash: tx.hash,
      protocol,
      action: 'claim'
    };
  }

  async executeStake(protocol, chain, amount) {
    console.log(`Staking ${amount} in ${protocol} on ${chain}`);
    
    // Implementar lógica de stake
    // Similar ao claim, mas com validações adicionais
    
    return {
      success: true,
      protocol,
      amount,
      action: 'stake'
    };
  }

  async getProtocolContract(protocol, chain) {
    // Banco de dados com contratos conhecidos
    const contracts = {
      'arbitrum': { address: '0x...', claimAbi: null },
      'optimism': { address: '0x...', claimAbi: null }
    };

    return contracts[chain] || null;
  }
}
```

### 4. Integração no Frontend: Nova Aba

```jsx
// frontend/src/components/AiBotChat.jsx

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader } from 'lucide-react';

export function AiBotChat({ wallet }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Conectar WebSocket
    const socket = new WebSocket(
      `${import.meta.env.VITE_WS_URL}/bot/${wallet.address}`
    );

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'response') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          actions: data.actions
        }]);
      } else if (data.type === 'action-status') {
        console.log('Action status:', data);
      }
      
      setLoading(false);
    };

    setWs(socket);
    return () => socket.close();
  }, [wallet]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Adicionar mensagem do usuário
    setMessages(prev => [...prev, {
      role: 'user',
      content: input
    }]);

    setLoading(true);
    
    // Enviar ao bot
    ws.send(JSON.stringify({
      type: 'message',
      content: input,
      wallet: wallet.address
    }));

    setInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg border border-purple-500/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-4 rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-300" />
          <h2 className="text-lg font-bold text-white">Assistente de IA</h2>
        </div>
        <p className="text-xs text-purple-200 mt-1">
          Peça para verificar airdrops, executar ações, ou analisar oportunidades
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-100 border border-purple-500/30'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.actions.map((action, i) => (
                    <div key={i} className="text-xs bg-black/30 p-2 rounded">
                      ⚙️ {action.type} em {action.protocol}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 p-3 rounded-lg border border-purple-500/30">
              <Loader className="w-4 h-4 animate-spin text-purple-400" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="border-t border-purple-500/30 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: 'Quais airdrops sou elegível?'"
            className="flex-1 bg-gray-800 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 p-2 rounded transition"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## FASE 2: Social Feed Agregado (Semana 2-3)

### 1. Estrutura de diretórios

```bash
mkdir -p src/services/social-aggregator
touch src/services/social-aggregator/index.js
touch src/services/social-aggregator/discord.js
touch src/services/social-aggregator/twitter.js
touch src/services/social-aggregator/parser.js
```

### 2. Arquivo: `backend/src/services/social-aggregator/twitter.js`

```javascript
import { TwitterApi } from 'twitter-api-v2';

export class TwitterMonitor {
  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
      bearerToken: process.env.TWITTER_BEARER_TOKEN,
    });

    this.rwClient = this.client.readWrite;
    this.roClient = this.client.readOnly;
  }

  async monitorKeywords(keywords = []) {
    const defaultKeywords = [
      '#airdrop',
      'airdrop announced',
      'snapshot eligible',
      'phase 2 airdrop',
      'claim now'
    ];

    const searchTerms = [...defaultKeywords, ...keywords].join(' OR ');

    try {
      const tweets = await this.roClient.v2.search({
        query: `${searchTerms} lang:en -is:retweet`,
        max_results: 100,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
        expansions: ['author_id'],
        'user.fields': ['username', 'verified']
      });

      return tweets;
    } catch (error) {
      console.error('Twitter search error:', error);
      return null;
    }
  }

  async streamAirdrops(callback) {
    // Stream em tempo real
    const rules = [
      { value: 'airdrop lang:en', tag: 'airdrops' },
      { value: 'claim snapshot lang:en', tag: 'claims' }
    ];

    try {
      const stream = await this.roClient.v2.searchStream({
        'tweet.fields': ['created_at', 'author_id'],
        expansions: ['author_id'],
        'user.fields': ['username', 'verified']
      });

      for await (const tweet of stream) {
        callback(tweet);
      }
    } catch (error) {
      console.error('Stream error:', error);
    }
  }
}
```

### 3. Arquivo: `backend/src/services/social-aggregator/discord.js`

```javascript
import { Client, ChannelType } from 'discord.js';
import axios from 'axios';

export class DiscordMonitor {
  constructor(token) {
    this.client = new Client({ intents: ['Guilds', 'GuildMessages'] });
    this.token = token;
  }

  async connect() {
    await this.client.login(this.token);
  }

  async monitorChannel(channelId, callback) {
    const channel = await this.client.channels.fetch(channelId);
    
    if (channel.type !== ChannelType.GuildText) {
      throw new Error('Canal inválido');
    }

    // Buscar mensagens recentes
    const messages = await channel.messages.fetch({ limit: 50 });
    
    for (const [, message] of messages) {
      callback({
        id: message.id,
        author: message.author.username,
        content: message.content,
        timestamp: message.createdTimestamp,
        attachments: message.attachments.map(a => ({
          url: a.url,
          name: a.name
        }))
      });
    }

    // Monitorar novas mensagens
    this.client.on('messageCreate', (message) => {
      if (message.channelId === channelId) {
        callback({
          id: message.id,
          author: message.author.username,
          content: message.content,
          timestamp: message.createdTimestamp,
          attachments: message.attachments.map(a => ({
            url: a.url,
            name: a.name
          }))
        });
      }
    });
  }

  // Buscar por palavras-chave em múltiplos canais
  async searchKeywords(guildId, keywords) {
    const guild = await this.client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();
    const results = [];

    for (const [, channel] of channels) {
      if (channel.type !== ChannelType.GuildText) continue;

      try {
        const messages = await channel.messages.fetch({ limit: 100 });
        
        for (const [, msg] of messages) {
          const contentLower = msg.content.toLowerCase();
          if (keywords.some(kw => contentLower.includes(kw.toLowerCase()))) {
            results.push({
              channel: channel.name,
              author: msg.author.username,
              content: msg.content,
              url: msg.url
            });
          }
        }
      } catch (error) {
        console.error(`Error in channel ${channel.name}:`, error);
      }
    }

    return results;
  }
}
```

### 4. Arquivo: `backend/src/services/social-aggregator/index.js`

```javascript
import { TwitterMonitor } from './twitter.js';
import { DiscordMonitor } from './discord.js';
import { parseAirdropAnnouncement } from './parser.js';

export class SocialAggregator {
  constructor(redis, db) {
    this.redis = redis;
    this.db = db;
    this.twitter = new TwitterMonitor();
    this.discord = null;
  }

  async initialize(discordToken) {
    this.discord = new DiscordMonitor(discordToken);
    await this.discord.connect();
  }

  async startMonitoring() {
    // Monitor Twitter
    this.twitter.streamAirdrops(async (tweet) => {
      const parsed = await parseAirdropAnnouncement(tweet.data.text);
      
      if (parsed.isAirdrop) {
        // Salvar no banco
        await this.db.query(
          `INSERT INTO social_posts (source, post_id, content, parsed_data, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          ['twitter', tweet.data.id, tweet.data.text, JSON.stringify(parsed)]
        );

        // Emitir para clients WebSocket
        this.emit('new-announcement', {
          source: 'twitter',
          data: parsed,
          original: tweet.data
        });

        // Cache Redis para feed rápido
        await this.redis.lpush('feed:recent', JSON.stringify({
          source: 'twitter',
          ...parsed
        }));
      }
    });

    // Monitor Discord
    await this.discord.monitorChannel(process.env.DISCORD_AIRDROP_CHANNEL, async (msg) => {
      const parsed = await parseAirdropAnnouncement(msg.content);
      
      if (parsed.isAirdrop || msg.content.includes('airdrop')) {
        await this.db.query(
          `INSERT INTO social_posts (source, post_id, content, parsed_data, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          ['discord', msg.id, msg.content, JSON.stringify(parsed)]
        );

        this.emit('new-announcement', {
          source: 'discord',
          data: parsed,
          original: msg
        });
      }
    });
  }

  async getFeed(options = {}) {
    const { limit = 50, offset = 0, source = null, protocol = null } = options;

    let query = `
      SELECT * FROM social_posts 
      WHERE 1=1
    `;
    const params = [];

    if (source) {
      query += ` AND source = $${params.length + 1}`;
      params.push(source);
    }

    if (protocol) {
      query += ` AND parsed_data->>'protocol' = $${params.length + 1}`;
      params.push(protocol);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }
}
```

### 5. Frontend: Aba Social Feed

```jsx
// frontend/src/components/SocialFeed.jsx

import React, { useState, useEffect } from 'react';
import { Twitter, MessageCircle, Zap, Search } from 'lucide-react';

export function SocialFeed() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFeed();
    
    // Conectar WebSocket para atualizações em tempo real
    const ws = new WebSocket(import.meta.env.VITE_WS_URL + '/feed');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new-announcement') {
        setPosts(prev => [data.post, ...prev]);
      }
    };

    return () => ws.close();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/social/feed?filter=${filter}&search=${searchTerm}`
      );
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error('Error fetching feed:', error);
    }
    setLoading(false);
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'twitter' && post.source !== 'twitter') return false;
    if (filter === 'discord' && post.source !== 'discord') return false;
    if (searchTerm && !post.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-4">📢 Feed Social</h2>
        
        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded transition ${
              filter === 'all'
                ? 'bg-white text-blue-900'
                : 'bg-blue-800 text-white hover:bg-blue-700'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('twitter')}
            className={`px-4 py-2 rounded flex items-center gap-2 transition ${
              filter === 'twitter'
                ? 'bg-white text-blue-900'
                : 'bg-blue-800 text-white hover:bg-blue-700'
            }`}
          >
            <Twitter className="w-4 h-4" /> Twitter
          </button>
          <button
            onClick={() => setFilter('discord')}
            className={`px-4 py-2 rounded flex items-center gap-2 transition ${
              filter === 'discord'
                ? 'bg-white text-blue-900'
                : 'bg-blue-800 text-white hover:bg-blue-700'
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Discord
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar anúncios..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              fetchFeed();
            }}
            className="w-full bg-blue-800/50 border border-blue-700 rounded pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-white"
          />
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-400">Carregando...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center text-gray-400">Nenhum post encontrado</div>
        ) : (
          filteredPosts.map((post) => (
            <SocialPost key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}

function SocialPost({ post }) {
  const isUrgent = post.parsed_data?.urgency === 'crítico' || post.parsed_data?.urgency === 'alto';

  return (
    <a
      href={post.parsed_data?.link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`block p-4 rounded-lg border transition hover:shadow-lg ${
        isUrgent
          ? 'bg-red-900/30 border-red-500/50 hover:bg-red-900/50'
          : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {post.source === 'twitter' && <Twitter className="w-4 h-4 text-blue-400" />}
          {post.source === 'discord' && <MessageCircle className="w-4 h-4 text-purple-400" />}
          <span className="text-xs text-gray-400">
            {new Date(post.created_at).toLocaleString('pt-BR')}
          </span>
        </div>
        {isUrgent && (
          <div className="flex items-center gap-1 bg-red-600 px-2 py-1 rounded text-xs">
            <Zap className="w-3 h-3" /> URGENTE
          </div>
        )}
      </div>

      <p className="text-white text-sm line-clamp-3 mb-2">{post.content}</p>

      {post.parsed_data?.protocol && (
        <div className="text-xs text-gray-300">
          🎯 Protocolo: <span className="font-semibold">{post.parsed_data.protocol}</span>
        </div>
      )}

      {post.parsed_data?.deadline && (
        <div className="text-xs text-yellow-400 mt-1">
          ⏰ Deadline: {new Date(post.parsed_data.deadline).toLocaleString('pt-BR')}
        </div>
      )}
    </a>
  );
}
```

---

# 📊 Resumo Técnico

## Dependências a Adicionar

```json
{
  "dependencies": {
    "groq-sdk": "^0.3.1",
    "discord.js": "^14.14.0",
    "twitter-api-v2": "^11.0.0",
    "web3": "^4.3.0",
    "ethers": "^6.9.0",
    "bull": "^4.11.5",
    "socket.io": "^4.7.1"
  }
}
```

## Rotas API Novas

```
POST   /api/bot/message          (enviar mensagem ao bot)
GET    /api/bot/history/:userId  (histórico de conversa)
GET    /api/social/feed          (obter feed agregado)
GET    /api/social/search        (buscar em feed)
POST   /api/social/connect-discord
POST   /api/social/connect-twitter
```

## Banco de Dados: Novas Tabelas

```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  messages JSONB,
  created_at TIMESTAMP
);

CREATE TABLE social_posts (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50),
  post_id VARCHAR(255),
  content TEXT,
  parsed_data JSONB,
  created_at TIMESTAMP
);

CREATE TABLE action_queue (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  action JSONB,
  status VARCHAR(50),
  created_at TIMESTAMP,
  executed_at TIMESTAMP
);
```

---

# ✨ Próximas Fases (Futuro)

- [ ] Mobile app (React Native)
- [ ] Análise preditiva de airdrops
- [ ] Automação avançada (multi-chain)
- [ ] Dashboard de analytics
- [ ] Marketplace de estratégias
- [ ] Alertas push nativos
- [ ] Integração com mais chains

---

**Tempo estimado:**
- Bot IA: 7-10 dias
- Social Feed: 5-7 dias
- Testes e refinamento: 3-5 dias
- **Total: 2-3 semanas para MVP funcional**
