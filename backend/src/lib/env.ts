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
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  GOOGLE_CLIENT_ID: getEnv('GOOGLE_CLIENT_ID'),
  JWT_SECRET: getEnv('JWT_SECRET') || 'change-me-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',

  SUPABASE_URL: getEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY'),

  OPENROUTER_API_KEY: getEnv('OPENROUTER_API_KEY'),
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL ?? 'z-ai/glm-4.5-air:free',

  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW ?? '15m',

  AI_ROBOT_ENABLED: process.env.AI_ROBOT_ENABLED !== 'false',
  AI_ROBOT_SCAN_INTERVAL: parseInt(process.env.AI_ROBOT_SCAN_INTERVAL ?? '30', 10),
} as const;
