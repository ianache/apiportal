import { FastifyPluginAsync } from 'fastify';
import { APIStatus, Role } from 'shared-types';
import semver from 'semver';
import { z } from 'zod';

const createApiSchema = z.object({
  name: z.string().min(3).max(50),
  label: z.string().max(100).optional(),
  description: z.string().optional(),
  domainId: z.string().optional(),
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

const createEndpointSchema = z.object({
  environmentId: z.string().uuid(),
  baseUrl: z.string().url()
});

const updateEndpointSchema = z.object({
  baseUrl: z.string().url()
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
      include: { 
        versions: {
          orderBy: { createdAt: 'desc' },
          include: {
            endpoints: {
              include: { environment: true }
            }
          }
        }
      }
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

      const { name, label, description, domainId, initialVersion } = createApiSchema.parse(request.body);
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
          label,
          description,
          domainId,
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
      const body = request.body as { version: string; baseVersion?: string };
      const { version } = createVersionSchema.parse(body);
      const baseVersion = body.baseVersion;

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

      // Copy definition from base version if provided
      let definition = null;
      if (baseVersion) {
        const baseVer = await fastify.prisma.aPIVersion.findUnique({
          where: { apiId_version: { apiId: id, version: baseVersion } }
        });
        if (baseVer) {
          definition = baseVer.definition;
        }
      }

      const newVersion = await fastify.prisma.aPIVersion.create({
        data: {
          apiId: id,
          version,
          status: 'DESIGN',
          definition,
          createdBy: dbUser.id
        }
      });

      fastify.log.info({ apiId: id, version, baseVersion: baseVersion || 'none' }, 'API version created successfully');
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

  // Create endpoint for a version (POST /apis/:id/versions/:version/endpoints)
  fastify.post('/apis/:id/versions/:version/endpoints', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'User context not found' });
      }

      // RBAC: Developers cannot manage endpoints
      if (request.user.role === 'API_DEVELOPER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Developers cannot manage endpoints' });
      }

      const { id, version } = request.params as { id: string, version: string };
      const { environmentId, baseUrl } = createEndpointSchema.parse(request.body);

      const apiVersion = await fastify.prisma.aPIVersion.findUnique({
        where: { apiId_version: { apiId: id, version } }
      });
      if (!apiVersion) return reply.code(404).send({ error: 'Version Not Found' });

      // Verify environment exists
      const env = await fastify.prisma.environment.findUnique({ where: { id: environmentId } });
      if (!env) return reply.code(404).send({ error: 'Environment Not Found' });

      // Check for existing endpoint
      const existing = await fastify.prisma.aPIEndpoint.findFirst({
        where: { versionId: apiVersion.id, environmentId }
      });
      if (existing) {
        return reply.code(409).send({ error: 'Conflict', message: 'Endpoint for this environment already exists' });
      }

      const endpoint = await fastify.prisma.aPIEndpoint.create({
        data: {
          versionId: apiVersion.id,
          environmentId,
          baseUrl
        },
        include: { environment: true }
      });

      fastify.log.info({ apiId: id, version, environmentId }, 'Endpoint created');
      return endpoint;
    } catch (err: any) {
      fastify.log.error(err, 'Failed to create endpoint');
      throw err;
    }
  });

  // Save OpenAPI definition (PUT /apis/:id/versions/:version/definition)
  // NOTE: This stores the visual design flow (nodes/edges) in flowConfig field
  fastify.put('/apis/:id/versions/:version/definition', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'User context not found' });
      }
      if (request.user.role === 'API_DEVELOPER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Developers cannot edit API definitions' });
      }

      const { id, version } = request.params as { id: string; version: string };
      const { definition } = request.body as { definition: unknown };

      const apiVersion = await fastify.prisma.aPIVersion.findFirst({
        where: { apiId: id, version }
      });
      if (!apiVersion) return reply.code(404).send({ error: 'Version not found' });
      if (apiVersion.status !== 'DESIGN') {
        return reply.code(422).send({ error: 'Unprocessable', message: 'Only DESIGN versions can be edited' });
      }

      // Store visual design in flowConfig
      const updated = await fastify.prisma.aPIVersion.update({
        where: { id: apiVersion.id },
        data: { flowConfig: definition as any }
      });

      fastify.log.info({ apiId: id, version }, 'API flow config saved');
      return { id: updated.id, version: updated.version, flowConfig: updated.flowConfig };
    } catch (err: any) {
      fastify.log.error(err, 'Failed to save API definition');
      throw err;
    }
  });

  // Save OpenAPI spec (PUT /apis/:id/versions/:version/openapi)
  fastify.put('/apis/:id/versions/:version/openapi', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'User context not found' });
      }
      if (request.user.role === 'API_DEVELOPER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Developers cannot edit API definitions' });
      }

      const { id, version } = request.params as { id: string; version: string };
      const { openapi } = request.body as { openapi: unknown };

      const apiVersion = await fastify.prisma.aPIVersion.findFirst({
        where: { apiId: id, version }
      });
      if (!apiVersion) return reply.code(404).send({ error: 'Version not found' });
      if (apiVersion.status !== 'DESIGN') {
        return reply.code(422).send({ error: 'Unprocessable', message: 'Only DESIGN versions can be edited' });
      }

      const updated = await fastify.prisma.aPIVersion.update({
        where: { id: apiVersion.id },
        data: { openApiSpec: openapi as any }
      });

      fastify.log.info({ apiId: id, version }, 'OpenAPI spec saved');
      return { id: updated.id, version: updated.version, openApiSpec: updated.openApiSpec };
    } catch (err: any) {
      fastify.log.error(err, 'Failed to save OpenAPI spec');
      throw err;
    }
  });

  // Get OpenAPI spec (GET /apis/:id/versions/:version/openapi)
  fastify.get('/apis/:id/versions/:version/openapi', async (request, reply) => {
    const { id, version } = request.params as { id: string; version: string };

    const apiVersion = await fastify.prisma.aPIVersion.findFirst({
      where: { apiId: id, version }
    });
    if (!apiVersion) return reply.code(404).send({ error: 'Version not found' });

    return { openapi: apiVersion.openApiSpec };
  });

  // Update endpoint (PATCH /apis/:id/versions/:version/endpoints/:endpointId)
  fastify.patch('/apis/:id/versions/:version/endpoints/:endpointId', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'User context not found' });
      }

      // RBAC: Developers cannot manage endpoints
      if (request.user.role === 'API_DEVELOPER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Developers cannot manage endpoints' });
      }

      const { endpointId } = request.params as { endpointId: string };
      const { baseUrl } = request.body as { baseUrl: string };

      const endpoint = await fastify.prisma.aPIEndpoint.findUnique({ where: { id: endpointId } });
      if (!endpoint) return reply.code(404).send({ error: 'Endpoint Not Found' });

      const updated = await fastify.prisma.aPIEndpoint.update({
        where: { id: endpointId },
        data: { baseUrl },
        include: { environment: true }
      });

      fastify.log.info({ endpointId, baseUrl }, 'Endpoint updated');
      return updated;
    } catch (err: any) {
      fastify.log.error(err, 'Failed to update endpoint');
      throw err;
    }
  });

  // Delete endpoint (DELETE /apis/:id/versions/:version/endpoints/:endpointId)
  fastify.delete('/apis/:id/versions/:version/endpoints/:endpointId', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'User context not found' });
      }

      // RBAC: Developers cannot manage endpoints
      if (request.user.role === 'API_DEVELOPER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Developers cannot manage endpoints' });
      }

      const { endpointId } = request.params as { endpointId: string };

      const endpoint = await fastify.prisma.aPIEndpoint.findUnique({ where: { id: endpointId } });
      if (!endpoint) return reply.code(404).send({ error: 'Endpoint Not Found' });

      await fastify.prisma.aPIEndpoint.delete({ where: { id: endpointId } });

      fastify.log.info({ endpointId }, 'Endpoint deleted');
      return { success: true };
    } catch (err: any) {
      fastify.log.error(err, 'Failed to delete endpoint');
      throw err;
    }
  });

  // Delete version (DELETE /apis/:id/versions/:version)
  fastify.delete('/apis/:id/versions/:version', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'User context not found' });
      }

      // RBAC: Only API_MANAGER and API_DESIGNER can delete versions
      if (request.user.role === 'API_DEVELOPER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Developers cannot delete versions' });
      }

      const { id, version } = request.params as { id: string; version: string };

      const apiVersion = await fastify.prisma.aPIVersion.findFirst({
        where: { apiId: id, version }
      });
      if (!apiVersion) {
        return reply.code(404).send({ error: 'Not Found', message: 'Version not found' });
      }

      // Check status - only allow delete if not PUBLISHED, APPROVED, or RETIRED
      if (['PUBLISHED', 'APPROVED', 'RETIRED'].includes(apiVersion.status)) {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: `Cannot delete version with status ${apiVersion.status}` 
        });
      }

      await fastify.prisma.aPIVersion.delete({ where: { id: apiVersion.id } });

      fastify.log.info({ apiId: id, version }, 'Version deleted');
      return { success: true };
    } catch (err: any) {
      fastify.log.error(err, 'Failed to delete version');
      throw err;
    }
  });

};

export default apiRoutes;
