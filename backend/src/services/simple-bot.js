import Groq from 'groq-sdk';

function getGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new Groq({ apiKey: key });
}

// Armazenar históricos em memória (trocar por Redis depois)
const conversations = new Map();

export async function processMessage(userId, message, walletAddress) {
  // Obter ou criar histórico
  if (!conversations.has(userId)) {
    conversations.set(userId, []);
  }
  
  const history = conversations.get(userId);

  const systemPrompt = `Você é um assistente especializado em DeFi e airdrops.

Wallet do usuário (somente leitura): ${walletAddress}

IMPORTANTE: Este sistema é SOMENTE LEITURA. Você NUNCA executa nem propõe executar
transações (claim, stake, swap, bridge, vote). Se o usuário pedir isso, explique que
ele deve fazer manualmente no site oficial do projeto e oriente os passos com cuidado
(verificar URL oficial, nunca assinar transação desconhecida).

Seja conciso. Responda em português.`;

  try {
    // Preparar mensagens (manter últimas 5)
    const recentHistory = history.slice(-5);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: message }
    ];

    // Chamar Groq (opcional - servidor sobe mesmo sem API key)
    const groq = getGroq();
    if (!groq) {
      return {
        success: true,
        reply: 'Bot em modo offline. Configure GROQ_API_KEY no .env para habilitar respostas com IA.',
        actions: [],
      };
    }
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
      messages,
      temperature: 0.3,
      max_tokens: 512,
    });

    const aiResponse = completion.choices[0].message.content;

    // Sistema somente leitura: nenhuma ação é extraída ou executada.
    const actions = [];
    const cleanResponse = aiResponse.trim();

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
