import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const propDefSchema = z.object({
  name:     z.string().min(1).max(60),
  type:     z.enum(['string', 'number', 'boolean', 'select', 'textarea']),
  nature:   z.enum(['input', 'variable']).default('input'),
  required: z.boolean().default(false),
  options:  z.array(z.string()).optional(),
});

const createSchema = z.object({
  name:        z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  icon:        z.string().max(50).optional(),
  color:       z.string().max(20).optional(),
  properties:  z.array(propDefSchema).default([]),
});

const updateSchema = createSchema.partial().omit({ name: true });

const txNodeTypesCatalogRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /tx-node-types
  fastify.get('/tx-node-types', async () => {
    return fastify.prisma.txNodeTypeCatalog.findMany({ orderBy: { name: 'asc' } });
  });

  // POST /tx-node-types
  fastify.post('/tx-node-types', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const data = createSchema.parse(request.body);
    try {
      return await fastify.prisma.txNodeTypeCatalog.create({
        data: { ...data, properties: data.properties as any },
      });
    } catch (e: any) {
      if (e.code === 'P2002') return reply.code(409).send({ error: 'A node type with this name already exists' });
      throw e;
    }
  });

  // PATCH /tx-node-types/:id
  fastify.patch('/tx-node-types/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { id } = request.params as { id: string };
    const data = updateSchema.parse(request.body);
    const existing = await fastify.prisma.txNodeTypeCatalog.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });
    return fastify.prisma.txNodeTypeCatalog.update({
      where: { id },
      data: { ...data, ...(data.properties ? { properties: data.properties as any } : {}) },
    });
  });

  // DELETE /tx-node-types/:id
  fastify.delete('/tx-node-types/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { id } = request.params as { id: string };
    const existing = await fastify.prisma.txNodeTypeCatalog.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });
    await fastify.prisma.txNodeTypeCatalog.delete({ where: { id } });
    return reply.code(204).send();
  });

};

export default txNodeTypesCatalogRoutes;
