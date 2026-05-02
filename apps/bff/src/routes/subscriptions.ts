import { FastifyPluginAsync } from 'fastify';
import { crypto } from 'node:crypto';

const subscriptionRoutes: FastifyPluginAsync = async (fastify) => {

  // List my subscriptions
  fastify.get('/', async (request) => {
    if (!request.user) return [];
    
    const dbUser = await fastify.prisma.user.findUnique({
      where: { sub: request.user.sub }
    });
    if (!dbUser) return [];

    return fastify.prisma.subscription.findMany({
      where: { userId: dbUser.id },
      include: {
        api: true,
        keys: true
      },
      orderBy: { createdAt: 'desc' }
    });
  });

  // Subscribe to an API
  fastify.post('/:apiId', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    
    const { apiId } = request.params as { apiId: string };

    // Get DB user
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

    // Check if already subscribed
    const existing = await fastify.prisma.subscription.findUnique({
      where: {
        userId_apiId: { userId: dbUser.id, apiId }
      }
    });

    if (existing) {
      return reply.code(409).send({ error: 'Conflict', message: 'Already subscribed to this API' });
    }

    // Create subscription
    const sub = await fastify.prisma.subscription.create({
      data: {
        userId: dbUser.id,
        apiId
      }
    });

    // Generate keys for all environments automatically? 
    // Or just return the sub and let user generate keys?
    // Let's generate one key for each existing environment for DX
    const environments = await fastify.prisma.environment.findMany();
    
    if (environments.length > 0) {
      await Promise.all(environments.map(env => {
        const apiKey = `nx_${Buffer.from(crypto.randomUUID()).toString('base64').replace(/=/g, '').substring(0, 32)}`;
        return fastify.prisma.subscriptionKey.create({
          data: {
            subscriptionId: sub.id,
            environmentId: env.id,
            apiKey
          }
        });
      }));
    }

    return fastify.prisma.subscription.findUnique({
      where: { id: sub.id },
      include: {
        api: true,
        keys: true
      }
    });
  });

  // Revoke/Delete subscription
  fastify.delete('/:id', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };

    const dbUser = await fastify.prisma.user.findUnique({
      where: { sub: request.user.sub }
    });
    if (!dbUser) return reply.code(404).send({ error: 'User not found' });

    const sub = await fastify.prisma.subscription.findUnique({
      where: { id }
    });

    if (!sub) return reply.code(404).send({ error: 'Subscription not found' });
    
    // RBAC: Can only delete own sub unless manager
    if (sub.userId !== dbUser.id && request.user.role !== 'API_MANAGER') {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    await fastify.prisma.subscription.delete({ where: { id } });
    return { success: true };
  });

};

export default subscriptionRoutes;
