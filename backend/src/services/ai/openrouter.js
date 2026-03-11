/**
 * OpenRouter — Análise estruturada de textos de airdrop
 *
 * Módulo especializado que converte texto livre (tweet, anúncio, Discord)
 * em um objeto AirdropAnalysisResult via OpenRouter LLM.
 *
 * Bugs corrigidos em relação à versão .ts original:
 *  1. Convertido para JS ESM puro (sem TypeScript)
 *  2. Remove `node-fetch` → usa fetch nativo do Node 18+
 *  3. Remove `response_format: { type: "json_object" }` — incompatível com modelos livres do OpenRouter
 *  4. Adiciona safeParse() com validação pós-parse
 *  5. Adiciona AbortSignal.timeout(30_000) para evitar hang
 *  6. Usa logger pino do projeto em vez de console.*
 *  7. Reutiliza OPENROUTER_MODEL do env (consistência com ai-robot.js)
 */

import logger from '../../utils/logger.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const MAX_INPUT_CHARS = Number(process.env.AI_MAX_INPUT_CHARS || 12000);
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!OPENROUTER_API_KEY) {
    logger.warn('[openrouter] OPENROUTER_API_KEY não configurada. analyzeAirdropText retornará null.');
}

/**
 * @typedef {Object} CriteriaGuide
 * @property {string} description
 * @property {string|null} obs
 * @property {string|null} farm_value
 * @property {string|null} funding
 * @property {{ title: string, content: string }[]} steps
 * @property {string[]} tips
 * @property {{ question: string, answer: string }[]} faq
 * @property {'alto'|'medio'|'fraco'} potential
 * @property {'baixo'|'alto'|null} cost
 * @property {string|null} status_label
 */

/**
 * @typedef {Object} AirdropAnalysisResult
 * @property {boolean} isAirdrop
 * @property {'critico'|'alto'|'normal'|'baixo'} urgency
 * @property {string|null} deadline
 * @property {string|null} protocolName
 * @property {string|null} chain
 * @property {'alto'|'medio'|'baixo'} riskLevel
 * @property {string} summary
 * @property {CriteriaGuide} criteriaGuide
 */

const SYSTEM_PROMPT = `
Você é um assistente especializado em análise de airdrops e oportunidades em protocolos DeFi.
Sua tarefa é ler um texto e devolver um JSON ESTRITO, sem explicações extras.

Regras:
- Responda SEMPRE com JSON válido e completo — sem texto antes ou depois.
- Use apenas os campos e tipos descritos no schema.
- Se uma informação não estiver clara, use null ou valores neutros (ex.: "normal", "medio").
- Use português brasileiro nos textos (description, obs, tips, faq, summary).

Schema da resposta:

{
  "isAirdrop": boolean,
  "urgency": "critico" | "alto" | "normal" | "baixo",
  "deadline": string | null,
  "protocolName": string | null,
  "chain": string | null,
  "riskLevel": "alto" | "medio" | "baixo",
  "summary": string,
  "criteriaGuide": {
    "description": string,
    "obs": string | null,
    "farm_value": string | null,
    "funding": string | null,
    "steps": [ { "title": string, "content": string } ],
    "tips": [ string ],
    "faq": [ { "question": string, "answer": string } ],
    "potential": "alto" | "medio" | "fraco",
    "cost": "baixo" | "alto" | null,
    "status_label": string | null
  }
}

IMPORTANTE:
- "isAirdrop" = true somente se o texto parecer anúncio ou campanha de airdrop real.
- "urgency" considera prazo, linguagem de urgência e proximidade de snapshot/deadline.
- "riskLevel" considera se parece scam, muito vago, sem funding ou suspeito.
- "potential" é opinião qualitativa sobre o potencial (hype, clareza, possíveis recompensas).
- "cost" é a percepção de custo para participar.

Seu output DEVE ser exatamente um objeto JSON único, nada mais.
`.trim();

/**
 * Valida a estrutura mínima do objeto parseado.
 * Retorna o objeto se válido, ou null se inválido.
 *
 * @param {unknown} obj
 * @returns {AirdropAnalysisResult|null}
 */
function safeParse(obj) {
    if (!obj || typeof obj !== 'object') return null;

    const required = ['isAirdrop', 'urgency', 'riskLevel', 'summary', 'criteriaGuide'];
    for (const key of required) {
        if (!(key in obj)) {
            logger.warn(`[openrouter] safeParse: campo obrigatório ausente: ${key}`);
            return null;
        }
    }

    const guide = obj.criteriaGuide;
    if (!guide || typeof guide !== 'object') {
        logger.warn('[openrouter] safeParse: criteriaGuide ausente ou inválido');
        return null;
    }

    // Aplicar defaults para campos opcionais do guide
    return {
        isAirdrop: Boolean(obj.isAirdrop),
        urgency: obj.urgency ?? 'normal',
        deadline: obj.deadline ?? null,
        protocolName: obj.protocolName ?? null,
        chain: obj.chain ?? null,
        riskLevel: obj.riskLevel ?? 'medio',
        summary: String(obj.summary ?? ''),
        criteriaGuide: {
            description: String(guide.description ?? ''),
            obs: guide.obs ?? null,
            farm_value: guide.farm_value ?? null,
            funding: guide.funding ?? null,
            steps: Array.isArray(guide.steps) ? guide.steps : [],
            tips: Array.isArray(guide.tips) ? guide.tips : [],
            faq: Array.isArray(guide.faq) ? guide.faq : [],
            potential: guide.potential ?? 'medio',
            cost: guide.cost ?? null,
            status_label: guide.status_label ?? null,
        },
    };
}

function normalizeText(input) {
    return input
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function truncateText(input, maxChars = MAX_INPUT_CHARS) {
    const clean = normalizeText(input);
    if (clean.length <= maxChars) return clean;
    return clean.slice(0, maxChars) + '\\n\\n[TRUNCADO PELO SISTEMA]';
}

/**
 * Analisa um texto relacionado a airdrops e retorna um objeto estruturado.
 * Pode ser usado para tweets, mensagens de Discord, anúncios de blog, etc.
 *
 * @param {string} rawText - Texto bruto a analisar
 * @returns {Promise<AirdropAnalysisResult|null>} null em caso de erro ou key ausente
 */
export async function analyzeAirdropText(rawText) {
    if (!OPENROUTER_API_KEY) {
        logger.error('[openrouter] OPENROUTER_API_KEY ausente — retornando null');
        return null;
    }

    const safeText = truncateText(rawText);

    const userMessage = `
Texto a analisar (PT-BR ou EN):

"""
${safeText}
"""

Retorne APENAS o JSON correspondente ao schema, sem texto extra.
`.trim();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://github.com/Acarlosr/airdrop-tracker',
                'X-Title': 'Airdrop Tracker — Text Analysis',
            },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.2,
                max_tokens: 1024,
            }),
            // Bug fix 5: timeout de 30s para evitar hang indefinido
            signal: AbortSignal.timeout(30_000),
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            logger.error(`[openrouter] Erro HTTP ${response.status}: ${errText}`);
            return null;
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content ?? '';

        if (!content || typeof content !== 'string') {
            logger.error('[openrouter] Resposta sem content string:', data);
            return null;
        }

        // Bug fix 4: parse seguro com validação de estrutura
        let parsed;
        try {
            // Remove possíveis blocos de código markdown (```json ... ```)
            const clean = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
            parsed = JSON.parse(clean);
        } catch (parseErr) {
            logger.error('[openrouter] Falha ao parsear JSON:', parseErr.message, '\nContent:', content.slice(0, 500));
            return null;
        }

        const result = safeParse(parsed);
        if (!result) {
            logger.error('[openrouter] Objeto parseado não passou na validação:', parsed);
            return null;
        }

        return result;
    } catch (err) {
        if (err.name === 'TimeoutError') {
            logger.error('[openrouter] Timeout após 30s em analyzeAirdropText');
        } else {
            logger.error('[openrouter] Erro em analyzeAirdropText:', err.message);
        }
        return null;
    }
}
