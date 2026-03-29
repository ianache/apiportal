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
    // RBAC: Only Designers or Managers can create
    if (request.user.role === 'API_DEVELOPER') {
      return reply.code(403).send({ error: 'Forbidden', message: 'Only Designers can create APIs' });
    }

    const { name, description, initialVersion } = createApiSchema.parse(request.body);

    // Check if user exists in our DB (synced from Keycloak sub)
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

    return api;
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
