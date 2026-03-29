import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
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
  // Placeholder routes — rendered inside Shell, will be implemented in future plans
  {
    path: '/projects',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/analytics',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/integrations',
    component: Dashboard,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();

  // Initialize Keycloak on first navigation if not yet done
  if (!auth.keycloak) {
    await auth.init();
  }

  if (to.meta.requiresAuth && !auth.authenticated) {
    // Redirect to Keycloak login — does not call next()
    auth.keycloak?.login({ redirectUri: window.location.origin + to.fullPath });
  } else if (to.path === '/' && auth.authenticated) {
    // Authenticated users visiting root are forwarded to dashboard
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
