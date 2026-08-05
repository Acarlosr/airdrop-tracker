/**
 * Declarações de tipo para `services/auth.js` (módulo JS legado).
 * Existe apenas para permitir que módulos TypeScript importem essas funções
 * sob `strict` sem recorrer a `@ts-ignore` ou `any`.
 * Não emite código: não altera nada em runtime.
 */

export interface PendingUser {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
}

export interface SessionPayload {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
}

export function setPendingUser(identifier: string, user: PendingUser): Promise<boolean>;

export function getPendingUser(identifier: string): Promise<PendingUser | null>;

/** Retorna o código em desenvolvimento; `null` em produção. */
export function generateAndStoreOTP(identifier: string): Promise<string | null>;

export function verifyOTP(identifier: string, code: string): Promise<boolean>;

export function createSessionToken(payload: SessionPayload): string;

export function verifySessionToken(token: string): SessionPayload | null;

export function verifyGoogleToken(idToken: string): Promise<PendingUser | null>;

/** Valida o Bearer token da requisição. Usado pelo hook global em `index.ts`. */
export function authenticateRequest(request: {
  headers?: { authorization?: string };
}): SessionPayload | null;
