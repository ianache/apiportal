import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Landing from '../views/Landing.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/', component: Landing },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();
  if (!auth.keycloak) await auth.init();
  
  if (to.meta.requiresAuth && !auth.authenticated) {
    auth.keycloak?.login();
  } else {
    next();
  }
});

export default router;
