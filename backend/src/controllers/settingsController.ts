import { FastifyRequest, FastifyReply } from 'fastify';
import {
  getUserSettingsView,
  getUserSettingsSecrets,
  saveUserSettings,
  SaveSettingsInput,
} from '../services/userSettingsService.js';
import notifications from '../services/notifications.js';

function getUserId(request: FastifyRequest, reply: FastifyReply): string | null {
  const user = request.user;
  if (!user?.sub) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  return user.sub;
}

/** GET /api/settings — configurações do usuário logado (sem expor segredos). */
export async function getSettings(request: FastifyRequest, reply: FastifyReply) {
  const userId = getUserId(request, reply);
  if (userId === null) return;
  const view = await getUserSettingsView(userId);
  return reply.send(view);
}

interface SaveBody {
  telegramBotToken?: string | null;
  telegramChatId?: string | null;
  openrouterApiKey?: string | null;
  openrouterModel?: string | null;
  dailyBriefEnabled?: boolean;
}

/** PUT /api/settings — salva configurações do usuário logado. */
export async function putSettings(
  request: FastifyRequest<{ Body: SaveBody }>,
  reply: FastifyReply,
) {
  const userId = getUserId(request, reply);
  if (userId === null) return;

  const body = request.body ?? {};
  const input: SaveSettingsInput = {
    telegramBotToken: body.telegramBotToken,
    telegramChatId: body.telegramChatId,
    openrouterApiKey: body.openrouterApiKey,
    openrouterModel: body.openrouterModel,
    dailyBriefEnabled: body.dailyBriefEnabled,
  };
  await saveUserSettings(userId, input);
  const view = await getUserSettingsView(userId);
  return reply.send(view);
}

/** POST /api/settings/test-telegram — envia uma mensagem de teste com as credenciais salvas. */
export async function testTelegram(request: FastifyRequest, reply: FastifyReply) {
  const userId = getUserId(request, reply);
  if (userId === null) return;

  const secrets = await getUserSettingsSecrets(userId);
  if (!secrets.telegramBotToken || !secrets.telegramChatId) {
    return reply.status(400).send({ error: 'Configure o token do bot e o chat_id antes de testar.' });
  }

  const ok = await notifications.sendTelegram(
    'ClaimOS — teste de conexão',
    'Se você recebeu essa mensagem, seu robô do Telegram está configurado corretamente. ✅',
    'normal',
    { token: secrets.telegramBotToken, chatId: secrets.telegramChatId },
  );
  return reply.status(ok ? 200 : 502).send({ sent: ok });
}

interface OpenRouterModel {
  id: string;
  name?: string;
  pricing?: { prompt?: string; completion?: string };
}

/** GET /api/settings/free-models — lista ao vivo dos modelos gratuitos do OpenRouter. */
export async function getFreeModels(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) throw new Error(`OpenRouter respondeu ${res.status}`);
    const data = (await res.json()) as { data?: OpenRouterModel[] };
    const models = (data.data ?? [])
      .filter((m) => m.id.endsWith(':free') || (m.pricing?.prompt === '0' && m.pricing?.completion === '0'))
      .map((m) => ({ id: m.id, name: m.name ?? m.id }));
    return reply.send({ models });
  } catch {
    // Fallback estático — a lista ao vivo pode falhar por rede; o usuário ainda consegue digitar o id manualmente.
    return reply.send({
      models: [{ id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (free) — padrão do ClaimOS' }],
      warning: 'Não foi possível consultar a lista ao vivo do OpenRouter agora. Mostrando só o padrão.',
    });
  }
}
