import { getTodayPanel, TodayItem } from './interactionsService.js';
import { chat } from './openrouterService.js';
import notifications from './notifications.js';
import { getUserSettingsSecrets, listDailyBriefRecipients } from './userSettingsService.js';

function renderPanelAsText(items: TodayItem[]): string {
  if (items.length === 0) return 'Nenhum airdrop cadastrado.';
  return items
    .map((i) => {
      const status = i.checkedInToday ? 'check-in OK' : 'check-in PENDENTE';
      const streak = i.streak > 0 ? `streak ${i.streak}d` : 'sem streak';
      return `- ${i.name} (${i.network ?? 'rede?'}) — ${status}, ${streak}, fase: ${i.phase ?? '?'}, potencial: ${i.potential ?? '?'}`;
    })
    .join('\n');
}

/**
 * Monta o resumo do dia para um usuário. Usa a chave/modelo OpenRouter
 * DELE (configurados em Configurações); se não tiver, cai no texto cru —
 * o robô nunca fica mudo por causa da IA.
 */
export async function buildDailyBrief(userId: string): Promise<string> {
  const items = await getTodayPanel(userId);
  const raw = renderPanelAsText(items);
  const pending = items.filter((i) => !i.checkedInToday).length;

  const header = `Resumo ClaimOS — ${new Date().toLocaleDateString('pt-BR')}\n${pending} check-in(s) pendente(s) de ${items.length} airdrop(s).`;

  const secrets = await getUserSettingsSecrets(userId);
  if (!secrets.openrouterApiKey) return `${header}\n\n${raw}`;

  try {
    const text = await chat(
      [
        {
          role: 'system',
          content:
            'Você é o robô do ClaimOS, um tracker de airdrops. Escreva em português (Brasil), ' +
            'curto e direto, formato de mensagem de Telegram (sem markdown pesado). ' +
            'NUNCA sugira executar transações, claims ou swaps automaticamente — o sistema é somente leitura. ' +
            'Priorize: 1) check-ins pendentes com maior streak em risco; 2) prazos próximos; 3) uma dica breve.',
        },
        {
          role: 'user',
          content: `Redija o resumo diário a partir destes dados:\n\n${raw}`,
        },
      ],
      { apiKey: secrets.openrouterApiKey, model: secrets.openrouterModel },
    );
    return `${header}\n\n${text}`;
  } catch {
    return `${header}\n\n${raw}`;
  }
}

/** Monta e envia o resumo de UM usuário para o Telegram configurado por ele. */
export async function sendDailyBriefForUser(userId: string): Promise<{ sent: boolean; reason?: string }> {
  const secrets = await getUserSettingsSecrets(userId);
  if (!secrets.telegramBotToken || !secrets.telegramChatId) {
    return { sent: false, reason: 'Telegram não configurado em Configurações.' };
  }

  const message = await buildDailyBrief(userId);
  const ok = await notifications.sendTelegram('Resumo diário de airdrops', message, 'normal', {
    token: secrets.telegramBotToken,
    chatId: secrets.telegramChatId,
  });
  return ok ? { sent: true } : { sent: false, reason: 'Falha ao enviar para o Telegram.' };
}

/** Envia o resumo diário para todos os usuários com o robô habilitado (usado pelo agendador). */
export async function sendDailyBriefToAllUsers(): Promise<{ total: number; sent: number }> {
  const userIds = await listDailyBriefRecipients();
  let sent = 0;
  for (const userId of userIds) {
    try {
      const result = await sendDailyBriefForUser(userId);
      if (result.sent) sent += 1;
    } catch {
      // Falha de um usuário não pode travar os demais.
    }
  }
  return { total: userIds.length, sent };
}

let briefTimer: ReturnType<typeof setInterval> | null = null;
let lastSentOn: string | null = null;

/**
 * Agendador simples do resumo diário: checa a cada 15 min se chegou a
 * hora configurada (DAILY_BRIEF_HOUR, padrão 9h) e envia uma vez por dia
 * para todos os usuários que habilitaram o robô em Configurações.
 * Sem dependência de Redis/fila — reversível removendo esta chamada.
 */
export function startDailyBriefScheduler(): void {
  if (briefTimer) return;
  const hour = parseInt(process.env.DAILY_BRIEF_HOUR ?? '9', 10);

  briefTimer = setInterval(async () => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (now.getHours() !== hour || lastSentOn === today) return;
    lastSentOn = today;
    try {
      await sendDailyBriefToAllUsers();
    } catch {
      // Falha de rede não pode derrubar o servidor; tenta de novo amanhã.
      lastSentOn = null;
    }
  }, 15 * 60 * 1000);

  briefTimer.unref?.();
}
