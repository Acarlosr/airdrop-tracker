import OpenAI from 'openai';
import logger from '../utils/logger.js';
import { notify } from './notifications.js';
import { query } from '../config/database.js';
import { getRedis } from '../config/redis.js';

/**
 * AI Robot Service — Monitoramento autônomo via OpenRouter LLM
 * 
 * Funcionalidades:
 * - Monitoramento contínuo de airdrops (alterações, mudanças)
 * - Estratégias e recomendações via LLM
 * - Análise de redes sociais dos projetos
 * - Lembretes de interação
 * - Envio de alertas/notificações
 */

// ── OpenRouter Client ─────────────────────────────────────────────
function getOpenRouterClient() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'sk-or-v1-...') return null;

    return new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey,
        defaultHeaders: {
            'HTTP-Referer': 'https://airdrop-tracker.local',
            'X-Title': 'Airdrop Tracker AI Robot',
        },
    });
}

// ── In-Memory State ───────────────────────────────────────────────
const robotState = {
    enabled: process.env.AI_ROBOT_ENABLED !== 'false',
    lastScan: null,
    lastStrategy: null,
    lastReminder: null,
    totalScans: 0,
    totalInsights: 0,
    totalAlerts: 0,
    startedAt: new Date(),
};

let previousAirdropState = null;

// ── Core Robot Functions ──────────────────────────────────────────

/**
 * Call OpenRouter LLM
 */
async function callLLM(systemPrompt, userMessage, options = {}) {
    const client = getOpenRouterClient();

    if (!client) {
        logger.warn('[AI Robot] OpenRouter not configured — returning offline response');
        return {
            success: false,
            response: 'AI Robot em modo offline. Configure OPENROUTER_API_KEY no .env.',
            offline: true,
        };
    }

    try {
        const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';
        const completion = await client.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                ...(options.history || []),
                { role: 'user', content: userMessage },
            ],
            temperature: options.temperature || 0.4,
            max_tokens: options.maxTokens || 1024,
        });

        const response = completion.choices?.[0]?.message?.content || '';
        return { success: true, response, model };
    } catch (error) {
        logger.error('[AI Robot] LLM call failed:', error.message);
        return { success: false, response: `Erro na LLM: ${error.message}`, error: error.message };
    }
}

/**
 * Scan airdrops for changes and generate insights
 */
export async function scanAirdrops(db) {
    logger.info('[AI Robot] 🔍 Starting airdrop scan...');
    robotState.lastScan = new Date();
    robotState.totalScans++;

    try {
        // Fetch current airdrops from DB (or mock)
        let currentAirdrops = [];
        if (db) {
            try {
                const result = await db.query('SELECT * FROM airdrops ORDER BY updated_at DESC LIMIT 50');
                currentAirdrops = result.rows || [];
            } catch {
                currentAirdrops = getMockAirdrops();
            }
        } else {
            currentAirdrops = getMockAirdrops();
        }

        // Detect changes
        const changes = detectChanges(currentAirdrops, previousAirdropState);
        previousAirdropState = currentAirdrops;

        if (changes.length === 0) {
            await addInsight({
                type: 'scan',
                priority: 'low',
                title: '✅ Scan Completo — Sem Alterações',
                summary: `Nenhuma mudança detectada em ${currentAirdrops.length} airdrops monitorados.`,
            });
            return { changes: 0, airdrops: currentAirdrops.length };
        }

        // Use LLM to analyze changes
        const changesText = changes.map(c => `- ${c.name}: ${c.change}`).join('\n');
        const llmResult = await callLLM(
            `Você é um analista de airdrops crypto. Analise as seguintes mudanças detectadas em projetos de airdrop e forneça um resumo conciso em português com recomendações de ação.`,
            `Mudanças detectadas:\n${changesText}\n\nForneça um resumo das mudanças e ações recomendadas.`
        );

        const insight = {
            type: 'change_detected',
            priority: changes.some(c => c.severity === 'critical') ? 'critical' : 'high',
            title: `🔄 ${changes.length} Alterações Detectadas`,
            summary: llmResult.success ? llmResult.response : `${changes.length} mudanças encontradas nos airdrops monitorados.`,
            changes,
        };

        await addInsight(insight);

        // Send notification for important changes
        if (insight.priority === 'critical' || insight.priority === 'high') {
            await notify(
                '🤖 AI Robot — Alterações Detectadas',
                `${changes.length} mudanças em airdrops:\n${changesText.slice(0, 500)}`,
                insight.priority === 'critical' ? 'critical' : 'high'
            );
            robotState.totalAlerts++;
        }

        return { changes: changes.length, airdrops: currentAirdrops.length, insight };
    } catch (error) {
        logger.error('[AI Robot] Scan failed:', error);
        return { changes: 0, error: error.message };
    }
}

/**
 * Generate strategic recommendations via LLM
 */
export async function generateStrategy(db) {
    logger.info('[AI Robot] 🎯 Generating strategy...');
    robotState.lastStrategy = new Date();

    try {
        // Gather context
        let airdropsContext = '';
        if (db) {
            try {
                const result = await db.query(
                    `SELECT name, status, chain, estimated_value, snapshot_date, claim_start, claim_end 
           FROM airdrops WHERE status = 'active' ORDER BY estimated_value DESC LIMIT 20`
                );
                airdropsContext = result.rows.map(a =>
                    `- ${a.name} (${a.chain}): Status=${a.status}, Valor~$${a.estimated_value || '?'}, Snapshot=${a.snapshot_date || 'TBD'}, Claim=${a.claim_start || 'TBD'}`
                ).join('\n');
            } catch {
                airdropsContext = getMockAirdropsContext();
            }
        } else {
            airdropsContext = getMockAirdropsContext();
        }

        const llmResult = await callLLM(
            `Você é um estrategista de airdrops crypto experiente. Crie uma análise estratégica detalhada mas concisa em português baseada nos airdrops ativos abaixo.
      
Estruture sua resposta em:
1. **Prioridades Imediatas** — ações para fazer AGORA
2. **Oportunidades** — airdrops com melhor potencial
3. **Riscos** — pontos de atenção
4. **Plano da Semana** — agenda de ações recomendadas

Seja direto e prático. Use emojis para facilitar leitura.`,
            `Airdrops ativos monitorados:\n${airdropsContext}\n\nData atual: ${new Date().toLocaleDateString('pt-BR')}\n\nGere a estratégia.`
        );

        const insight = {
            type: 'strategy',
            priority: 'high',
            title: '🎯 Estratégia Atualizada',
            summary: llmResult.success ? llmResult.response : getDefaultStrategy(),
        };

        await addInsight(insight);
        robotState.totalInsights++;

        return insight;
    } catch (error) {
        logger.error('[AI Robot] Strategy generation failed:', error);
        return { type: 'strategy', priority: 'medium', title: 'Erro na geração de estratégia', summary: error.message };
    }
}

/**
 * Analyze social media updates via LLM
 */
export async function analyzeSocial(socialFeedService) {
    logger.info('[AI Robot] 📢 Analyzing social media...');

    try {
        let posts = [];
        if (socialFeedService) {
            try {
                posts = await socialFeedService.getUnifiedFeed({ limit: 30 });
            } catch {
                posts = [];
            }
        }

        if (posts.length === 0) {
            posts = getMockSocialPosts();
        }

        const postsText = posts.slice(0, 15).map(p =>
            `[${p.source}] ${p.author || 'unknown'}: ${(p.content || '').slice(0, 200)}`
        ).join('\n');

        const llmResult = await callLLM(
            `Você é um analista de redes sociais crypto. Analise os posts abaixo que são relevantes para airdrops e DeFi.

Identifique:
1. **Notícias importantes** — TGEs, snapshots, mudanças de regras
2. **Sentimento geral** — bullish, bearish, neutro
3. **Ações recomendadas** — o que o usuário deveria fazer com base nessas informações
4. **Projetos mencionados** — lista dos projetos mais citados

Responda em português de forma concisa.`,
            `Posts recentes sobre airdrops:\n${postsText}`
        );

        const insight = {
            type: 'social_analysis',
            priority: 'medium',
            title: '📢 Análise de Redes Sociais',
            summary: llmResult.success ? llmResult.response : `${posts.length} posts analisados — configure OpenRouter para análise completa.`,
            postsAnalyzed: posts.length,
        };

        await addInsight(insight);
        return insight;
    } catch (error) {
        logger.error('[AI Robot] Social analysis failed:', error);
        return { type: 'social_analysis', priority: 'low', title: 'Erro na análise social', summary: error.message };
    }
}

/**
 * Generate interaction reminders
 */
export async function generateReminders(db) {
    logger.info('[AI Robot] ⏰ Generating reminders...');
    robotState.lastReminder = new Date();

    try {
        let airdrops = [];
        if (db) {
            try {
                const result = await db.query(
                    `SELECT name, chain, status, snapshot_date, claim_start, claim_end, updated_at 
           FROM airdrops WHERE status IN ('active', 'upcoming') ORDER BY snapshot_date ASC NULLS LAST`
                );
                airdrops = result.rows || [];
            } catch {
                airdrops = getMockAirdrops();
            }
        } else {
            airdrops = getMockAirdrops();
        }

        const now = new Date();
        const newReminders = [];

        for (const airdrop of airdrops) {
            // Reminder for upcoming snapshots
            if (airdrop.snapshot_date) {
                const daysUntil = Math.ceil((new Date(airdrop.snapshot_date) - now) / (1000 * 60 * 60 * 24));
                if (daysUntil > 0 && daysUntil <= 7) {
                    newReminders.push({
                        type: 'snapshot_reminder',
                        priority: daysUntil <= 2 ? 'critical' : 'high',
                        airdrop: airdrop.name,
                        title: `⏰ Snapshot de ${airdrop.name} em ${daysUntil} dia(s)!`,
                        message: `Interaja com ${airdrop.name} (${airdrop.chain || 'multi'}) antes do snapshot. Restam ${daysUntil} dia(s).`,
                        deadline: airdrop.snapshot_date,
                        timestamp: now,
                    });
                }
            }

            // Reminder for claim windows
            if (airdrop.claim_start) {
                const daysUntilClaim = Math.ceil((new Date(airdrop.claim_start) - now) / (1000 * 60 * 60 * 24));
                if (daysUntilClaim >= 0 && daysUntilClaim <= 3) {
                    newReminders.push({
                        type: 'claim_reminder',
                        priority: 'critical',
                        airdrop: airdrop.name,
                        title: `🎁 Claim de ${airdrop.name} ${daysUntilClaim === 0 ? 'ABERTO AGORA!' : `em ${daysUntilClaim} dia(s)`}`,
                        message: `O claim de ${airdrop.name} está ${daysUntilClaim === 0 ? 'aberto' : 'prestes a abrir'}. Não perca!`,
                        deadline: airdrop.claim_start,
                        timestamp: now,
                    });
                }
            }

            // Reminder for claim deadlines
            if (airdrop.claim_end) {
                const daysUntilEnd = Math.ceil((new Date(airdrop.claim_end) - now) / (1000 * 60 * 60 * 24));
                if (daysUntilEnd > 0 && daysUntilEnd <= 5) {
                    newReminders.push({
                        type: 'deadline_reminder',
                        priority: 'critical',
                        airdrop: airdrop.name,
                        title: `🚨 Claim de ${airdrop.name} fecha em ${daysUntilEnd} dia(s)!`,
                        message: `URGENTE: O prazo para claim de ${airdrop.name} termina em ${daysUntilEnd} dia(s). Faça o claim agora!`,
                        deadline: airdrop.claim_end,
                        timestamp: now,
                    });
                }
            }

            // Monthly interaction reminder (for active airdrops with no recent update)
            if (airdrop.status === 'active' && airdrop.updated_at) {
                const daysSinceUpdate = Math.ceil((now - new Date(airdrop.updated_at)) / (1000 * 60 * 60 * 24));
                if (daysSinceUpdate >= 7) {
                    newReminders.push({
                        type: 'interaction_reminder',
                        priority: 'medium',
                        airdrop: airdrop.name,
                        title: `💡 Hora de interagir com ${airdrop.name}`,
                        message: `Faz ${daysSinceUpdate} dias desde a última atividade em ${airdrop.name}. Interaja para manter/aumentar elegibilidade.`,
                        deadline: null,
                    });
                }
            }
        }

        // Add reminders to store
        for (const reminder of newReminders) {
            await addReminder(reminder);
        }

        // Notify critical reminders
        const criticalReminders = newReminders.filter(r => r.priority === 'critical');
        if (criticalReminders.length > 0) {
            const reminderText = criticalReminders.map(r => `• ${r.title}`).join('\n');
            await notify(
                '🤖 AI Robot — Lembretes Urgentes',
                `${criticalReminders.length} lembrete(s) urgente(s):\n\n${reminderText}`,
                'critical'
            );
            robotState.totalAlerts += criticalReminders.length;
        }

        return { total: newReminders.length, critical: criticalReminders.length, reminders: newReminders };
    } catch (error) {
        logger.error('[AI Robot] Reminders generation failed:', error);
        return { total: 0, error: error.message };
    }
}

/**
 * Chat with the robot — ask questions about projects
 */
export async function chatWithRobot(userId, message) {
    const redis = getRedis();
    let history = [];
    const historyKey = `ai_chat_history:${userId}`;

    if (redis) {
        const cachedHistory = await redis.get(historyKey);
        if (cachedHistory) history = JSON.parse(cachedHistory);
    }

    // Build context from recent insights
    const insights = await getInsights(5);
    const recentInsights = insights.map(i =>
        `[${i.type}] ${i.title}: ${(i.summary || '').slice(0, 300)}`
    ).join('\n');

    const reminders = await getReminders(5);
    const recentReminders = reminders.map(r =>
        `[${r.type}] ${r.title}`
    ).join('\n');

    const result = await callLLM(
        `Você é o AI Robot do Airdrop Tracker, um assistente de monitoramento de airdrops crypto.

Contexto atual do monitoramento:
- Última análise: ${robotState.lastScan?.toLocaleString('pt-BR') || 'Nunca'}
- Total de scans: ${robotState.totalScans}
- Insights recentes: ${robotState.totalInsights}

Últimos insights:
${recentInsights || 'Nenhum insight ainda.'}

Lembretes ativos:
${recentReminders || 'Nenhum lembrete ativo.'}

Responda em português. Seja conciso e direto. Use emojis. Se o usuário perguntar sobre um projeto específico, use os dados disponíveis para responder.`,
        message,
        { history: history.slice(-10), temperature: 0.5, maxTokens: 800 }
    );

    // Save to history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: result.response });

    // Trim history
    if (history.length > 30) {
        history.splice(0, 2);
    }

    if (redis) {
        await redis.setEx(historyKey, 86400, JSON.stringify(history)); // 24 hours TTL
    }

    return {
        success: true,
        response: result.response,
        offline: result.offline || false,
        timestamp: new Date(),
    };
}

// ── State Management ──────────────────────────────────────────────

async function addInsight(insight) {
    try {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        await query(
            `INSERT INTO ai_insights (id, type, priority, title, summary, details)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, insight.type, insight.priority, insight.title, insight.summary, JSON.stringify(insight.changes || insight)]
        );
    } catch (error) {
        logger.error('[AI Robot] Error adding insight to DB:', error.message);
    }
}

async function addReminder(reminder) {
    try {
        // Avoid duplicates by checking airdrop + type that are recent
        const existing = await query(`SELECT id FROM ai_reminders WHERE airdrop = $1 AND type = $2 AND created_at > NOW() - INTERVAL '1 day'`, [reminder.airdrop, reminder.type]);

        if (existing.rows.length === 0) {
            const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
            await query(
                `INSERT INTO ai_reminders (id, type, priority, airdrop, title, message, deadline)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [id, reminder.type, reminder.priority, reminder.airdrop, reminder.title, reminder.message, reminder.deadline || null]
            );
        }
    } catch (error) {
        logger.error('[AI Robot] Error adding reminder to DB:', error.message);
    }
}

export async function getStatus() {
    try {
        const insightsRes = await query(`SELECT count(*) FROM ai_insights`);
        const remindersRes = await query(`SELECT count(*) FROM ai_reminders`);
        return {
            ...robotState,
            uptime: Math.floor((new Date() - robotState.startedAt) / 1000),
            insightsCount: parseInt(insightsRes.rows[0].count) || 0,
            remindersCount: parseInt(remindersRes.rows[0].count) || 0,
        };
    } catch (error) {
        return {
            ...robotState,
            uptime: Math.floor((new Date() - robotState.startedAt) / 1000),
            insightsCount: 0,
            remindersCount: 0,
        };
    }
}

export async function getInsights(limit = 20) {
    try {
        const res = await query(`SELECT * FROM ai_insights ORDER BY created_at DESC LIMIT $1`, [limit]);
        return res.rows;
    } catch (error) {
        logger.error('[AI Robot] Error fetching insights:', error.message);
        return [];
    }
}

export async function getReminders(limit = 20) {
    try {
        const res = await query(`SELECT * FROM ai_reminders ORDER BY created_at DESC LIMIT $1`, [limit]);
        return res.rows;
    } catch (error) {
        logger.error('[AI Robot] Error fetching reminders:', error.message);
        return [];
    }
}

export function toggleRobot() {
    robotState.enabled = !robotState.enabled;
    logger.info(`[AI Robot] Robot ${robotState.enabled ? 'ENABLED' : 'DISABLED'}`);
    return robotState.enabled;
}

export function isEnabled() {
    return robotState.enabled;
}

// ── Change Detection ──────────────────────────────────────────────

function detectChanges(currentAirdrops, previousAirdrops) {
    if (!previousAirdrops) return [];
    const changes = [];

    const prevMap = new Map(previousAirdrops.map(a => [a.id || a.name, a]));

    for (const current of currentAirdrops) {
        const key = current.id || current.name;
        const prev = prevMap.get(key);

        if (!prev) {
            changes.push({ name: current.name, change: 'Novo airdrop adicionado', severity: 'high' });
            continue;
        }

        if (prev.status !== current.status) {
            changes.push({
                name: current.name,
                change: `Status mudou de "${prev.status}" para "${current.status}"`,
                severity: current.status === 'claiming' ? 'critical' : 'high',
            });
        }

        if (prev.snapshot_date !== current.snapshot_date) {
            changes.push({
                name: current.name,
                change: `Data de snapshot alterada para ${current.snapshot_date}`,
                severity: 'critical',
            });
        }

        if (prev.estimated_value !== current.estimated_value) {
            changes.push({
                name: current.name,
                change: `Valor estimado alterado de $${prev.estimated_value || 0} para $${current.estimated_value || 0}`,
                severity: 'medium',
            });
        }
    }

    // Detect removed airdrops
    for (const prev of previousAirdrops) {
        const key = prev.id || prev.name;
        if (!currentAirdrops.some(c => (c.id || c.name) === key)) {
            changes.push({ name: prev.name, change: 'Airdrop removido', severity: 'high' });
        }
    }

    return changes;
}

// ── Mock Data ─────────────────────────────────────────────────────

function getMockAirdrops() {
    return [
        { id: 'scroll-v1', name: 'Scroll', chain: 'scroll', status: 'active', estimated_value: 500, snapshot_date: new Date(Date.now() + 86400000 * 5).toISOString(), updated_at: new Date(Date.now() - 86400000 * 3).toISOString() },
        { id: 'zksync-v2', name: 'zkSync Era', chain: 'zksync', status: 'active', estimated_value: 1200, claim_start: new Date(Date.now() + 86400000 * 2).toISOString(), updated_at: new Date(Date.now() - 86400000 * 10).toISOString() },
        { id: 'linea-v1', name: 'Linea', chain: 'linea', status: 'active', estimated_value: 300, claim_end: new Date(Date.now() + 86400000 * 4).toISOString(), updated_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { id: 'starknet-v1', name: 'StarkNet', chain: 'starknet', status: 'active', estimated_value: 800, snapshot_date: new Date(Date.now() + 86400000 * 15).toISOString(), updated_at: new Date(Date.now() - 86400000 * 14).toISOString() },
        { id: 'layerzero-v1', name: 'LayerZero', chain: 'multi', status: 'upcoming', estimated_value: 2000, updated_at: new Date(Date.now() - 86400000 * 20).toISOString() },
    ];
}

function getMockAirdropsContext() {
    return `- Scroll (scroll): Status=active, Valor~$500, Snapshot=em 5 dias
- zkSync Era (zksync): Status=active, Valor~$1200, Claim=em 2 dias
- Linea (linea): Status=active, Valor~$300, Claim fecha em 4 dias
- StarkNet (starknet): Status=active, Valor~$800, Snapshot=em 15 dias
- LayerZero (multi): Status=upcoming, Valor~$2000, Snapshot=TBD`;
}

function getMockSocialPosts() {
    return [
        { source: 'twitter', author: '@ScrollEco', content: 'Season 2 is live! Complete quests on Galxe to earn marks. New snapshot coming soon!' },
        { source: 'twitter', author: '@zaboris_eth', content: 'zkSync airdrop distribution starting next week. Make sure to check eligibility on the claim portal.' },
        { source: 'discord', author: 'LineaTeam', content: 'Reminder: Linea Voyage claim window closes in 4 days. Don\'t miss out!' },
        { source: 'twitter', author: '@StarkNetFan', content: 'StarkNet STRK staking goes live. New DeFi protocols launching on mainnet.' },
        { source: 'twitter', author: '@LayerZero_Labs', content: 'Big announcement coming next month. Stay tuned for token details.' },
    ];
}

function getDefaultStrategy() {
    return `🎯 **Estratégia Padrão (Offline)**

1. **Prioridades Imediatas**
   - Verificar claim de zkSync Era (abre em breve)
   - Interagir com Scroll antes do snapshot (~5 dias)
   - Fazer claim de Linea antes do prazo

2. **Oportunidades**  
   - LayerZero: alto valor estimado, continuar acumulando atividade
   - StarkNet: participar em DeFi no mainnet

3. **Riscos**
   - Claim de Linea fecha em poucos dias
   - Snapshot de Scroll se aproxima

Configure OPENROUTER_API_KEY para estratégias personalizadas via IA.`;
}

export default {
    scanAirdrops,
    generateStrategy,
    analyzeSocial,
    generateReminders,
    chatWithRobot,
    getStatus,
    getInsights,
    getReminders,
    toggleRobot,
    isEnabled,
};
