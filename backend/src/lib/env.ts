/**
 * Variáveis de ambiente validadas para o backend ClaimOS.
 * Nunca exponha SUPABASE_SERVICE_ROLE_KEY ou OPENROUTER_API_KEY no frontend.
 */

import dotenv from 'dotenv';
dotenv.config();

function getEnv(key: string, defaultValue = ''): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  // ── Core ──────────────────────────────────────────────────────
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  // ── Database ──────────────────────────────────────────────────
  DATABASE_URL: getEnv('DATABASE_URL'),
  DB_POOL_SIZE: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),

  // ── Redis / Cache ─────────────────────────────────────────────
  REDIS_URL: getEnv('REDIS_URL'),
  CACHE_TTL_HOURS: parseInt(process.env.CACHE_TTL_HOURS ?? '24', 10),

  // ── Auth ──────────────────────────────────────────────────────
  GOOGLE_CLIENT_ID: getEnv('GOOGLE_CLIENT_ID'),
  JWT_SECRET: getEnv('JWT_SECRET') || 'change-me-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',

  // ── Supabase (opcional, usado pelo supabaseService.ts) ────────
  SUPABASE_URL: getEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // ── IA ────────────────────────────────────────────────────────
  GROQ_API_KEY: getEnv('GROQ_API_KEY'),
  GROQ_MODEL: process.env.GROQ_MODEL ?? 'llama-3-8b-8192',
  OPENROUTER_API_KEY: getEnv('OPENROUTER_API_KEY'),
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL ?? 'z-ai/glm-4.5-air:free',
  OLLAMA_HOST: getEnv('OLLAMA_HOST', 'http://localhost:11434'),
  USE_OLLAMA: process.env.USE_OLLAMA === 'true',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL ?? 'llama3.1:8b',

  // ── Blockchain ────────────────────────────────────────────────
  MORALIS_API_KEY: getEnv('MORALIS_API_KEY'),

  // ── Social ────────────────────────────────────────────────────
  TWITTER_BEARER_TOKEN: getEnv('TWITTER_BEARER_TOKEN'),
  DISCORD_BOT_TOKEN: getEnv('DISCORD_BOT_TOKEN'),
  DISCORD_AIRDROP_CHANNEL: getEnv('DISCORD_AIRDROP_CHANNEL'),
  DISCORD_WEBHOOK_URL: getEnv('DISCORD_WEBHOOK_URL'),

  // ── Notifications ─────────────────────────────────────────────
  TELEGRAM_BOT_TOKEN: getEnv('TELEGRAM_BOT_TOKEN'),
  TELEGRAM_CHAT_ID: getEnv('TELEGRAM_CHAT_ID'),

  // ── Segurança (segredos por usuário) ───────────────────────────
  ENCRYPTION_KEY: getEnv('ENCRYPTION_KEY'),

  // ── Logging ───────────────────────────────────────────────────
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW ?? '15m',

  // ── AI Robot ──────────────────────────────────────────────────
  AI_ROBOT_ENABLED: process.env.AI_ROBOT_ENABLED !== 'false',
  AI_ROBOT_SCAN_INTERVAL: parseInt(process.env.AI_ROBOT_SCAN_INTERVAL ?? '30', 10),
} as const;
