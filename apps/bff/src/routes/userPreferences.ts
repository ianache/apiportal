import { FastifyPluginAsync } from 'fastify';

const userPreferencesRoute: FastifyPluginAsync = async (fastify) => {

  // GET /user-preferences — returns prefs + all API keys for the current user
  fastify.get('/', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const userId = request.user.sub;

    const [prefs, keys] = await Promise.all([
      fastify.prisma.userPreferences.findUnique({ where: { userId } }),
      fastify.prisma.userLLMApiKey.findMany({ where: { userId }, select: { providerId: true, apiKey: true } }),
    ]);

    return reply.send({
      preferredProvider: prefs?.preferredProvider ?? 'openai',
      preferredModel:    prefs?.preferredModel    ?? 'gpt-4o',
      customApiUrl:      prefs?.customApiUrl       ?? '',
      apiKeys: Object.fromEntries(keys.map(k => [k.providerId, k.apiKey])),
    });
  });

  // PUT /user-preferences — upsert general AI Designer preferences
  fastify.put('/', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const userId = request.user.sub;
    const { preferredProvider, preferredModel, customApiUrl } = request.body as any;

    const prefs = await fastify.prisma.userPreferences.upsert({
      where:  { userId },
      update: { preferredProvider, preferredModel, customApiUrl: customApiUrl ?? null },
      create: { userId, preferredProvider, preferredModel, customApiUrl: customApiUrl ?? null },
    });
    return reply.send(prefs);
  });

  // PUT /user-preferences/api-keys/:providerId — upsert an API key for a provider
  fastify.put('/api-keys/:providerId', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const userId     = request.user.sub;
    const providerId = (request.params as any).providerId;
    const { apiKey } = request.body as any;

    if (!apiKey || !apiKey.trim()) {
      return reply.code(400).send({ error: 'apiKey is required' });
    }

    const row = await fastify.prisma.userLLMApiKey.upsert({
      where:  { userId_providerId: { userId, providerId } },
      update: { apiKey },
      create: { userId, providerId, apiKey },
    });
    return reply.send({ providerId: row.providerId });
  });

  // DELETE /user-preferences/api-keys/:providerId — remove an API key
  fastify.delete('/api-keys/:providerId', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const userId     = request.user.sub;
    const providerId = (request.params as any).providerId;

    await fastify.prisma.userLLMApiKey.deleteMany({ where: { userId, providerId } });
    return reply.code(204).send();
  });
};

export default userPreferencesRoute;
