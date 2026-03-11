import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';

const client = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

export interface GoogleUser {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
}

/**
 * Valida o ID token do Google e retorna os dados do usuário.
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleUser | null> {
  if (!client || !env.GOOGLE_CLIENT_ID) return null;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) return null;
    return {
      sub: payload.sub!,
      email: payload.email ?? '',
      name: payload.name ?? null,
      picture: payload.picture ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Gera JWT de sessão para o usuário (7 dias por padrão).
 */
export function createSessionToken(payload: JwtPayload): string {
  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
}

/**
 * Valida o JWT e retorna o payload ou null.
 */
export function verifySessionToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
