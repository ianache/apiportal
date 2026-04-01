import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const propDefSchema = z.object({
  name:     z.string().min(1).max(60),
  type:     z.enum(['string', 'number', 'boolean', 'select', 'textarea']),
  required: z.boolean().default(false),
  options:  z.array(z.string()).optional(),
});

const createSchema = z.object({
  name:        z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  properties:  z.array(propDefSchema).default([]),
});

const updateSchema = createSchema.partial().omit({ name: true });

const nodeTypesCatalogRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /node-types
  fastify.get('/node-types', async () => {
    return fastify.prisma.nodeTypeCatalog.findMany({ orderBy: { name: 'asc' } });
  });

  // POST /node-types
  fastify.post('/node-types', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const data = createSchema.parse(request.body);
    try {
      return await fastify.prisma.nodeTypeCatalog.create({
        data: { ...data, properties: data.properties as any },
      });
    } catch (e: any) {
      if (e.code === 'P2002') return reply.code(409).send({ error: 'A node type with this name already exists' });
      throw e;
    }
  });

  // PATCH /node-types/:id
  fastify.patch('/node-types/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { id } = request.params as { id: string };
    const data = updateSchema.parse(request.body);
    const existing = await fastify.prisma.nodeTypeCatalog.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });
    return fastify.prisma.nodeTypeCatalog.update({
      where: { id },
      data: { ...data, ...(data.properties ? { properties: data.properties as any } : {}) },
    });
  });

  // DELETE /node-types/:id
  fastify.delete('/node-types/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { id } = request.params as { id: string };
    const existing = await fastify.prisma.nodeTypeCatalog.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });
    await fastify.prisma.nodeTypeCatalog.delete({ where: { id } });
    return reply.code(204).send();
  });

};

export default nodeTypesCatalogRoutes;
