import { FastifyPluginAsync } from 'fastify';
import { APIStatus, Role } from 'shared-types';
import semver from 'semver';
import { z } from 'zod';

const createApiSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().optional(),
  initialVersion: z.string().refine((v) => semver.valid(v), {
    message: "Invalid SemVer version"
  }).default("0.1.0")
});

const updateApiSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  description: z.string().optional()
});

const createVersionSchema = z.object({
  version: z.string().refine((v) => semver.valid(v), {
    message: "Invalid SemVer version"
  })
});

const updateStatusSchema = z.object({
  status: z.nativeEnum({
    DESIGN: 'DESIGN',
    REVIEW: 'REVIEW',
    APPROVED: 'APPROVED',
    PUBLISHED: 'PUBLISHED',
    DEPRECATED: 'DEPRECATED',
    RETIRED: 'RETIRED'
  } as const)
});

const transitionMap: Record<APIStatus, APIStatus[]> = {
  'DESIGN': ['REVIEW'],
  'REVIEW': ['DESIGN', 'APPROVED'],
  'APPROVED': ['PUBLISHED', 'DESIGN'],
  'PUBLISHED': ['DEPRECATED'],
  'DEPRECATED': ['RETIRED', 'PUBLISHED'],
  'RETIRED': []
};

const apiRoutes: FastifyPluginAsync = async (fastify) => {
  
  // List all APIs
  fastify.get('/apis', async (request) => {
    return fastify.prisma.aPI.findMany({
      include: {
        versions: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  });

  // Get single API details
  fastify.get('/apis/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const api = await fastify.prisma.aPI.findUnique({
      where: { id },
      include: { versions: true }
    });
    if (!api) return reply.code(404).send({ error: 'Not Found' });
    return api;
  });

  // Create new API
  fastify.post('/apis', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'User context not found' });
      }
      
      // RBAC: Only Designers or Managers can create
      if (request.user.role === 'API_DEVELOPER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Only Designers can create APIs' });
      }

      const { name, description, initialVersion } = createApiSchema.parse(request.body);
      fastify.log.info({ name, user: request.user.email }, 'Attempting to create new API');

      // Check if user exists in our DB (synced from Keycloak sub)
      let dbUser = await fastify.prisma.user.findUnique({
        where: { sub: request.user.sub }
      });

      if (!dbUser) {
        fastify.log.info({ sub: request.user.sub }, 'User not found in DB, creating sync record');
        dbUser = await fastify.prisma.user.create({
          data: {
            sub: request.user.sub,
            email: request.user.email,
            name: request.user.name,
            role: request.user.role as any
          }
        });
      }

      const api = await fastify.prisma.aPI.create({
        data: {
          name,
          description,
          ownerId: dbUser.id,
          versions: {
            create: {
              version: initialVersion,
              status: 'DESIGN',
              createdBy: dbUser.id
            }
          }
        },
        include: { versions: true }
      });

      fastify.log.info({ apiId: api.id }, 'API created successfully');
      return api;
    } catch (err: any) {
      fastify.log.error(err, 'Failed to create API');
      if (err.code === 'P2002') {
        return reply.code(409).send({ error: 'Conflict', message: 'An API with this name already exists' });
      }
      throw err;
    }
  });

  // Update API metadata (PATCH /apis/:id)
  fastify.patch('/apis/:id', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'User context not found' });
      }

      // RBAC: Developers cannot update API metadata
      if (request.user.role === 'API_DEVELOPER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Developers cannot update API metadata' });
      }

      const { id } = request.params as { id: string };
      const updates = updateApiSchema.parse(request.body);

      const existingApi = await fastify.prisma.aPI.findUnique({ where: { id } });
      if (!existingApi) return reply.code(404).send({ error: 'Not Found' });

      const updated = await fastify.prisma.aPI.update({
        where: { id },
        data: updates,
        include: { versions: true }
      });

      fastify.log.info({ apiId: id, updates }, 'API updated successfully');
      return updated;
    } catch (err: any) {
      fastify.log.error(err, 'Failed to update API');
      if (err.code === 'P2002') {
        return reply.code(409).send({ error: 'Conflict', message: 'An API with this name already exists' });
      }
      throw err;
    }
  });

  // Create new version (POST /apis/:id/versions)
  fastify.post('/apis/:id/versions', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'User context not found' });
      }

      // RBAC: Developers cannot create versions
      if (request.user.role === 'API_DEVELOPER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Developers cannot create versions' });
      }

      const { id } = request.params as { id: string };
      const { version } = createVersionSchema.parse(request.body);

      const existingApi = await fastify.prisma.aPI.findUnique({ where: { id } });
      if (!existingApi) return reply.code(404).send({ error: 'API Not Found' });

      // Check if version already exists
      const existingVersion = await fastify.prisma.aPIVersion.findUnique({
        where: { apiId_version: { apiId: id, version } }
      });
      if (existingVersion) {
        return reply.code(409).send({ error: 'Conflict', message: 'Version already exists' });
      }

      // Get the user for createdBy
      let dbUser = await fastify.prisma.user.findUnique({
        where: { sub: request.user.sub }
      });

      if (!dbUser) {
        dbUser = await fastify.prisma.user.create({
          data: {
            sub: request.user.sub,
            email: request.user.email,
            name: request.user.name,
            role: request.user.role as any
          }
        });
      }

      const newVersion = await fastify.prisma.aPIVersion.create({
        data: {
          apiId: id,
          version,
          status: 'DESIGN',
          createdBy: dbUser.id
        }
      });

      fastify.log.info({ apiId: id, version }, 'API version created successfully');
      return newVersion;
    } catch (err: any) {
      fastify.log.error(err, 'Failed to create API version');
      throw err;
    }
  });

  // Update version status (Lifecycle)
  fastify.post('/apis/:id/versions/:version/status', async (request, reply) => {
    const { id, version } = request.params as { id: string, version: string };
    const { status: nextStatus } = updateStatusSchema.parse(request.body);

    const apiVersion = await fastify.prisma.aPIVersion.findUnique({
      where: { apiId_version: { apiId: id, version } }
    });

    if (!apiVersion) return reply.code(404).send({ error: 'Version Not Found' });

    // Enforce state machine
    if (!transitionMap[apiVersion.status as APIStatus].includes(nextStatus as APIStatus)) {
      return reply.code(400).send({ 
        error: 'Invalid Transition', 
        message: `Cannot transition from ${apiVersion.status} to ${nextStatus}` 
      });
    }

    // RBAC for sensitive transitions
    if (['APPROVED', 'PUBLISHED'].includes(nextStatus)) {
      if (request.user.role !== 'API_MANAGER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Only Managers can Approve or Publish' });
      }
    }

    const dbUser = await fastify.prisma.user.findUnique({
      where: { sub: request.user.sub }
    });

    const updated = await fastify.prisma.aPIVersion.update({
      where: { id: apiVersion.id },
      data: { 
        status: nextStatus as any,
        approvedBy: nextStatus === 'APPROVED' ? dbUser?.id : undefined
      }
    });

    return updated;
  });

};

export default apiRoutes;
