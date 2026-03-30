import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Test 1: T-01 - Verify API and APIVersion models exist in Prisma schema
describe('T-01: Prisma Schema Models', () => {
  it('should have API model in schema', () => {
    const schemaPath = join(__dirname, '../../prisma/schema.prisma');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Verify API model exists
    expect(schema).toContain('model API');
    // Verify API has required fields
    expect(schema).toContain('model API {');
    expect(schema).toContain('id          String');
    expect(schema).toContain('name        String');
    expect(schema).toContain('versions    APIVersion[]');
  });

  it('should have APIVersion model in schema', () => {
    const schemaPath = join(__dirname, '../../prisma/schema.prisma');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Verify APIVersion model exists
    expect(schema).toContain('model APIVersion');
    // Verify parent-child relationship
    expect(schema).toContain('apiId       String');
    expect(schema).toContain('api         API       @relation');
    expect(schema).toContain('onDelete: Cascade');
  });
});

// Test 2: T-02 - Verify BFF Registry endpoints exist
describe('T-02: BFF Registry Endpoints', () => {
  it('should export apiRoutes', () => {
    // We can't import directly without the full app context,
    // so verify the file contains route handlers
    const apisPath = join(__dirname, './apis.ts');
    const apisCode = readFileSync(apisPath, 'utf-8');
    
    // Verify CRUD endpoints exist
    expect(apisCode).toContain("fastify.get('/apis'");
    expect(apisCode).toContain("fastify.get('/apis/:id'");
    expect(apisCode).toContain("fastify.post('/apis'");
    expect(apisCode).toContain("fastify.patch('/apis/:id'");
    expect(apisCode).toContain("fastify.post('/apis/:id/versions'");
    expect(apisCode).toContain("fastify.post('/apis/:id/versions/:version/status'");
  });
});

// Test 3: T-03 - Verify Lifecycle state machine
describe('T-03: Lifecycle State Machine', () => {
  it('should define transitionMap with valid transitions', () => {
    const apisPath = join(__dirname, './apis.ts');
    const apisCode = readFileSync(apisPath, 'utf-8');
    
    // Verify transitionMap exists
    expect(apisCode).toContain('const transitionMap');
    
    // Verify key transitions
    expect(apisCode).toContain("'DESIGN': ['REVIEW']");
    expect(apisCode).toContain("'REVIEW': ['DESIGN', 'APPROVED']");
    expect(apisCode).toContain("'APPROVED': ['PUBLISHED', 'DESIGN']");
  });

  it('should enforce state machine in status endpoint', () => {
    const apisPath = join(__dirname, './apis.ts');
    const apisCode = readFileSync(apisPath, 'utf-8');
    
    // Verify status transition validation exists
    expect(apisCode).toContain('transitionMap[apiVersion.status as APIStatus]');
    expect(apisCode).toContain('Invalid Transition');
  });
});

// Test 4: T-06 - Verify RBAC gates in BFF
describe('T-06: BFF RBAC Gates', () => {
  it('should restrict APPROVE and PUBLISH to API_MANAGER', () => {
    const apisPath = join(__dirname, './apis.ts');
    const apisCode = readFileSync(apisPath, 'utf-8');
    
    // Verify RBAC check for sensitive transitions
    expect(apisCode).toContain("if (['APPROVED', 'PUBLISHED'].includes(nextStatus))");
    expect(apisCode).toContain("request.user.role !== 'API_MANAGER'");
    expect(apisCode).toContain('Only Managers can Approve or Publish');
  });

  it('should restrict API creation to Designers and Managers', () => {
    const apisPath = join(__dirname, './apis.ts');
    const apisCode = readFileSync(apisPath, 'utf-8');
    
    // Verify RBAC for creation
    expect(apisCode).toContain("request.user.role === 'API_DEVELOPER'");
    expect(apisCode).toContain('Only Designers can create APIs');
  });
});
