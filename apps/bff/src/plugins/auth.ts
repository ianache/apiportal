import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import * as oidc from 'openid-client';
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

  let metadata: any;
  let jwks: any;
  let discoveryError: Error | null = null;

  try {
    // Attempt discovery first
    fastify.log.info(`Attempting OIDC discovery for ${issuerUrl}...`);
    const config = await oidc.discovery(new URL(issuerUrl), clientId, clientSecret, undefined, {
      execute: [oidc.allowInsecureRequests]
    });
    metadata = config.serverMetadata();
    jwks = createRemoteJWKSet(new URL(metadata.jwks_uri!));
    fastify.log.info(`OIDC discovery successful for ${issuerUrl}`);
  } catch (err: any) {
    fastify.log.warn(`OIDC discovery failed (${err.message}), using manual configuration fallback`);
    // Manual fallback for local development - Keycloak standard paths
    metadata = {
      issuer: issuerUrl,
      jwks_uri: `${issuerUrl}/protocol/openid-connect/certs`
    };
    try {
      jwks = createRemoteJWKSet(new URL(metadata.jwks_uri));
      fastify.log.info(`Manual OIDC configuration established for ${issuerUrl}`);
    } catch (manualErr: any) {
      fastify.log.error(`Critical: Failed to create JWK set even with fallback: ${manualErr.message}`);
      discoveryError = manualErr;
    }
  }

  fastify.addHook('onRequest', async (request, reply) => {
    fastify.log.info({ url: request.url }, 'Auth hook triggered');
    // Skip auth for health check
    if (request.url === '/health') return;

    if (discoveryError) {
      return reply.code(503).send({ 
        error: 'Service Unavailable', 
        message: `Authentication service discovery failed: ${discoveryError.message}. Please check BFF logs.` 
      });
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7);

    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: metadata.issuer,
        clockTolerance: 30, // seconds — absorbs minor clock skew between Keycloak host and BFF host
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

      // Synchronize user with local database
      await fastify.prisma.user.upsert({
        where: { sub: request.user.sub },
        update: {
          email: request.user.email,
          name: request.user.name,
          role: request.user.role,
        },
        create: {
          sub: request.user.sub,
          email: request.user.email,
          name: request.user.name,
          role: request.user.role,
        },
      });
    } catch (err) {
      fastify.log.warn(`Token validation failed: ${err}`);
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  });
};

export default fp(authPlugin);
