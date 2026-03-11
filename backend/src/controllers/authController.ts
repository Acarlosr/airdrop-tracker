import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyGoogleToken, createSessionToken } from '../services/googleAuthService.js';
import { upsertUserByGoogle } from '../services/supabaseService.js';

interface GoogleBody {
  credential?: string;
}

export async function loginWithGoogle(request: FastifyRequest<{ Body: GoogleBody }>, reply: FastifyReply) {
  const { credential } = request.body ?? {};
  if (!credential) {
    return reply.status(400).send({ error: 'credential (Google id_token) is required' });
  }

  const user = await verifyGoogleToken(credential);
  if (!user) {
    return reply.status(401).send({ error: 'Invalid Google token' });
  }

  const dbUser = await upsertUserByGoogle(user.sub, {
    email: user.email,
    name: user.name,
    picture: user.picture,
  });
  if (!dbUser) {
    return reply.status(500).send({ error: 'Failed to create or update user' });
  }

  const token = createSessionToken({
    sub: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    picture: dbUser.picture,
  });

  return reply.send({
    token,
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      picture: dbUser.picture,
    },
  });
}

export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Not authenticated' });
  }
  return reply.send({ user });
}
