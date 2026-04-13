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
  typeId: z.string().uuid(),
  apiVersionId: z.string().uuid().optional().nullable(),
  properties: z.array(z.object({
    specificationId: z.string(),
    value: z.string()
  })).optional(),
});

const organizationRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /organizations
  fastify.get('/organizations', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    
    const organizations = await fastify.prisma.organization.findMany({
      include: {
        _count: {
          select: { 
            apis: true,
            products: true
          }
        },
        owner: true
      },
      orderBy: { name: 'asc' }
    });
    
    return organizations.map(org => ({
      ...org,
      apiCount: org._count.apis,
      productCount: org._count.products
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
          select: { 
            apis: true,
            products: true
          }
        },
        owner: true,
        products: true,
        apis: true
      }
    });
    
    if (!organization) return reply.code(404).send({ error: 'Not found' });
    
    return {
      ...organization,
      apiCount: organization._count.apis,
      productCount: organization._count.products
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

    const products = await fastify.prisma.product.findMany({
      where: { organizationId: orgId },
      include: {
        createdBy: true
      },
      orderBy: { name: 'asc' }
    });

    // Obtener todos los SWCIs de la organización para cruzar tipos e iconos
    const swcis = await fastify.prisma.softwareConfigurationItem.findMany({
      where: { organizationId: orgId },
      include: { type: true }
    });

    // Enriquecer productos con el conteo por tipo basado en el diagrama
    return products.map(product => {
      const diagram = (product.diagram as any) || { nodes: [] };
      const nodes = diagram.nodes || [];
      
      // Mapear IDs de SWCI presentes en el diagrama
      const swciIdsInDiagram = nodes
        .filter((n: any) => n.type === 'swci' && n.data?.swciId)
        .map((n: any) => n.data.swciId);

      // Contar por tipo
      const typeCounts: Record<string, { name: string, icon: string, count: number }> = {};
      
      swciIdsInDiagram.forEach((id: string) => {
        const swci = swcis.find(s => s.id === id);
        if (swci && swci.type) {
          if (!typeCounts[swci.typeId]) {
            typeCounts[swci.typeId] = {
              name: swci.type.name,
              icon: swci.type.icon || 'settings_input_component',
              count: 0
            };
          }
          typeCounts[swci.typeId].count++;
        }
      });

      return {
        ...product,
        swciSummary: Object.values(typeCounts).sort((a, b) => a.name.localeCompare(b.name)),
        totalSwcis: swciIdsInDiagram.length
      };
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
      include: {
        type: {
          include: { specifications: true }
        },
        properties: true,
        apiVersion: {
          include: { api: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  });

  // POST /organizations/:orgId/swcis
  fastify.post('/organizations/:orgId/swcis', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { orgId } = request.params as { orgId: string };
    
    const { properties, ...rest } = swciSchema.parse(request.body);
    
    return fastify.prisma.softwareConfigurationItem.create({
      data: {
        ...rest,
        organizationId: orgId,
        properties: properties ? {
          create: properties.map(p => ({
            specificationId: p.specificationId,
            value: p.value
          }))
        } : undefined
      },
      include: {
        type: { include: { specifications: true } },
        properties: true
      }
    });
  });

  // PATCH /swcis/:id
  fastify.patch('/swcis/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    
    const { properties, ...rest } = swciSchema.partial().parse(request.body);
    
    // Update basic info
    await fastify.prisma.softwareConfigurationItem.update({
      where: { id },
      data: rest
    });

    // Update properties if provided
    if (properties) {
      for (const p of properties) {
        await fastify.prisma.property.upsert({
          where: { swciId_specificationId: { swciId: id, specificationId: p.specificationId } },
          update: { value: p.value },
          create: { swciId: id, specificationId: p.specificationId, value: p.value }
        });
      }
    }

    return fastify.prisma.softwareConfigurationItem.findUnique({
      where: { id },
      include: {
        type: { include: { specifications: true } },
        properties: true,
        apiVersion: { include: { api: true } }
      }
    });
  });

  // GET /configuration-item-types
  fastify.get('/configuration-item-types', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    return fastify.prisma.configurationItemType.findMany({
      include: { specifications: true },
      orderBy: { name: 'asc' }
    });
  });
};

export default organizationRoutes;
