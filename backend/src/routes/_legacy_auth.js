import {
  verifyGoogleToken,
  generateAndStoreOTP,
  verifyOTP,
  createSessionToken,
  verifySessionToken,
  setPendingUser,
  getPendingUser,
} from '../services/auth.js';

export default async function authRoutes(fastify) {
  // POST /auth/dev/request-otp - apenas em desenvolvimento: gera OTP para email (sem Google)
  fastify.post('/dev/request-otp', async (request, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.status(404).send();
    }
    const { email, name } = request.body || {};
    const identifier = email || 'dev@localhost';
    await setPendingUser(identifier, {
      sub: identifier,
      email: identifier,
      name: name || 'Dev User',
      picture: null,
    });
    const otpCode = await generateAndStoreOTP(identifier);
    return reply.send({
      success: true,
      requireOtp: true,
      identifier,
      email: identifier,
      name: name || 'Dev User',
      picture: null,
      otpCode, // em dev: código para exibir na tela (não enviamos por e-mail)
    });
  });

  // POST /auth/google - o ID token verificado pelo Google já é o segundo fator de confiança.
  fastify.post('/google', async (request, reply) => {
    const { credential } = request.body || {};
    if (!credential) {
      return reply.status(400).send({ error: 'credential (Google id_token) is required' });
    }
    const user = await verifyGoogleToken(credential);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid Google token' });
    }

    const allowedEmails = String(process.env.ALLOWED_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    if (allowedEmails.length > 0 && !allowedEmails.includes(String(user.email).toLowerCase())) {
      return reply.status(403).send({ error: 'Este e-mail não está autorizado a acessar o painel.' });
    }

    const token = createSessionToken(user);
    return reply.send({
      success: true,
      token,
      user: {
        sub: user.sub,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  });

  // POST /auth/otp/resend - reenvia OTP para o mesmo identifier (só se já existir sessão pendente)
  fastify.post('/otp/resend', async (request, reply) => {
    const { identifier } = request.body || {};
    if (!identifier) {
      return reply.status(400).send({ error: 'identifier is required' });
    }
    const pending = await getPendingUser(identifier);
    if (!pending) {
      return reply.status(400).send({ error: 'Sessão expirada. Volte e solicite o login novamente.' });
    }
    const otpCode = await generateAndStoreOTP(identifier);
    return reply.send({
      success: true,
      message: 'Novo código enviado.',
      ...(otpCode && { otpCode }),
    });
  });

  // POST /auth/otp/verify - envia identifier + code, retorna JWT
  fastify.post('/otp/verify', async (request, reply) => {
    const { identifier, code } = request.body || {};
    if (!identifier || !code) {
      return reply.status(400).send({ error: 'identifier and code are required' });
    }
    const valid = await verifyOTP(identifier, String(code).trim());
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid or expired OTP' });
    }
    const pending = await getPendingUser(identifier);
    const payload = pending
      ? { sub: pending.sub, email: pending.email, name: pending.name, picture: pending.picture }
      : { sub: identifier, email: identifier, name: null, picture: null };
    const token = createSessionToken(payload);
    return reply.send({
      success: true,
      token,
      user: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
    });
  });

  // GET /auth/me - valida Bearer e retorna usuário
  fastify.get('/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return reply.status(401).send({ error: 'Missing or invalid authorization' });
    }
    const payload = verifySessionToken(token);
    if (!payload) {
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }
    return reply.send({
      user: {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
    });
  });
}
