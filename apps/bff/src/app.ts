import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import prismaPlugin from './plugins/prisma.js';
import healthRoutes from './routes/health.js';

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

// Register Health check routes
fastify.register(healthRoutes);

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
