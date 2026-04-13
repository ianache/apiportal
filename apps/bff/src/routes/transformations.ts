import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/transformations', async (request, reply) => {
    const transformations = await fastify.prisma.dataTransformation.findMany({
      orderBy: { name: 'asc' }
    });
    return transformations;
  });

  fastify.post('/transformations', async (request, reply) => {
    const { name, description, source, target, code, language, organizationId, domainId, definition } = request.body as any;
    const transformation = await fastify.prisma.dataTransformation.create({
      data: { name, description, source, target, code, language, organizationId, domainId, definition }
    });
    return transformation;
  });

  fastify.get('/transformations/:id', async (request, reply) => {
    const { id } = request.params as any;
    const transformation = await fastify.prisma.dataTransformation.findUnique({
      where: { id },
      include: {
        organization: true,
        domain: true
      }
    });
    if (!transformation) {
      return reply.code(404).send({ error: 'Transformation not found' });
    }
    return transformation;
  });

  fastify.put('/transformations/:id', async (request, reply) => {
    const { id } = request.params as any;
    const { name, description, source, target, code, language, organizationId, domainId, definition } = request.body as any;
    const transformation = await fastify.prisma.dataTransformation.update({
      where: { id },
      data: { name, description, source, target, code, language, organizationId, domainId, definition }
    });
    return transformation;
  });

  fastify.delete('/transformations/:id', async (request, reply) => {
    const { id } = request.params as any;
    try {
      await fastify.prisma.dataTransformation.delete({
        where: { id }
      });
      return { success: true };
    } catch (error) {
      return reply.code(404).send({ error: 'Transformation not found or cannot be deleted' });
    }
  });
}
