import { env } from '../lib/env.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  /** Chave e modelo do usuário (robô por usuário). Sem isso, cai na config global do .env. */
  apiKey?: string | null;
  model?: string | null;
}

/**
 * Envia mensagens para o OpenRouter e retorna a resposta em texto.
 * Aceita `apiKey`/`model` por chamada (config por usuário); sem eles,
 * usa a chave/modelo globais do .env (uso legado, single-tenant).
 */
export async function chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
  const apiKey = options.apiKey || env.OPENROUTER_API_KEY;
  const model = options.model || env.OPENROUTER_MODEL;
  if (!apiKey) throw new Error('Nenhuma chave OpenRouter configurada.');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': env.CORS_ORIGIN,
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? '';
  return content.trim();
}

/**
 * Analisa um airdrop e retorna análise em texto (LLM).
 */
export async function analyzeAirdrop(airdropName: string, description: string): Promise<string> {
  const system = `Você é um analista de airdrops em criptomoedas. Responda em português (Brasil), de forma objetiva.`;
  const user = `Analise este airdrop e dê recomendações breves (riscos, oportunidades, passos sugeridos):\n\nNome: ${airdropName}\nDescrição: ${description || '(sem descrição)'}`;
  return chat([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);
}

/**
 * Gera uma estratégia geral de airdrops (texto).
 */
export async function getStrategy(): Promise<string> {
  const system = `Você é um consultor de airdrops. Responda em português (Brasil), de forma prática e resumida.`;
  const user = `Gere uma estratégia geral curta para quem quer participar de airdrops (priorização, diversificação de redes, cuidados, melhores práticas).`;
  return chat([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);
}
