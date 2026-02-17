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
