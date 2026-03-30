import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Use absolute paths for reliable cross-platform testing
const ROOT_DIR = 'D:/02-PERSONAL/01-PROJECTS/21-APIManager';
const BFF_DIR = 'D:/02-PERSONAL/01-PROJECTS/21-APIManager/apps/bff';

describe('Phase 1: Foundation & Identity - Infrastructure Tests', () => {
  
  describe('T-01: Monorepo workspaces', () => {
    it('should have workspaces configured in root package.json', () => {
      const packageJsonPath = path.join(ROOT_DIR, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      expect(pkg.workspaces).toBeDefined();
      expect(pkg.workspaces).toContain('apps/*');
      expect(pkg.workspaces).toContain('packages/*');
    });
  });

  describe('T-02: Portal & BFF scaffolded', () => {
    it('should have apps/portal with build script', () => {
      const portalPkgPath = path.join(ROOT_DIR, 'apps/portal/package.json');
      const portalPkg = JSON.parse(fs.readFileSync(portalPkgPath, 'utf-8'));
      
      expect(portalPkg.scripts).toBeDefined();
      expect(portalPkg.scripts.build).toBeDefined();
      expect(portalPkg.scripts.dev).toBeDefined();
    });

    it('should have apps/bff with build script', () => {
      const bffPkgPath = path.join(ROOT_DIR, 'apps/bff/package.json');
      const bffPkg = JSON.parse(fs.readFileSync(bffPkgPath, 'utf-8'));
      
      expect(bffPkg.scripts).toBeDefined();
      expect(bffPkg.scripts.build).toBeDefined();
      expect(bffPkg.scripts.dev).toBeDefined();
      expect(bffPkg.scripts.prisma).toBeDefined();
    });
  });

  describe('T-03: Shared types linked', () => {
    it('should have shared-types package with main entry', () => {
      const sharedTypesPkgPath = path.join(ROOT_DIR, 'packages/shared-types/package.json');
      const sharedTypesPkg = JSON.parse(fs.readFileSync(sharedTypesPkgPath, 'utf-8'));
      
      expect(sharedTypesPkg.main).toBeDefined();
      expect(sharedTypesPkg.main).toBe('index.ts');
    });

    it('should have shared-types as dependency in bff', () => {
      const bffPkgPath = path.join(ROOT_DIR, 'apps/bff/package.json');
      const bffPkg = JSON.parse(fs.readFileSync(bffPkgPath, 'utf-8'));
      
      expect(bffPkg.dependencies).toBeDefined();
      expect(bffPkg.dependencies['shared-types']).toBeDefined();
    });

    it('should have shared-types as dependency in portal', () => {
      const portalPkgPath = path.join(ROOT_DIR, 'apps/portal/package.json');
      const portalPkg = JSON.parse(fs.readFileSync(portalPkgPath, 'utf-8'));
      
      expect(portalPkg.dependencies).toBeDefined();
      expect(portalPkg.dependencies['shared-types']).toBeDefined();
    });
  });

  describe('T-04: Prisma configured', () => {
    it('should have Prisma schema with User model', () => {
      const schemaPath = path.join(BFF_DIR, 'prisma/schema.prisma');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      
      expect(schema).toContain('model User');
      expect(schema).toMatch(/sub\s+String/);
      expect(schema).toMatch(/email\s+String/);
      expect(schema).toMatch(/role\s+Role/);
    });

    it('should have Prisma schema with AuditLog model', () => {
      const schemaPath = path.join(BFF_DIR, 'prisma/schema.prisma');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      
      expect(schema).toContain('model AuditLog');
      expect(schema).toMatch(/action\s+String/);
      expect(schema).toMatch(/userId\s+String/);
      expect(schema).toMatch(/timestamp\s+DateTime/);
    });

    it('should have Role enum in schema', () => {
      const schemaPath = path.join(BFF_DIR, 'prisma/schema.prisma');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      
      expect(schema).toContain('enum Role');
      expect(schema).toContain('API_MANAGER');
      expect(schema).toContain('API_DESIGNER');
      expect(schema).toContain('API_DEVELOPER');
    });
  });

  describe('T-05: Keycloak OIDC/PKCE', () => {
    it('should have auth plugin with OIDC discovery', () => {
      const authPluginPath = path.join(BFF_DIR, 'src/plugins/auth.ts');
      const authPlugin = fs.readFileSync(authPluginPath, 'utf-8');
      
      // Verify OIDC discovery is implemented
      expect(authPlugin).toContain('openid-client');
      expect(authPlugin).toContain('discovery');
      // Verify JWT validation is implemented
      expect(authPlugin).toContain('jose');
      expect(authPlugin).toContain('jwtVerify');
    });

    it('should have Keycloak environment variables configured', () => {
      const bffPkgPath = path.join(ROOT_DIR, 'apps/bff/package.json');
      const bffPkg = JSON.parse(fs.readFileSync(bffPkgPath, 'utf-8'));
      
      // Verify openid-client and jose are dependencies
      expect(bffPkg.dependencies['openid-client']).toBeDefined();
      expect(bffPkg.dependencies['jose']).toBeDefined();
    });

    it('should skip auth for health endpoint', () => {
      const authPluginPath = path.join(BFF_DIR, 'src/plugins/auth.ts');
      const authPlugin = fs.readFileSync(authPluginPath, 'utf-8');
      
      expect(authPlugin).toContain("request.url === '/health'");
    });
  });

  describe('T-06: RBAC established', () => {
    it('should have role mapping in auth plugin', () => {
      const authPluginPath = path.join(BFF_DIR, 'src/plugins/auth.ts');
      const authPlugin = fs.readFileSync(authPluginPath, 'utf-8');
      
      // Verify role mapping exists
      expect(authPlugin).toContain('resource_access');
      expect(authPlugin).toContain('API-Manager');
      expect(authPlugin).toContain('API-Designer');
      expect(authPlugin).toContain('API-Developer');
    });

    it('should map Keycloak roles to application roles', () => {
      const authPluginPath = path.join(BFF_DIR, 'src/plugins/auth.ts');
      const authPlugin = fs.readFileSync(authPluginPath, 'utf-8');
      
      // Verify role enum is imported
      expect(authPlugin).toContain("import { Role } from 'shared-types'");
      // Verify role mapping logic
      expect(authPlugin).toContain("appRole: Role");
    });
  });
});
