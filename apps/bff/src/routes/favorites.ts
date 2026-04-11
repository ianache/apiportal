import { FastifyPluginAsync } from 'fastify';

const favoritesRoutes: FastifyPluginAsync = async (fastify) => {

  const getOrCreateUser = async (fastify: any, sub: string, email: string, name: string | null | undefined, role: string) => {
    let dbUser = await fastify.prisma.user.findUnique({ where: { sub } });
    if (!dbUser) {
      dbUser = await fastify.prisma.user.create({
        data: { sub, email, name, role: role as any }
      });
    }
    return dbUser;
  };

  fastify.get('/', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const userId = request.user.sub;

    const favorites = await fastify.prisma.userAPIFavorite.findMany({
      where: { userId },
      select: { apiId: true, createdAt: true }
    });

    return reply.send({ favorites: favorites.map((f: any) => ({ apiId: f.apiId, favoritedAt: f.createdAt })) });
  });

  fastify.post('/:apiId', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { sub, email, name, role } = request.user;
    const { apiId } = request.params as { apiId: string };

    const api = await fastify.prisma.aPI.findUnique({ where: { id: apiId } });
    if (!api) return reply.code(404).send({ error: 'API not found' });

    const dbUser = await getOrCreateUser(fastify, sub, email, name, role);

    const favorite = await fastify.prisma.userAPIFavorite.upsert({
      where: { userId_apiId: { userId: dbUser.id, apiId } },
      update: {},
      create: { userId: dbUser.id, apiId }
    });

    return reply.code(201).send({ apiId: favorite.apiId, favorited: true });
  });

  fastify.delete('/:apiId', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { sub, email, name, role } = request.user;
    const { apiId } = request.params as { apiId: string };

    const dbUser = await getOrCreateUser(fastify, sub, email, name, role);

    await fastify.prisma.userAPIFavorite.deleteMany({
      where: { userId: dbUser.id, apiId }
    });

    return reply.code(204).send();
  });

};

export default favoritesRoutes;
