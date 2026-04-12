import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const createSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateSchema = createSchema.partial();

const organizationRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /organizations
  fastify.get('/organizations', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    
    const organizations = await fastify.prisma.organization.findMany({
      include: {
        _count: {
          select: { apis: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return organizations.map(org => ({
      ...org,
      apiCount: org._count.apis
    }));
  });

  // GET /organizations/:id
  fastify.get('/organizations/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    
    const organization = await fastify.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: { apis: true }
        },
        products: true,
        apis: true
      }
    });
    
    if (!organization) return reply.code(404).send({ error: 'Not found' });
    
    return {
      ...organization,
      apiCount: organization._count.apis
    };
  });

  // POST /organizations
  fastify.post('/organizations', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    
    // In this project, we assume User model exists and is linked via request.user.id
    // But we need to make sure the user exists in our DB first if it's from Keycloak
    const dbUser = await fastify.prisma.user.findUnique({
      where: { sub: request.user.sub }
    });
    
    if (!dbUser) return reply.code(401).send({ error: 'User not synchronized' });

    const data = createSchema.parse(request.body);
    try {
      return await fastify.prisma.organization.create({
        data: {
          ...data,
          createdById: dbUser.id
        }
      });
    } catch (e: any) {
      if (e.code === 'P2002') return reply.code(409).send({ error: 'An organization with this name already exists' });
      throw e;
    }
  });

  // PATCH /organizations/:id
  fastify.patch('/organizations/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const { id } = request.params as { id: string };
    const data = updateSchema.parse(request.body);
    
    const existing = await fastify.prisma.organization.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });
    
    return fastify.prisma.organization.update({
      where: { id },
      data
    });
  });

  // DELETE /organizations/:id
  fastify.delete('/organizations/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    const { id } = request.params as { id: string };
    const existing = await fastify.prisma.organization.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });
    
    await fastify.prisma.organization.delete({ where: { id } });
    return reply.code(204).send();
  });
};

export default organizationRoutes;
