import { FastifyRequest, FastifyReply } from 'fastify';
import {
  uploadAirdropImage,
  listAirdropImages,
  deleteAirdropImage,
} from '../services/airdropImagesService.js';

function getUserId(request: FastifyRequest, reply: FastifyReply): string | null {
  const user = request.user;
  if (!user?.sub) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  return user.sub;
}

/** POST /api/airdrops/:id/images — upload de um print (multipart/form-data, campo "file"). */
export async function upload(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const userId = getUserId(request, reply);
  if (userId === null) return;

  const data = await request.file();
  if (!data) {
    return reply.status(400).send({ error: 'Envie um arquivo no campo "file".' });
  }

  const buffer = await data.toBuffer();
  const captionField = data.fields?.caption as { value?: string } | undefined;
  const caption = captionField?.value ?? null;

  const image = await uploadAirdropImage(
    userId,
    request.params.id,
    { buffer, mimetype: data.mimetype },
    caption,
  );
  if (!image) {
    return reply.status(400).send({ error: 'Airdrop não encontrado ou tipo de arquivo não suportado (use PNG, JPG, WEBP ou GIF).' });
  }
  return reply.status(201).send(image);
}

/** GET /api/airdrops/:id/images — lista os prints do airdrop. */
export async function list(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const userId = getUserId(request, reply);
  if (userId === null) return;
  const images = await listAirdropImages(userId, request.params.id);
  return reply.send({ images });
}

/** DELETE /api/airdrops/:id/images/:imageId — remove um print. */
export async function remove(
  request: FastifyRequest<{ Params: { id: string; imageId: string } }>,
  reply: FastifyReply,
) {
  const userId = getUserId(request, reply);
  if (userId === null) return;
  const ok = await deleteAirdropImage(userId, request.params.imageId);
  return reply.status(ok ? 200 : 404).send({ deleted: ok });
}
