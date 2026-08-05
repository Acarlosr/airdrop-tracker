import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { loginWithGoogle, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import {
  setPendingUser,
  getPendingUser,
  generateAndStoreOTP,
  verifyOTP,
  createSessionToken,
} from '../services/auth.js';
import { upsertUserByGoogle } from '../services/supabaseService.js';

/**
 * Prefixo do `google_id` para contas criadas pelo login local de desenvolvimento.
 * Mantém essas contas isoladas das criadas pelo Google, sem alterar o schema.
 */
const LOCAL_ACCOUNT_PREFIX = 'local:';

interface DevOtpBody {
  email?: string;
  name?: string;
}

interface ResendOtpBody {
  identifier?: string;
}

interface VerifyOtpBody {
  identifier?: string;
  code?: string | number;
}

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/google', loginWithGoogle);
  fastify.get('/me', { preHandler: [requireAuth] }, getMe);

  // POST /auth/dev/request-otp — somente fora de produção: gera OTP para e-mail, sem Google.
  fastify.post(
    '/dev/request-otp',
    async (request: FastifyRequest<{ Body: DevOtpBody }>, reply: FastifyReply) => {
      if (process.env.NODE_ENV === 'production') {
        return reply.status(404).send();
      }

      const { email, name } = request.body ?? {};
      const identifier = email || 'dev@localhost';
      const displayName = name || 'Dev User';

      await setPendingUser(identifier, {
        sub: identifier,
        email: identifier,
        name: displayName,
        picture: null,
      });

      const otpCode = await generateAndStoreOTP(identifier);

      return reply.send({
        success: true,
        requireOtp: true,
        identifier,
        email: identifier,
        name: displayName,
        picture: null,
        otpCode, // em dev: exibido na tela, não enviado por e-mail
      });
    }
  );

  // POST /auth/otp/resend — reenvia OTP, apenas se já houver sessão pendente.
  fastify.post(
    '/otp/resend',
    async (request: FastifyRequest<{ Body: ResendOtpBody }>, reply: FastifyReply) => {
      const { identifier } = request.body ?? {};
      if (!identifier) {
        return reply.status(400).send({ error: 'identifier is required' });
      }

      const pending = await getPendingUser(identifier);
      if (!pending) {
        return reply
          .status(400)
          .send({ error: 'Sessão expirada. Volte e solicite o login novamente.' });
      }

      const otpCode = await generateAndStoreOTP(identifier);

      return reply.send({
        success: true,
        message: 'Novo código enviado.',
        ...(otpCode && { otpCode }),
      });
    }
  );

  // POST /auth/otp/verify — valida identifier + code e devolve o JWT de sessão.
  fastify.post(
    '/otp/verify',
    async (request: FastifyRequest<{ Body: VerifyOtpBody }>, reply: FastifyReply) => {
      const { identifier, code } = request.body ?? {};
      if (!identifier || !code) {
        return reply.status(400).send({ error: 'identifier and code are required' });
      }

      const valid = await verifyOTP(identifier, String(code).trim());
      if (!valid) {
        return reply.status(401).send({ error: 'Invalid or expired OTP' });
      }

      const pending = await getPendingUser(identifier);

      // O `sub` do token precisa ser o UUID do usuário em `public.users`: é ele que
      // as tabelas de dados usam em `user_id` (FK). Usar o e-mail aqui faz toda
      // consulta de airdrops/carteiras/transações falhar por tipo incompatível.
      const dbUser = await upsertUserByGoogle(`${LOCAL_ACCOUNT_PREFIX}${identifier}`, {
        email: pending?.email ?? identifier,
        name: pending?.name ?? null,
        picture: pending?.picture ?? null,
      });

      if (!dbUser) {
        return reply.status(500).send({ error: 'Não foi possível criar a conta local.' });
      }

      const token = createSessionToken({
        sub: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        picture: dbUser.picture,
      });

      return reply.send({
        success: true,
        token,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          picture: dbUser.picture,
        },
      });
    }
  );
}
