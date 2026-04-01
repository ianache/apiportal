import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import prismaPlugin from './plugins/prisma.js';
import authPlugin from './plugins/auth.js';
import healthRoutes from './routes/health.js';
import apiRoutes from './routes/apis.js';
import environmentRoutes from './routes/environments.js';
import aiRoutes from './routes/ai.js';
import domainRoutes from './routes/domains.js';
import integrationRoutes from './routes/integrations.js';

const schema = {
  type: 'object',
  required: ['PORT'],
  properties: {
    PORT: {
      type: 'string',
      default: '3000'
    }
  }
};

const fastify = Fastify({ 
  logger: {
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Register environment plugin
fastify.register(fastifyEnv, {
  schema,
  dotenv: true
});

// Register Prisma plugin
fastify.register(prismaPlugin);

// Register CORS
fastify.register(cors, {
  origin: true // In production, this should be more restrictive
});

// Register Auth plugin and wait for it
await fastify.register(authPlugin);

// Register routes after auth is established
fastify.register(healthRoutes);
fastify.register(apiRoutes);
fastify.register(environmentRoutes);
fastify.register(aiRoutes);
fastify.register(domainRoutes);
fastify.register(integrationRoutes);

const start = async () => {
  try {
    await fastify.after();
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`BFF server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
