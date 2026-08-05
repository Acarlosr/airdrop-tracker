import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Notification Service — sends alerts to Telegram and Discord.
 * Configuration via environment variables:
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *   DISCORD_WEBHOOK_URL
 */

const PRIORITY_EMOJI = {
    critical: '🚨',
    high: '⚠️',
    normal: 'ℹ️',
    low: '📋',
};

// ── Telegram ──────────────────────────────────────────────────────
// `override` permite enviar com credenciais de um usuário específico
// (robô por usuário) em vez das globais do .env.
async function sendTelegram(title, message, priority = 'normal', override = null) {
    const token = override?.token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = override?.chatId || process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return false;

    const emoji = PRIORITY_EMOJI[priority] || 'ℹ️';
    const text = `${emoji} <b>${title}</b>\n\n${message}\n\n<i>Priority: ${priority}</i>`;

    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });
        logger.info(`[Telegram] Sent: ${title}`);
        return true;
    } catch (err) {
        logger.error('[Telegram] Failed:', err.message);
        return false;
    }
}

// ── Discord Webhook ───────────────────────────────────────────────
async function sendDiscord(title, message, priority = 'normal') {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return false;

    const colorMap = { critical: 0xff0000, high: 0xff8c00, normal: 0x00d4ff, low: 0x808080 };
    const emoji = PRIORITY_EMOJI[priority] || 'ℹ️';

    try {
        await axios.post(webhookUrl, {
            embeds: [{
                title: `${emoji} ${title}`,
                description: message,
                color: colorMap[priority] || colorMap.normal,
                timestamp: new Date().toISOString(),
                footer: { text: `Airdrop Tracker • ${priority}` },
            }],
        });
        logger.info(`[Discord] Sent: ${title}`);
        return true;
    } catch (err) {
        logger.error('[Discord] Failed:', err.message);
        return false;
    }
}

// ── Unified notify ────────────────────────────────────────────────
/**
 * Send notification to all configured channels.
 * @param {string} title - Alert title
 * @param {string} message - Alert body
 * @param {'critical'|'high'|'normal'|'low'} priority
 * @returns {{ telegram: boolean, discord: boolean }}
 */
export async function notify(title, message, priority = 'normal') {
    const [telegram, discord] = await Promise.allSettled([
        sendTelegram(title, message, priority),
        sendDiscord(title, message, priority),
    ]);

    return {
        telegram: telegram.status === 'fulfilled' && telegram.value === true,
        discord: discord.status === 'fulfilled' && discord.value === true,
    };
}

/**
 * Check which notification channels are configured.
 */
export function getNotificationStatus() {
    return {
        telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
        discord: !!process.env.DISCORD_WEBHOOK_URL,
    };
}

export default { notify, sendTelegram, sendDiscord, getNotificationStatus };
