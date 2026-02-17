# 📝 Código Pronto para Copiar/Colar

## Exemplo 1: Test do Groq (execute no terminal)

```bash
# Testar se Groq funciona (sem integração, só API)

cat > test-groq.js << 'EOF'
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function test() {
  try {
    console.log('🧪 Testando Groq API...');
    
    const completion = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'user',
          content: 'Qual é o melhor airdrop para fazer agora? Responda em 1 frase.'
        }
      ],
      temperature: 0.3,
      max_tokens: 256,
    });

    console.log('✅ Groq funcionando!');
    console.log('Resposta:', completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

test();
EOF

# Rodar
GROQ_API_KEY=sua_chave_aqui node test-groq.js
```

---

## Exemplo 2: Microsserviço do Bot (crie este arquivo)

Nome: `backend/src/services/simple-bot.js`

```javascript
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Armazenar históricos em memória (trocar por Redis depois)
const conversations = new Map();

export async function processMessage(userId, message, walletAddress) {
  // Obter ou criar histórico
  if (!conversations.has(userId)) {
    conversations.set(userId, []);
  }
  
  const history = conversations.get(userId);

  const systemPrompt = `Você é um assistente especializado em DeFi e airdrops.

Wallet do usuário: ${walletAddress}

IMPORTANTE: Se o usuário pedir para executar uma ação (claim, stake, vote, swap, bridge),
responda colocando a ação em linhas com [ACTION] e [/ACTION]:

[ACTION]
{
  "type": "claim",
  "protocol": "arbitrum",
  "chain": "arbitrum"
}
[/ACTION]

Seja conciso. Responda em português.`;

  try {
    // Preparar mensagens (manter últimas 5)
    const recentHistory = history.slice(-5);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: message }
    ];

    // Chamar Groq
    const completion = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      messages,
      temperature: 0.3,
      max_tokens: 512,
    });

    const aiResponse = completion.choices[0].message.content;

    // Extrair ações
    const actionMatch = aiResponse.match(/\[ACTION\]([\s\S]*?)\[\/ACTION\]/);
    let actions = [];
    
    if (actionMatch) {
      try {
        actions = [JSON.parse(actionMatch[1])];
      } catch (e) {
        console.error('Failed to parse action:', actionMatch[1]);
      }
    }

    // Limpar resposta
    const cleanResponse = aiResponse
      .replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, '')
      .trim();

    // Salvar no histórico
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: cleanResponse });
    
    // Manter limite
    if (history.length > 20) {
      history.shift();
      history.shift();
    }

    return {
      success: true,
      response: cleanResponse,
      actions,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Groq error:', error);
    return {
      success: false,
      response: 'Desculpe, houve um erro ao processar sua mensagem.',
      error: error.message,
      actions: []
    };
  }
}

// Para testar
export async function testBot() {
  console.log('🤖 Iniciando teste do bot...\n');

  const userId = 'user-123';
  const wallet = '0x1234567890abcdef';

  // Teste 1
  let result = await processMessage(userId, 'Olá! Qual é o melhor airdrop agora?', wallet);
  console.log('👤 User: Qual é o melhor airdrop agora?');
  console.log('🤖 Bot:', result.response);
  console.log('');

  // Teste 2
  result = await processMessage(userId, 'Faça claim no Arbitrum', wallet);
  console.log('👤 User: Faça claim no Arbitrum');
  console.log('🤖 Bot:', result.response);
  if (result.actions.length > 0) {
    console.log('⚙️ Ações detectadas:', result.actions);
  }
}
```

**Para testar:**
```bash
node -e "import('./src/services/simple-bot.js').then(m => m.testBot())"
```

---

## Exemplo 3: Rota Express (add no seu backend)

Nome: `backend/src/routes/simple-bot.js`

```javascript
import express from 'express';
import { processMessage } from '../services/simple-bot.js';

const router = express.Router();

// POST /api/simple-bot/message
router.post('/message', async (req, res) => {
  try {
    const { message, wallet } = req.body;

    if (!message || !wallet) {
      return res.status(400).json({ error: 'Message and wallet required' });
    }

    // Usar wallet como user ID
    const userId = wallet.toLowerCase();

    const result = await processMessage(userId, message, wallet);

    res.json(result);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**Adicione no seu `backend/src/index.js`:**
```javascript
import botRoutes from './routes/simple-bot.js';
app.use('/api/simple-bot', botRoutes);
```

**Teste com curl:**
```bash
curl -X POST http://localhost:3000/api/simple-bot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Quais airdrops sou elegível?","wallet":"0x1234567890abcdef"}'
```

---

## Exemplo 4: Componente React do Bot (copie inteiro)

Nome: `frontend/src/components/SimpleAiBot.jsx`

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Loader2 } from 'lucide-react';

export function SimpleAiBot({ walletAddress }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Olá! 👋 Sou seu assistente de airdrops. Posso ajudar a:'
        + '\n\n1️⃣ Verificar sua elegibilidade em airdrops'
        + '\n2️⃣ Executar ações (claim, stake, vote)'
        + '\n3️⃣ Analisar oportunidades DeFi'
        + '\n\nDiga-me como posso ajudar!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');

    // Adicionar mensagem do user
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      content: userMessage
    }]);

    setLoading(true);

    try {
      const response = await fetch('/api/simple-bot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          wallet: walletAddress
        })
      });

      const data = await response.json();

      if (data.success) {
        // Adicionar resposta do bot
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          actions: data.actions
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: '❌ Erro: ' + (data.error || 'Algo deu errado')
        }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: '❌ Erro ao conectar. Tente novamente.'
      }]);
    }

    setLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-purple-300" />
          <div>
            <h1 className="text-xl font-bold">Assistente de IA</h1>
            <p className="text-xs text-purple-200">
              {walletAddress ? `Conectado: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Desconectado'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-gray-800 text-gray-100 border border-purple-500/50 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 space-y-2 text-xs">
                    {msg.actions.map((action, idx) => (
                      <div
                        key={idx}
                        className="bg-black/40 p-2 rounded border border-yellow-500/50"
                      >
                        ⚙️ {action.type.toUpperCase()} • {action.protocol} • {action.chain}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-purple-500/50 px-4 py-3 rounded-lg rounded-bl-none">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-purple-500/30 bg-gray-800/50 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Digite sua pergunta ou comando..."
            className="flex-1 bg-gray-700 border border-purple-500/30 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            disabled={loading || !walletAddress}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || !walletAddress}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {!walletAddress && (
          <p className="text-xs text-red-400 mt-2 text-center">
            ⚠️ Conecte sua wallet para usar o assistente
          </p>
        )}
      </div>
    </div>
  );
}
```

**Use no seu Dashboard:**
```jsx
import { SimpleAiBot } from '../components/SimpleAiBot';

export function Dashboard({ wallet }) {
  return (
    <SimpleAiBot walletAddress={wallet?.address} />
  );
}
```

---

## Exemplo 5: Social Feed Simples

Nome: `frontend/src/components/SimpleSocialFeed.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Twitter, MessageCircle, Search, RefreshCw } from 'lucide-react';

const SAMPLE_POSTS = [
  {
    id: '1',
    source: 'twitter',
    author: '@OptimismGov',
    content: '🎉 Airdrop Phase 2 aberto! Claim agora em https://optimism.io/claim',
    timestamp: new Date(Date.now() - 3600000),
    url: '#'
  },
  {
    id: '2',
    source: 'discord',
    author: 'ArbitrumBot',
    content: '⚡ Snapshot elegibilidade: Se você tiver 10+ transações, você pode estar elegível!',
    timestamp: new Date(Date.now() - 7200000),
    url: '#'
  },
  {
    id: '3',
    source: 'twitter',
    author: '@BaseProtocol',
    content: 'Base airdrop snapshot: 2024-02-20. Prepare sua wallet!',
    timestamp: new Date(Date.now() - 10800000),
    url: '#'
  }
];

export function SimpleSocialFeed() {
  const [posts, setPosts] = useState(SAMPLE_POSTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const handleRefresh = async () => {
    setLoading(true);
    
    try {
      // Simular fetch (trocar por API real depois)
      await new Promise(r => setTimeout(r, 1000));
      
      // Aqui você chamaria:
      // const response = await fetch('/api/social/feed');
      // const data = await response.json();
      // setPosts(data.posts);
      
      console.log('Feed atualizado');
    } catch (error) {
      console.error('Error:', error);
    }
    
    setLoading(false);
  };

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-4">📢 Feed Social</h2>
        
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-blue-800/50 border border-blue-700 rounded pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-white"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            Nenhum post encontrado
          </div>
        ) : (
          filteredPosts.map((post) => (
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
                  <span className="text-xs text-gray-400 font-semibold">
                    {post.author}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {post.timestamp.toLocaleString('pt-BR')}
                </span>
              </div>

              <p className="text-white text-sm mb-2">{post.content}</p>

              <div className="text-xs text-blue-400">
                {post.source === 'twitter' && '→ Ver no Twitter'}
                {post.source === 'discord' && '→ Ver no Discord'}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## Exemplo 6: Dashboard Completo (integrado)

Nome: `frontend/src/pages/DashboardV2.jsx`

```jsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleAiBot } from '../components/SimpleAiBot';
import { SimpleSocialFeed } from '../components/SimpleSocialFeed';

export function DashboardV2({ wallet }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Tabs defaultValue="bot" className="w-full">
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <TabsList className="bg-gray-900">
            <TabsTrigger value="bot" className="text-white">
              🤖 Assistente de IA
            </TabsTrigger>
            <TabsTrigger value="feed" className="text-white">
              📢 Feed Social
            </TabsTrigger>
            <TabsTrigger value="airdrops" className="text-white">
              💰 Meus Airdrops
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bot" className="p-4">
          <SimpleAiBot walletAddress={wallet?.address} />
        </TabsContent>

        <TabsContent value="feed" className="p-4">
          <SimpleSocialFeed />
        </TabsContent>

        <TabsContent value="airdrops" className="p-4">
          {/* Seu código de airdrops aqui */}
          <p className="text-white">Seção de airdrops...</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Exemplo 7: .env Completo

```env
# ===== Database =====
DATABASE_URL=postgresql://user:password@localhost:5432/airdrop_db
REDIS_URL=redis://localhost:6379

# ===== AI - Groq (FREE) =====
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx

# ===== Twitter API (FREE) =====
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAA...

# ===== Discord (FREE) =====
DISCORD_BOT_TOKEN=OTk5OTk5OTk5OTk5OTk5OTk5...
DISCORD_AIRDROP_CHANNEL=1234567890123456789

# ===== Server =====
NODE_ENV=development
PORT=3000
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3001
```

---

## Verificação Rápida

```bash
# 1. Testar Groq
GROQ_API_KEY=sua_chave node test-groq.js

# 2. Testar rota
curl -X POST http://localhost:3000/api/simple-bot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Olá!","wallet":"0x123"}'

# 3. Acessar no navegador
http://localhost:5173
```

Pronto! 🎉 Você tem tudo para começar!
