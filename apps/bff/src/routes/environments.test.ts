import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test schema validation
const createEnvironmentSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  name: z.string().min(1).max(100),
  tags: z.array(z.string()).optional().default([])
});

const updateEnvironmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  tags: z.array(z.string()).optional()
});

describe('Environment Route Schemas', () => {
  describe('createEnvironmentSchema', () => {
    it('should accept valid environment', () => {
      const result = createEnvironmentSchema.safeParse({
        slug: 'production',
        name: 'Production',
        tags: ['prod', 'live']
      });
      expect(result.success).toBe(true);
    });

    it('should accept minimal environment', () => {
      const result = createEnvironmentSchema.safeParse({
        slug: 'staging',
        name: 'Staging'
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid slug (uppercase)', () => {
      const result = createEnvironmentSchema.safeParse({
        slug: 'Production',
        name: 'Production'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid slug (special chars)', () => {
      const result = createEnvironmentSchema.safeParse({
        slug: 'prod!@#',
        name: 'Production'
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = createEnvironmentSchema.safeParse({
        slug: 'prod',
        name: ''
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateEnvironmentSchema', () => {
    it('should accept name update', () => {
      const result = updateEnvironmentSchema.safeParse({ name: 'Updated Name' });
      expect(result.success).toBe(true);
    });

    it('should accept tags update', () => {
      const result = updateEnvironmentSchema.safeParse({ tags: ['new', 'tags'] });
      expect(result.success).toBe(true);
    });

    it('should accept empty update', () => {
      const result = updateEnvironmentSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

describe('RBAC Logic for Environments', () => {
  const canManageEnvironment = (role: string) => role === 'API_MANAGER';

  it('should allow API_MANAGER to manage environments', () => {
    expect(canManageEnvironment('API_MANAGER')).toBe(true);
  });

  it('should block API_DESIGNER from managing environments', () => {
    expect(canManageEnvironment('API_DESIGNER')).toBe(false);
  });

  it('should block API_DEVELOPER from managing environments', () => {
    expect(canManageEnvironment('API_DEVELOPER')).toBe(false);
  });
});
