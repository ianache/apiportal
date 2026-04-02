import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const IntegrationStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'ERROR']);
const IntegrationVersionStatusEnum = z.enum(['Design', 'Testing', 'Published', 'Deprecated']);

const createSchema = z.object({
  name:        z.string().min(1).max(100),
  type:        z.string().min(1).max(60),
  description: z.string().max(500).optional(),
  status:      IntegrationStatusEnum.default('DRAFT'),
  icon:        z.string().max(60).optional(),
  linkedApis:  z.number().int().min(0).default(0),
  domainId:    z.string().uuid().optional().nullable(),
});

const createVersionSchema = z.object({
  version:     z.string().min(1).max(20),
  description: z.string().max(500).optional(),
});

const updateSchema = createSchema.partial();

const integrationRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /integrations
  fastify.get('/integrations', async (request) => {
    const { domainId, status } = request.query as { domainId?: string; status?: string };
    return fastify.prisma.integration.findMany({
      where: {
        ...(domainId ? { domainId } : {}),
        ...(status   ? { status: status as any } : {}),
      },
      include: { domain: { select: { id: true, name: true, title: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  });

  // GET /integrations/:id
  fastify.get('/integrations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const integration = await fastify.prisma.integration.findUnique({
      where: { id },
      include: { 
        domain: { select: { id: true, name: true, title: true } },
        versions: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!integration) return reply.code(404).send({ error: 'Not found' });
    return integration;
  });

  // POST /integrations
  fastify.post('/integrations', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const data = createSchema.parse(request.body);
    return fastify.prisma.integration.create({
      data,
      include: { domain: { select: { id: true, name: true, title: true } } },
    });
  });

  // PATCH /integrations/:id
  fastify.patch('/integrations/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { id } = request.params as { id: string };
    const data = updateSchema.parse(request.body);
    const existing = await fastify.prisma.integration.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });
    return fastify.prisma.integration.update({
      where: { id },
      data,
      include: { domain: { select: { id: true, name: true, title: true } } },
    });
  });

  // DELETE /integrations/:id
  fastify.delete('/integrations/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { id } = request.params as { id: string };
    const existing = await fastify.prisma.integration.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });
    await fastify.prisma.integration.delete({ where: { id } });
    return reply.code(204).send();
  });

  // POST /integrations/:id/versions
  fastify.post('/integrations/:id/versions', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { id } = request.params as { id: string };
    const existing = await fastify.prisma.integration.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Integration not found' });

    const data = createVersionSchema.parse(request.body);
    return fastify.prisma.integrationVersion.create({
      data: {
        ...data,
        integrationId: id,
      },
    });
  });

  // PATCH /integrations/:id/versions/:versionId
  fastify.patch('/integrations/:id/versions/:versionId', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { versionId } = request.params as { versionId: string };
    const body = request.body as { status?: string; description?: string };

    const existing = await fastify.prisma.integrationVersion.findUnique({ where: { id: versionId } });
    if (!existing) return reply.code(404).send({ error: 'Version not found' });

    const updateData: any = {};
    if (body.status) {
      if (!IntegrationVersionStatusEnum.enum[body.status as any]) {
        return reply.code(400).send({ error: 'Invalid status' });
      }
      updateData.status = body.status;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    return fastify.prisma.integrationVersion.update({
      where: { id: versionId },
      data: updateData,
    });
  });

  // DELETE /integrations/:id/versions/:versionId
  fastify.delete('/integrations/:id/versions/:versionId', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (request.user.role === 'API_DEVELOPER')
      return reply.code(403).send({ error: 'Forbidden' });

    const { versionId } = request.params as { versionId: string };
    const existing = await fastify.prisma.integrationVersion.findUnique({ where: { id: versionId } });
    if (!existing) return reply.code(404).send({ error: 'Version not found' });

    await fastify.prisma.integrationVersion.delete({ where: { id: versionId } });
    return reply.code(204).send();
  });

};

export default integrationRoutes;
