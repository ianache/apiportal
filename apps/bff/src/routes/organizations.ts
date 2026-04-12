import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const createSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateSchema = createSchema.partial().extend({
  ownerId: z.string().uuid().optional().nullable(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
});

const swciSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['API', 'DATABASE', 'MICROSERVICE', 'FRONTEND', 'EXTERNAL_SERVICE', 'MESSAGE_BROKER']),
});

const organizationRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /organizations
  fastify.get('/organizations', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    
    const organizations = await fastify.prisma.organization.findMany({
      include: {
        _count: {
          select: { apis: true }
        },
        owner: true
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
        owner: true,
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
        },
        include: { owner: true }
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
      data,
      include: { owner: true }
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

  // --- PRODUCT ROUTES ---

  // GET /organizations/:orgId/products
  fastify.get('/organizations/:orgId/products', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { orgId } = request.params as { orgId: string };

    return fastify.prisma.product.findMany({
      where: { organizationId: orgId },
      include: {
        createdBy: true
      },
      orderBy: { name: 'asc' }
    });
  });

  // GET /products/:id
  fastify.get('/products/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const product = await fastify.prisma.product.findUnique({ 
      where: { id },
      include: { organization: true }
    });
    if (!product) return reply.code(404).send({ error: 'Product not found' });
    return product;
  });

  // POST /organizations/:orgId/products
  fastify.post('/organizations/:orgId/products', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { orgId } = request.params as { orgId: string };
    
    const org = await fastify.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return reply.code(404).send({ error: 'Organization not found' });

    const dbUser = await fastify.prisma.user.findUnique({ where: { sub: request.user.sub } });
    if (!dbUser) return reply.code(401).send({ error: 'User not synchronized' });

    const isOwner = org.ownerId === dbUser.id;
    const isManager = dbUser.role === 'API_MANAGER';

    if (!isOwner && !isManager) {
      return reply.code(403).send({ error: 'Forbidden: Only the owner or an API Manager can add products' });
    }

    const data = productSchema.parse(request.body);

    try {
      return await fastify.prisma.product.create({
        data: {
          ...data,
          organizationId: orgId,
          createdById: dbUser.id
        }
      });
    } catch (e) {
      throw e;
    }
  });

  // PATCH /products/:id
  fastify.patch('/products/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    
    const product = await fastify.prisma.product.findUnique({ 
      where: { id },
      include: { organization: true }
    });
    if (!product) return reply.code(404).send({ error: 'Product not found' });

    const dbUser = await fastify.prisma.user.findUnique({ where: { sub: request.user.sub } });
    if (!dbUser) return reply.code(401).send({ error: 'User not synchronized' });

    const isOwner = product.organization.ownerId === dbUser.id;
    const isManager = dbUser.role === 'API_MANAGER';

    if (!isOwner && !isManager) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const { diagram, ...rest } = request.body as any;
    const data: any = productSchema.partial().parse(rest);
    
    if (diagram) {
      data.diagram = diagram;
    }

    return fastify.prisma.product.update({
      where: { id },
      data
    });
  });

  // --- SWCI ROUTES ---

  // GET /organizations/:orgId/swcis
  fastify.get('/organizations/:orgId/swcis', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { orgId } = request.params as { orgId: string };

    return fastify.prisma.softwareConfigurationItem.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' }
    });
  });

  // POST /organizations/:orgId/swcis
  fastify.post('/organizations/:orgId/swcis', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { orgId } = request.params as { orgId: string };
    
    const data = swciSchema.parse(request.body);
    return fastify.prisma.softwareConfigurationItem.create({
      data: {
        ...data,
        organizationId: orgId
      }
    });
  });

  // PATCH /swcis/:id
  fastify.patch('/swcis/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    
    const data = swciSchema.partial().parse(request.body);
    return fastify.prisma.softwareConfigurationItem.update({
      where: { id },
      data
    });
  });
};

export default organizationRoutes;
