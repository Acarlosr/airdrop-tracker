/**
 * Declarações de tipo para services/notifications.js (módulo JS legado).
 * Apenas o que é consumido por código TypeScript.
 */

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

export function notify(
  title: string,
  message: string,
  priority?: NotificationPriority,
): Promise<{ telegram: boolean; discord: boolean }>;

export interface TelegramOverride {
  token: string;
  chatId: string;
}

export function sendTelegram(
  title: string,
  message: string,
  priority?: NotificationPriority,
  override?: TelegramOverride | null,
): Promise<boolean>;

export function sendDiscord(
  title: string,
  message: string,
  priority?: NotificationPriority,
): Promise<boolean>;

export function getNotificationStatus(): { telegram: boolean; discord: boolean };

declare const _default: {
  notify: typeof notify;
  sendTelegram: typeof sendTelegram;
  sendDiscord: typeof sendDiscord;
  getNotificationStatus: typeof getNotificationStatus;
};
export default _default;
