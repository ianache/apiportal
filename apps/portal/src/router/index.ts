import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Projects from '../views/Projects.vue';
import ProjectDetail from '../views/ProjectDetail.vue';
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
    path: '/projects',
    component: Projects,
    meta: { requiresAuth: true }
  },
  {
    path: '/projects/:id',
    component: ProjectDetail,
    meta: { requiresAuth: true }
  },
  // Placeholder routes
  {
    path: '/analytics',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/integrations',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    redirect: '/settings/environments',
    meta: { requiresAuth: true },
    children: [
      { path: 'environments', component: () => import('../views/settings/SettingsEnvironments.vue') },
      { path: 'preferences', component: () => import('../views/settings/SettingsPreferences.vue') },
      { path: 'platform', component: () => import('../views/settings/SettingsPlatform.vue') }
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
