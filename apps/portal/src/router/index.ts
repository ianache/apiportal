import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Projects from '../views/Projects.vue';
import ProjectDetail from '../views/ProjectDetail.vue';
import ApiDesigner from '../views/ApiDesigner.vue';
import Integrations from '../views/Integrations.vue';
import IntegrationDetail from '../views/IntegrationDetail.vue';
import IntegrationDesigner from '../views/IntegrationDesigner.vue';
import Landing from '../views/Landing.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    component: Landing
  },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/explorer',
    component: () => import('../views/Explorer.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/projects',
    component: Projects,
    meta: { requiresAuth: true }
  },
  {
    path: '/projects/:id',
    component: ProjectDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/projects/:id/design/:version',
    component: ApiDesigner,
    meta: { requiresAuth: true }
  },
  {
    path: '/integrations',
    component: Integrations,
    meta: { requiresAuth: true }
  },
  {
    path: '/integrations/:id',
    component: IntegrationDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/integrations/:id/design',
    component: IntegrationDesigner,
    meta: { requiresAuth: true }
  },
  {
    path: '/domains',
    component: () => import('../views/settings/SettingsDomains.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/domains/:id/concept-modeler',
    component: () => import('../views/ConceptModeler.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    redirect: '/settings/environments',
    meta: { requiresAuth: true },
    children: [
      { path: 'environments', component: () => import('../views/settings/SettingsEnvironments.vue') },
      { path: 'preferences',  component: () => import('../views/settings/SettingsPreferences.vue') },
      { path: 'domains',      component: () => import('../views/settings/SettingsDomains.vue') },
      { path: 'node-types',   component: () => import('../views/settings/SettingsNodeTypes.vue') },
      { path: 'status',       component: Dashboard }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, _from) => {
  const auth = useAuthStore();

  // Initialize Keycloak on first navigation if not yet done
  if (!auth.keycloak) {
    await auth.init();
  }

  if (to.meta.requiresAuth && !auth.authenticated) {
    // Redirect to Keycloak login — does not call next()
    auth.keycloak?.login({ redirectUri: window.location.origin + to.fullPath });
    return false; // prevent navigation while redirecting
  } else if (to.path === '/' && auth.authenticated) {
    // Authenticated users visiting root are forwarded to dashboard
    return '/dashboard';
  } else {
    return true;
  }
});

export default router;
