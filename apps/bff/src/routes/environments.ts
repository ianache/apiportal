import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const createEnvironmentSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  name: z.string().min(1).max(100),
  tags: z.array(z.string()).optional().default([])
});

const updateEnvironmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  tags: z.array(z.string()).optional()
});

const environmentRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /environments - List all environments
  fastify.get('/environments', async (request) => {
    return fastify.prisma.environment.findMany({
      orderBy: { name: 'asc' }
    });
  });

  // GET /environments/:id - Get single environment
  fastify.get('/environments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const env = await fastify.prisma.environment.findUnique({
      where: { id }
    });
    if (!env) return reply.code(404).send({ error: 'Not Found' });
    return env;
  });

  // POST /environments - Create new environment
  fastify.post('/environments', async (request, reply) => {
    try {
      // RBAC: Only API_MANAGER can create environments
      if (request.user?.role !== 'API_MANAGER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Only Managers can create environments' });
      }

      const data = createEnvironmentSchema.parse(request.body);
      fastify.log.info({ slug: data.slug }, 'Creating environment');

      const env = await fastify.prisma.environment.create({
        data
      });

      return env;
    } catch (err: any) {
      fastify.log.error(err, 'Failed to create environment');
      if (err.code === 'P2002') {
        return reply.code(409).send({ error: 'Conflict', message: 'An environment with this slug already exists' });
      }
      throw err;
    }
  });

  // PATCH /environments/:id - Update environment
  fastify.patch('/environments/:id', async (request, reply) => {
    try {
      // RBAC: Only API_MANAGER can update environments
      if (request.user?.role !== 'API_MANAGER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Only Managers can update environments' });
      }

      const { id } = request.params as { id: string };
      const updates = updateEnvironmentSchema.parse(request.body);

      const existing = await fastify.prisma.environment.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ error: 'Not Found' });

      const updated = await fastify.prisma.environment.update({
        where: { id },
        data: updates
      });

      return updated;
    } catch (err: any) {
      fastify.log.error(err, 'Failed to update environment');
      if (err.code === 'P2002') {
        return reply.code(409).send({ error: 'Conflict', message: 'An environment with this slug already exists' });
      }
      throw err;
    }
  });

  // DELETE /environments/:id - Delete environment
  fastify.delete('/environments/:id', async (request, reply) => {
    try {
      // RBAC: Only API_MANAGER can delete environments
      if (request.user?.role !== 'API_MANAGER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Only Managers can delete environments' });
      }

      const { id } = request.params as { id: string };

      const existing = await fastify.prisma.environment.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ error: 'Not Found' });

      await fastify.prisma.environment.delete({
        where: { id }
      });

      return { success: true };
    } catch (err: any) {
      fastify.log.error(err, 'Failed to delete environment');
      throw err;
    }
  });

};

export default environmentRoutes;
