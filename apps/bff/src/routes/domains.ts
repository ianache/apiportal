import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const createSchema = z.object({
  name:        z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
  title:       z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  labels:      z.array(z.string().max(50)).default([]),
});

const updateSchema = createSchema.partial().omit({ name: true });

const domainRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /domains
  fastify.get('/domains', async () => {
    return fastify.prisma.domain.findMany({ orderBy: { title: 'asc' } });
  });

  // POST /domains
  fastify.post('/domains', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const data = createSchema.parse(request.body);
    try {
      return await fastify.prisma.domain.create({ data });
    } catch (e: any) {
      if (e.code === 'P2002') return reply.code(409).send({ error: 'A domain with this name already exists' });
      throw e;
    }
  });

  // PATCH /domains/:id
  fastify.patch('/domains/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { id } = request.params as { id: string };
    const data = updateSchema.parse(request.body);
    const existing = await fastify.prisma.domain.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });
    return fastify.prisma.domain.update({ where: { id }, data });
  });

  // DELETE /domains/:id
  fastify.delete('/domains/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { id } = request.params as { id: string };
    const existing = await fastify.prisma.domain.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });
    await fastify.prisma.domain.delete({ where: { id } });
    return reply.code(204).send();
  });

};

export default domainRoutes;
