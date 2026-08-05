import crypto from 'node:crypto';
import { env } from './env.js';

/**
 * Cifra/decifra segredos por usuário (token do Telegram, chave OpenRouter)
 * antes de gravar no Supabase. AES-256-GCM com uma chave só do servidor
 * (ENCRYPTION_KEY, 32 bytes em base64) — nunca sai do backend.
 *
 * Formato armazenado: "<iv base64>:<authTag base64>:<ciphertext base64>"
 */

function getKey(): Buffer {
  const raw = env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'ENCRYPTION_KEY não configurada. Gere uma com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))" e adicione ao .env',
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY inválida — precisa ser 32 bytes em base64.');
  }
  return key;
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Segredo armazenado em formato inválido.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/** Últimos 4 caracteres, para mostrar "configurado, terminando em ...ab12" sem expor o segredo. */
export function previewSecret(plain: string): string {
  return plain.length <= 4 ? '••••' : `••••${plain.slice(-4)}`;
}
