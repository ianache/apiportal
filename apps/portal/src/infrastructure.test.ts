import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Use absolute paths for reliable cross-platform testing
const ROOT_DIR = 'D:/02-PERSONAL/01-PROJECTS/21-APIManager';
const PORTAL_DIR = 'D:/02-PERSONAL/01-PROJECTS/21-APIManager/apps/portal';

describe('Phase 1: Foundation & Identity - Portal Infrastructure Tests', () => {
  
  describe('T-03: Shared types linked in Portal', () => {
    it('should have shared-types as dependency in portal', () => {
      const portalPkgPath = path.join(ROOT_DIR, 'apps/portal/package.json');
      const portalPkg = JSON.parse(fs.readFileSync(portalPkgPath, 'utf-8'));
      
      expect(portalPkg.dependencies).toBeDefined();
      expect(portalPkg.dependencies['shared-types']).toBeDefined();
    });

    it('should have shared-types package exported', () => {
      const sharedTypesIndexPath = path.join(ROOT_DIR, 'packages/shared-types/index.ts');
      const sharedTypesIndex = fs.readFileSync(sharedTypesIndexPath, 'utf-8');
      
      // Verify exports exist
      expect(sharedTypesIndex).toContain('export');
      expect(sharedTypesIndex).toContain('Role');
    });
  });

  describe('T-07: UI Shell', () => {
    it('should have Shell.vue component', () => {
      const shellPath = path.join(PORTAL_DIR, 'src/components/layout/Shell.vue');
      expect(fs.existsSync(shellPath)).toBe(true);
    });

    it('should have Sidebar layout in Shell.vue', () => {
      const shellPath = path.join(PORTAL_DIR, 'src/components/layout/Shell.vue');
      const shellContent = fs.readFileSync(shellPath, 'utf-8');
      
      // Verify Sidebar exists (aside element with "Sidebar" in comment)
      expect(shellContent).toContain('<aside');
      expect(shellContent).toMatch(/Sidebar/i);
    });

    it('should have Topbar/Header layout in Shell.vue', () => {
      const shellPath = path.join(PORTAL_DIR, 'src/components/layout/Shell.vue');
      const shellContent = fs.readFileSync(shellPath, 'utf-8');
      
      // Verify header/topbar exists
      expect(shellContent).toContain('<header');
      expect(shellContent).toContain('top-0');
    });

    it('should have Material Symbols in Shell.vue', () => {
      const shellPath = path.join(PORTAL_DIR, 'src/components/layout/Shell.vue');
      const shellContent = fs.readFileSync(shellPath, 'utf-8');
      
      // Verify Material Symbols are used
      expect(shellContent).toContain('material-symbols-outlined');
    });

    it('should have navigation items in Shell.vue', () => {
      const shellPath = path.join(PORTAL_DIR, 'src/components/layout/Shell.vue');
      const shellContent = fs.readFileSync(shellPath, 'utf-8');
      
      // Verify navigation exists - Explorer is label, /dashboard is the path
      expect(shellContent).toContain('Explorer');
      expect(shellContent).toContain("'/dashboard'");
    });
  });

  describe('T-08: Dashboard diagnostics', () => {
    it('should have Dashboard.vue component', () => {
      const dashboardPath = path.join(PORTAL_DIR, 'src/views/Dashboard.vue');
      expect(fs.existsSync(dashboardPath)).toBe(true);
    });

    it('should display user role in Dashboard.vue', () => {
      const dashboardPath = path.join(PORTAL_DIR, 'src/views/Dashboard.vue');
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
      
      // Verify role display exists
      expect(dashboardContent).toContain('roleLabel');
      expect(dashboardContent).toContain('API Manager');
      expect(dashboardContent).toContain('API Designer');
    });

    it('should display database status in Dashboard.vue', () => {
      const dashboardPath = path.join(PORTAL_DIR, 'src/views/Dashboard.vue');
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
      
      // Verify database status display exists
      expect(dashboardContent).toContain('database');
      expect(dashboardContent).toContain('Database');
      expect(dashboardContent).toContain('health');
    });

    it('should fetch health from BFF in Dashboard.vue', () => {
      const dashboardPath = path.join(PORTAL_DIR, 'src/views/Dashboard.vue');
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
      
      // Verify health endpoint is called
      expect(dashboardContent).toContain('/health');
      expect(dashboardContent).toContain('VITE_API_URL');
    });

    it('should display user identity in Dashboard.vue', () => {
      const dashboardPath = path.join(PORTAL_DIR, 'src/views/Dashboard.vue');
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
      
      // Verify user identity display
      expect(dashboardContent).toContain('displayName');
      expect(dashboardContent).toContain('userEmail');
    });

    it('should use Shell layout in Dashboard.vue', () => {
      const dashboardPath = path.join(PORTAL_DIR, 'src/views/Dashboard.vue');
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
      
      // Verify Shell is used as wrapper
      expect(dashboardContent).toContain('<Shell>');
      expect(dashboardContent).toContain('</Shell>');
    });
  });
});
