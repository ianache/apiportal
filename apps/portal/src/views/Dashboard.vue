<template>
  <Shell>
    <div class="max-w-5xl mx-auto" style="font-family: 'Inter', sans-serif;">

      <!-- Welcome Header -->
      <header class="mb-10">
        <span class="text-xs font-bold uppercase tracking-widest block mb-1" style="color: #0058bc;">
          Phase 1 — Foundation
        </span>
        <h1 class="text-4xl font-bold tracking-tight" style="color: #1a1b1f;">
          Welcome, {{ displayName }}
        </h1>
        <p class="mt-1 text-sm" style="color: #717786;">
          {{ welcomeMessage }}
        </p>
      </header>

      <!-- Status Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

        <!-- User Card -->
        <div
          class="p-6 rounded-2xl"
          style="background: #fff; border: 1px solid #e3e2e7; box-shadow: 0 1px 8px rgba(0,0,0,0.04);"
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              style="background: rgba(0,88,188,0.1);"
            >
              <span class="material-symbols-outlined" style="color: #0058bc; font-size: 20px;">person</span>
            </div>
            <span class="text-xs font-bold uppercase tracking-widest" style="color: #717786;">Identity</span>
          </div>
          <p class="font-bold text-lg leading-tight" style="color: #1a1b1f;">{{ displayName }}</p>
          <p class="text-sm mt-1" style="color: #717786;">{{ userEmail }}</p>
        </div>

        <!-- Role Card -->
        <div
          class="p-6 rounded-2xl"
          style="background: #fff; border: 1px solid #e3e2e7; box-shadow: 0 1px 8px rgba(0,0,0,0.04);"
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              :style="{ background: roleBadgeColor + '1a' }"
            >
              <span class="material-symbols-outlined" :style="{ color: roleBadgeColor, fontSize: '20px' }">
                {{ roleIcon }}
              </span>
            </div>
            <span class="text-xs font-bold uppercase tracking-widest" style="color: #717786;">Role</span>
          </div>
          <p class="font-bold text-lg leading-tight" style="color: #1a1b1f;">{{ roleLabel }}</p>
          <p class="text-sm mt-1" style="color: #717786;">{{ roleDescription }}</p>
        </div>

        <!-- Backend Health Card -->
        <div
          class="p-6 rounded-2xl"
          style="background: #fff; border: 1px solid #e3e2e7; box-shadow: 0 1px 8px rgba(0,0,0,0.04);"
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              :style="{ background: healthBg }"
            >
              <span
                v-if="healthStatus === 'loading'"
                class="material-symbols-outlined animate-spin"
                style="color: #717786; font-size: 20px;"
              >progress_activity</span>
              <span
                v-else
                class="material-symbols-outlined"
                :style="{ color: healthIconColor, fontSize: '20px' }"
              >{{ healthIcon }}</span>
            </div>
            <span class="text-xs font-bold uppercase tracking-widest" style="color: #717786;">Backend</span>
          </div>
          <p class="font-bold text-lg leading-tight" style="color: #1a1b1f;">
            Database: {{ databaseLabel }}
          </p>
          <p class="text-sm mt-1" style="color: #717786;">
            BFF /health &bull; {{ healthTimestamp }}
          </p>
        </div>

      </div>

      <!-- System Details -->
      <section
        class="p-6 rounded-2xl"
        style="background: #fff; border: 1px solid #e3e2e7; box-shadow: 0 1px 8px rgba(0,0,0,0.04);"
      >
        <h2 class="text-base font-bold mb-4" style="color: #1a1b1f;">System Diagnostics</h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between py-2 border-b" style="border-color: #f4f3f8;">
            <span class="text-sm" style="color: #717786;">Keycloak Realm</span>
            <span class="text-sm font-medium" style="color: #1a1b1f;">{{ keycloakRealm }}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b" style="border-color: #f4f3f8;">
            <span class="text-sm" style="color: #717786;">Client ID</span>
            <span class="text-sm font-medium" style="color: #1a1b1f;">{{ keycloakClient }}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b" style="border-color: #f4f3f8;">
            <span class="text-sm" style="color: #717786;">BFF Status</span>
            <span
              class="text-sm font-semibold flex items-center gap-1"
              :style="{ color: healthIconColor }"
            >
              <span class="material-symbols-outlined" style="font-size: 16px;">{{ healthIcon }}</span>
              {{ bffStatusLabel }}
            </span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-sm" style="color: #717786;">Token Expires</span>
            <span class="text-sm font-medium" style="color: #1a1b1f;">{{ tokenExpiry }}</span>
          </div>
        </div>

        <button
          @click="fetchHealth"
          class="mt-4 flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
          style="color: #0058bc;"
          :disabled="healthStatus === 'loading'"
        >
          <span class="material-symbols-outlined" style="font-size: 16px;">refresh</span>
          Refresh diagnostics
        </button>
      </section>

    </div>
  </Shell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Shell from '../components/layout/Shell.vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

// ---- User identity ----
const displayName = computed(() =>
  auth.user?.name || auth.user?.preferred_username || 'User'
);
const userEmail = computed(() => auth.user?.email || '');
const keycloakRealm = computed(() => import.meta.env.VITE_KEYCLOAK_REALM || 'apps');
const keycloakClient = computed(() => import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'apiportal');

const tokenExpiry = computed(() => {
  const exp = auth.user?.exp as number | undefined;
  if (!exp) return 'Unknown';
  return new Date(exp * 1000).toLocaleTimeString();
});

// ---- Role ----
const userRoles = computed<string[]>(() => {
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'apiportal';
  return (auth.user as any)?.resource_access?.[clientId]?.roles ?? [];
});

const isManager = computed(() => 
  userRoles.value.includes('API-Manager') || userRoles.value.includes('API-Admin')
);

const roleLabel = computed(() => {
  if (isManager.value) return 'API Manager';
  if (userRoles.value.includes('API-Designer')) return 'API Designer';
  if (userRoles.value.includes('API-Developer')) return 'API Developer';
  return 'Guest';
});

const roleDescription = computed(() => {
  if (isManager.value) return 'Full platform administration';
  if (userRoles.value.includes('API-Designer')) return 'API design & flow authoring';
  if (userRoles.value.includes('API-Developer')) return 'API discovery & subscription';
  return 'Limited access';
});

const roleIcon = computed(() => {
  if (isManager.value) return 'admin_panel_settings';
  if (userRoles.value.includes('API-Designer')) return 'design_services';
  return 'code';
});

const roleBadgeColor = computed(() => {
  if (isManager.value) return '#0058bc';
  if (userRoles.value.includes('API-Designer')) return '#006e28';
  return '#9e3d00';
});

const welcomeMessage = computed(() => `Welcome to Nexus — logged in as ${roleLabel.value}.`);

// ---- Health ----
interface HealthResponse {
  status: string;
  database: string;
  timestamp: string;
}

const healthStatus = ref<'loading' | 'up' | 'down' | 'error'>('loading');
const healthData = ref<HealthResponse | null>(null);

const databaseLabel = computed(() => {
  if (healthStatus.value === 'loading') return 'Checking...';
  if (healthStatus.value === 'error') return 'Unreachable';
  return healthData.value?.database === 'CONNECTED' ? 'Connected' : 'Unavailable';
});

const bffStatusLabel = computed(() => {
  if (healthStatus.value === 'loading') return 'Checking...';
  if (healthStatus.value === 'error') return 'Unreachable';
  return healthData.value?.status === 'UP' ? 'Healthy' : 'Degraded';
});

const healthTimestamp = computed(() => {
  if (!healthData.value?.timestamp) return '—';
  return new Date(healthData.value.timestamp).toLocaleTimeString();
});

const healthIcon = computed(() => {
  if (healthStatus.value === 'loading') return 'progress_activity';
  if (healthStatus.value === 'up') return 'check_circle';
  return 'error';
});

const healthBg = computed(() => {
  if (healthStatus.value === 'loading') return 'rgba(113,119,134,0.1)';
  if (healthStatus.value === 'up') return 'rgba(0,110,40,0.1)';
  return 'rgba(186,26,26,0.1)';
});

const healthIconColor = computed(() => {
  if (healthStatus.value === 'loading') return '#717786';
  if (healthStatus.value === 'up') return '#006e28';
  return '#ba1a1a';
});

async function fetchHealth() {
  healthStatus.value = 'loading';
  healthData.value = null;
  try {
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const token = auth.keycloak?.token;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${bffBase}/health`, { headers });
    const data: HealthResponse = await res.json();
    healthData.value = data;
    healthStatus.value = data.status === 'UP' ? 'up' : 'down';
  } catch {
    healthStatus.value = 'error';
  }
}

onMounted(() => {
  fetchHealth();
});
</script>
