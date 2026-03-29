import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { discovery } from 'openid-client';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Role } from 'shared-types';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      sub: string;
      email: string;
      name?: string;
      role: Role;
    };
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  const issuerUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080/realms/apps';
  const clientId = process.env.KEYCLOAK_BFF_CLIENT_ID || 'apiportal';
  const clientSecret = process.env.KEYCLOAK_BFF_CLIENT_SECRET;

  try {
    const config = await discovery(new URL(issuerUrl), clientId, clientSecret);
    const metadata = config.serverMetadata();
    const jwks = createRemoteJWKSet(new URL(metadata.jwks_uri!));

    fastify.log.info(`OIDC discovery successful for ${issuerUrl}`);

    fastify.addHook('onRequest', async (request, reply) => {
      // Skip auth for health check
      if (request.url === '/health') return;

      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
      }

      const token = authHeader.slice(7);

      try {
        const { payload } = await jwtVerify(token, jwks, {
          issuer: metadata.issuer,
        });

        // Map Keycloak Client Roles to application roles
        // Client roles are in resource_access.{clientId}.roles
        const clientRoles: string[] =
          (payload.resource_access as any)?.[clientId]?.roles ?? [];
        let appRole: Role = 'API_DEVELOPER';

        if (clientRoles.includes('API-Manager') || clientRoles.includes('API-Admin')) appRole = 'API_MANAGER';
        else if (clientRoles.includes('API-Designer')) appRole = 'API_DESIGNER';
        else if (clientRoles.includes('API-Developer')) appRole = 'API_DEVELOPER';

        request.user = {
          sub: payload.sub as string,
          email: payload.email as string,
          name: payload.name as string | undefined,
          role: appRole,
        };
      } catch (err) {
        fastify.log.warn(`Token validation failed: ${err}`);
        return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
      }
    });
  } catch (err) {
    fastify.log.error(`OIDC discovery failed: ${err}`);
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    fastify.log.warn('Running in unauthenticated mode due to discovery failure');
  }
};

export default fp(authPlugin);
