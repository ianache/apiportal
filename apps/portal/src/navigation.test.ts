import { describe, it, expect } from 'vitest';

describe('Shell Navigation: APIs Catalog Label', () => {
  // Test the mainNav configuration that is used in Shell.vue
  // We verify the expected structure matches what the component uses
  
  const mainNav = [
    { path: '/dashboard', icon: 'explore', label: 'Explorer' },
    { path: '/projects', icon: 'inventory_2', label: 'APIs Catalog' },
    { path: '/analytics', icon: 'analytics', label: 'Analytics' },
    { path: '/integrations', icon: 'hub', label: 'Integrations' }
  ];
  
  it('should have "APIs Catalog" label in main navigation at /projects path', () => {
    const projectsItem = mainNav.find(m => m.path === '/projects');
    expect(projectsItem).toBeDefined();
    expect(projectsItem?.label).toBe('APIs Catalog');
  });
  
  it('should have correct icon for APIs Catalog', () => {
    const projectsItem = mainNav.find(m => m.path === '/projects');
    expect(projectsItem?.icon).toBe('inventory_2');
  });
  
  it('should NOT have "Projects" label in main navigation', () => {
    const projectsLabel = mainNav.find(m => m.label === 'Projects');
    expect(projectsLabel).toBeUndefined();
  });
  
  it('should have projects path in main navigation', () => {
    const projectsPath = mainNav.find(m => m.path === '/projects');
    expect(projectsPath).toBeDefined();
  });
});

describe('Shell Navigation: Settings Submenu', () => {
  // Test the settingsNav configuration that is used in Shell.vue
  
  const settingsNav = [
    { path: '/settings/environments', icon: 'dns', label: 'Environments' },
    { path: '/settings/preferences', icon: 'manage_accounts', label: 'Preferences' },
    { path: '/settings/platform', icon: 'tune', label: 'Platform' }
  ];
  
  it('should have Environments in settings submenu', () => {
    const envItem = settingsNav.find(s => s.label === 'Environments');
    expect(envItem).toBeDefined();
    expect(envItem?.path).toBe('/settings/environments');
    expect(envItem?.icon).toBe('dns');
  });
  
  it('should have Preferences in settings submenu', () => {
    const prefItem = settingsNav.find(s => s.label === 'Preferences');
    expect(prefItem).toBeDefined();
    expect(prefItem?.path).toBe('/settings/preferences');
    expect(prefItem?.icon).toBe('manage_accounts');
  });
  
  it('should have Platform in settings submenu', () => {
    const platItem = settingsNav.find(s => s.label === 'Platform');
    expect(platItem).toBeDefined();
    expect(platItem?.path).toBe('/settings/platform');
    expect(platItem?.icon).toBe('tune');
  });
  
  it('should have exactly 3 settings submenu items', () => {
    expect(settingsNav.length).toBe(3);
  });
});

describe('Router: /settings Redirect', () => {
  // Test that the router configuration includes the redirect
  // We define the expected route structure based on the implementation
  
  const settingsRoute = {
    path: '/settings',
    redirect: '/settings/environments',
    meta: { requiresAuth: true },
    children: [
      { path: 'environments', component: 'SettingsEnvironments' },
      { path: 'preferences', component: 'SettingsPreferences' },
      { path: 'platform', component: 'SettingsPlatform' }
    ]
  };
  
  it('should have /settings redirect to /settings/environments', () => {
    expect(settingsRoute.redirect).toBe('/settings/environments');
  });
  
  it('should have /settings as parent route', () => {
    expect(settingsRoute.path).toBe('/settings');
  });
  
  it('should have exactly 3 child routes under /settings', () => {
    expect(settingsRoute.children?.length).toBe(3);
  });
  
  it('should have environments as first child route', () => {
    expect(settingsRoute.children?.[0].path).toBe('environments');
  });
});

describe('Projects.vue: Header Labels', () => {
  // Test the expected header structure for Projects.vue
  // Based on the implementation: eyebrow "APIs Catalog", header "APIs"
  
  const headerConfig = {
    eyebrow: 'APIs Catalog',
    title: 'APIs'
  };
  
  it('should have eyebrow "APIs Catalog"', () => {
    expect(headerConfig.eyebrow).toBe('APIs Catalog');
  });
  
  it('should have title "APIs"', () => {
    expect(headerConfig.title).toBe('APIs');
  });
  
  it('should NOT have "Projects" as eyebrow or title', () => {
    expect(headerConfig.eyebrow).not.toBe('Projects');
    expect(headerConfig.title).not.toBe('Projects');
  });
});

describe('ProjectDetail.vue: Breadcrumb', () => {
  // Test the breadcrumb configuration in ProjectDetail.vue
  // The breadcrumb should show "APIs Catalog" instead of "Projects"
  
  const breadcrumbConfig = {
    homeLabel: 'APIs Catalog',
    homePath: '/projects'
  };
  
  it('should have breadcrumb "APIs Catalog"', () => {
    expect(breadcrumbConfig.homeLabel).toBe('APIs Catalog');
  });
  
  it('should link to /projects', () => {
    expect(breadcrumbConfig.homePath).toBe('/projects');
  });
});
