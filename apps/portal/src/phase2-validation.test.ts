import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Test 4: T-04 - Verify Projects dashboard UI has grid/table views
describe('T-04: Projects Dashboard UI', () => {
  it('should have Projects.vue with grid view', () => {
    const projectsPath = join(__dirname, './views/Projects.vue');
    const projectsCode = readFileSync(projectsPath, 'utf-8');
    
    // Verify grid view exists
    expect(projectsCode).toContain("viewMode === 'grid'");
    expect(projectsCode).toContain('grid_view');
    expect(projectsCode).toContain('grid grid-cols');
  });

  it('should have Projects.vue with table view', () => {
    const projectsPath = join(__dirname, './views/Projects.vue');
    const projectsCode = readFileSync(projectsPath, 'utf-8');
    
    // Verify table view exists
    expect(projectsCode).toContain("viewMode === 'table'");
    expect(projectsCode).toContain('view_list');
    expect(projectsCode).toContain('<table');
  });

  it('should have view toggle buttons', () => {
    const projectsPath = join(__dirname, './views/Projects.vue');
    const projectsCode = readFileSync(projectsPath, 'utf-8');
    
    // Verify toggle functionality
    expect(projectsCode).toContain('@click="viewMode = \'grid\'"');
    expect(projectsCode).toContain('@click="viewMode = \'table\'"');
  });
});

// Test 5: T-05 - Verify Project Detail has action buttons
describe('T-05: Project Detail Status Transitions', () => {
  it('should have Submit for Review button', () => {
    const detailPath = join(__dirname, './views/ProjectDetail.vue');
    const detailCode = readFileSync(detailPath, 'utf-8');
    
    expect(detailCode).toContain('Submit for Review');
    expect(detailCode).toContain('handleStatusTransition(\'REVIEW\')');
  });

  it('should have Approve button', () => {
    const detailPath = join(__dirname, './views/ProjectDetail.vue');
    const detailCode = readFileSync(detailPath, 'utf-8');
    
    expect(detailCode).toContain('Approve Version');
    expect(detailCode).toContain('handleStatusTransition(\'APPROVED\')');
  });

  it('should have Publish button', () => {
    const detailPath = join(__dirname, './views/ProjectDetail.vue');
    const detailCode = readFileSync(detailPath, 'utf-8');
    
    expect(detailCode).toContain('Publish API');
    expect(detailCode).toContain('handleStatusTransition(\'PUBLISHED\')');
  });

  it('should have Design Flow button', () => {
    const detailPath = join(__dirname, './views/ProjectDetail.vue');
    const detailCode = readFileSync(detailPath, 'utf-8');
    
    expect(detailCode).toContain('Design Flow');
  });
});

// Test 6: T-06 - Verify RBAC gates in UI
describe('T-06: UI RBAC Gates', () => {
  it('should restrict Approve to API_MANAGER in ProjectDetail', () => {
    const detailPath = join(__dirname, './views/ProjectDetail.vue');
    const detailCode = readFileSync(detailPath, 'utf-8');
    
    // Verify canApprove computed property restricts to MANAGER
    expect(detailCode).toContain('canApprove');
    expect(detailCode).toContain("userRole.value === 'API_MANAGER'");
  });

  it('should restrict Publish to API_MANAGER in ProjectDetail', () => {
    const detailPath = join(__dirname, './views/ProjectDetail.vue');
    const detailCode = readFileSync(detailPath, 'utf-8');
    
    // Verify canPublish computed property restricts to MANAGER
    expect(detailCode).toContain('canPublish');
    expect(detailCode).toContain("userRole.value === 'API_MANAGER'");
  });

  it('should restrict New Project to Designers in Projects view', () => {
    const projectsPath = join(__dirname, './views/Projects.vue');
    const projectsCode = readFileSync(projectsPath, 'utf-8');
    
    // Verify canCreate computed property
    expect(projectsCode).toContain('canCreate');
    expect(projectsCode).toContain('API-Designer');
    expect(projectsCode).toContain('API-Admin');
  });

  it('should have userRole computed property', () => {
    const detailPath = join(__dirname, './views/ProjectDetail.vue');
    const detailCode = readFileSync(detailPath, 'utf-8');
    
    // Verify userRole computation
    expect(detailCode).toContain('const userRole = computed');
    expect(detailCode).toContain('API_MANAGER');
    expect(detailCode).toContain('API_DESIGNER');
  });
});
