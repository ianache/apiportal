import { FastifyPluginAsync } from 'fastify';

const llmProvidersRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    try {
      const providers = await fastify.prisma.lLMProvider.findMany({
        orderBy: { label: 'asc' }
      });
      return reply.send(providers);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.post('/', async (request, reply) => {
    if (request.user.role !== 'API_MANAGER') {
      return reply.code(403).send({ error: 'Forbidden', message: 'Only API_MANAGER can modify LLM Providers' });
    }

    const { id, label, models } = request.body as any;
    if (!id || !label || !models || !Array.isArray(models)) {
      return reply.code(400).send({ error: 'Bad Request', message: 'Invalid payload. Requires id, label and models array.' });
    }

    try {
      const provider = await fastify.prisma.lLMProvider.upsert({
        where: { id },
        update: { label, models },
        create: { id, label, models }
      });
      return reply.status(201).send(provider);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
  // PATCH /:id/models  — append a single model name to an existing provider
  fastify.patch('/:id/models', async (request, reply) => {
    const { id } = request.params as any;
    const { model } = request.body as any;
    if (!model?.trim()) return reply.code(400).send({ error: 'model is required' });

    const provider = await fastify.prisma.lLMProvider.findUnique({ where: { id } });
    if (!provider) return reply.code(404).send({ error: 'Provider not found' });

    const models = [...new Set([...provider.models, model.trim()])];
    const updated = await fastify.prisma.lLMProvider.update({ where: { id }, data: { models } });
    return reply.send(updated);
  });

};

export default llmProvidersRoute;
