import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getRedis } from '../config/redis.js';
import logger from '../utils/logger.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'airdrop-tracker-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const OTP_TTL = 5 * 60; // 5 minutos
const OTP_LENGTH = 6;
const USER_PENDING_TTL = 10 * 60; // 10 min para completar OTP

const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// ── In-memory fallback when Redis is unavailable ──────────────────
const memoryStore = new Map();

function memSet(key, value, ttlSeconds) {
  memoryStore.set(key, value);
  setTimeout(() => memoryStore.delete(key), ttlSeconds * 1000);
}

function memGet(key) {
  return memoryStore.get(key) ?? null;
}

function memDel(key) {
  memoryStore.delete(key);
}

/**
 * Verifica o ID token do Google e retorna o payload do usuário.
 */
export async function verifyGoogleToken(idToken) {
  if (!client || !GOOGLE_CLIENT_ID) {
    logger.warn('Google OAuth not configured (GOOGLE_CLIENT_ID missing)');
    return null;
  }
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (err) {
    logger.error('Google token verification failed:', err.message);
    return null;
  }
}

/**
 * Armazena dados do usuário pendente (após Google, antes de OTP).
 * Usa Redis se disponível, caso contrário armazena em memória.
 */
export async function setPendingUser(identifier, user) {
  const redis = getRedis();
  const key = `auth:pending:${identifier}`;
  if (redis) {
    await redis.setEx(key, USER_PENDING_TTL, JSON.stringify(user));
  } else {
    memSet(key, JSON.stringify(user), USER_PENDING_TTL);
  }
  return true;
}

/**
 * Recupera dados do usuário pendente.
 */
export async function getPendingUser(identifier) {
  const redis = getRedis();
  const key = `auth:pending:${identifier}`;
  let data;
  if (redis) {
    data = await redis.get(key);
  } else {
    data = memGet(key);
  }
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Gera OTP de 6 dígitos e armazena (Redis ou memória).
 * Em desenvolvimento retornamos o código na API para exibir na tela.
 */
export async function generateAndStoreOTP(identifier) {
  const otp = crypto.randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH - 1).toString();
  const redis = getRedis();
  const key = `otp:${identifier}`;
  if (redis) {
    await redis.setEx(key, OTP_TTL, otp);
  } else {
    memSet(key, otp, OTP_TTL);
  }
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    logger.info(`[OTP] ${identifier} => ${otp} (TTL ${OTP_TTL}s)`);
  }
  return isDev ? otp : null;
}

/**
 * Verifica OTP para o identificador. Remove após validação.
 */
export async function verifyOTP(identifier, code) {
  const redis = getRedis();
  const key = `otp:${identifier}`;
  let stored;
  if (redis) {
    stored = await redis.get(key);
    if (stored && stored === String(code).trim()) {
      await redis.del(key);
      return true;
    }
  } else {
    stored = memGet(key);
    if (stored && stored === String(code).trim()) {
      memDel(key);
      return true;
    }
  }
  return false;
}

/**
 * Gera JWT para o usuário após login (Google + OTP).
 */
export function createSessionToken(payload) {
  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifica JWT e retorna o payload.
 */
export function verifySessionToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Valida o Bearer token usado pelas rotas JavaScript efetivamente registradas.
 */
export function authenticateRequest(request) {
  const authHeader = request.headers?.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  return verifySessionToken(token);
}
