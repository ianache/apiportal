<template>
  <Shell>
    <div class="h-[calc(100vh-64px)] flex flex-col">
      <header class="flex items-center justify-between px-6 py-4 border-b" style="background: #ffffff; border-color: #e3e2e7;">
        <div class="flex items-center gap-4">
          <button
            @click="router.back()"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100"
            style="color: #414755;"
          >
            <span class="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          <div class="h-6 w-px" style="background: #e3e2e7;"></div>
          <div>
            <h1 class="text-lg font-bold" style="color: #1a1b1f;">{{ apiName }}</h1>
            <p class="text-xs" style="color: #717786;">OpenAPI Specification</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span
            v-if="version"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style="background: #eff4ff; color: #0058bc;"
          >
            v{{ version }}
          </span>
        </div>
      </header>

      <div class="flex-1 overflow-hidden">
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="text-center">
            <span class="material-symbols-outlined text-5xl animate-pulse" style="color: #0058bc;">api</span>
            <p class="mt-4 text-sm" style="color: #414755;">Loading specification...</p>
          </div>
        </div>

        <div v-else-if="error" class="flex items-center justify-center h-full">
          <div class="text-center max-w-md">
            <span class="material-symbols-outlined text-5xl" style="color: #dc2626;">error</span>
            <p class="mt-4 text-sm" style="color: #414755;">{{ error }}</p>
            <button
              @click="fetchSpec"
              class="mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
              style="background: #0058bc; color: #ffffff;"
            >
              Retry
            </button>
          </div>
        </div>

        <div v-else-if="!spec" class="flex items-center justify-center h-full">
          <div class="text-center">
            <span class="material-symbols-outlined text-5xl" style="color: #717786;">description</span>
            <p class="mt-4 text-sm" style="color: #414755;">No OpenAPI specification available for this API version.</p>
          </div>
        </div>

        <div class="flex flex-col overflow-hidden" style="height: calc(100vh - 64px);">
          <div v-if="!spec" class="flex items-center justify-center h-full">
            <span class="material-symbols-outlined text-5xl animate-pulse" style="color: #0058bc;">api</span>
          </div>
          <div v-else id="swagger-container" class="flex-1 overflow-y-auto"></div>
        </div>
      </div>
    </div>
  </Shell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();

console.log('[ApiSpecViewer] Component setup starting');

const apiId = ref(route.params.id as string);
const version = ref((route.params.version as string) || '');
const apiName = ref('');
const spec = ref<object | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const specString = computed(() => spec.value ? JSON.stringify(spec.value) : null);

console.log('[ApiSpecViewer] apiId:', apiId.value, 'version:', version.value);

let redocScript: HTMLScriptElement | null = null;

const fetchApiDetails = async () => {
  const auth = useAuthStore();
  const token = await auth.getToken();
  const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const res = await fetch(`${bffBase}/apis/${apiId.value}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.ok) {
    const api = await res.json();
    apiName.value = api.name;
    if (!version.value && api.versions?.length > 0) {
      version.value = api.versions[0].version;
    }
  }
};

const fetchSpec = async () => {
  loading.value = true;
  error.value = null;

  const timeout = setTimeout(() => {
    if (loading.value) {
      loading.value = false;
      error.value = 'Request timeout';
    }
  }, 10000);

  try {
    const auth = useAuthStore();
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    console.log('[ApiSpecViewer] Fetching spec from:', `${bffBase}/apis/${apiId.value}/versions/${version.value}/openapi`);
    
    const response = await fetch(`${bffBase}/apis/${apiId.value}/versions/${version.value}/openapi`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('[ApiSpecViewer] Response status:', response.status);
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spec: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('[ApiSpecViewer] Received data:', data);
    console.log('[ApiSpecViewer] data.openapi:', data.openapi);
    spec.value = data.openapi;
    console.log('[ApiSpecViewer] spec.value after assignment:', spec.value);
    loading.value = false;
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('[ApiSpecViewer] Error:', err);
    error.value = err.message || 'Failed to load specification';
    loading.value = false;
  }
};

const loadSwaggerUI = (): Promise<void> => {
  return new Promise((resolve) => {
    if ((window as any).SwaggerUIBundle) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js';
    script.onload = () => {
      console.log('[ApiSpecViewer] SwaggerUI loaded');
      resolve();
    };
    script.onerror = (e) => {
      console.error('[ApiSpecViewer] SwaggerUI load error:', e);
      error.value = 'Failed to load Swagger UI';
      resolve();
    };
    document.head.appendChild(script);
  });
};

onMounted(async () => {
  console.log('[ApiSpecViewer] onMounted fired');
  await loadSwaggerUI();
  await fetchApiDetails();
  await fetchSpec();
  if (spec.value) {
    await new Promise(resolve => setTimeout(resolve, 100));
    await nextTick();
    if ((window as any).SwaggerUIBundle) {
      (window as any).SwaggerUIBundle({
        spec: spec.value,
        dom_id: '#swagger-container',
        presets: [
          (window as any).SwaggerUIBundle.presets.apis,
          (window as any).SwaggerUIBundle.SwaggerUIStandalonePreset
        ]
      });
    }
  }
});

watch(spec, async (newVal) => {
  console.log('[ApiSpecViewer] Spec changed:', newVal ? 'has value' : 'null');
  if (newVal) {
    await loadSwaggerUI();
    await new Promise(resolve => setTimeout(resolve, 100));
    await nextTick();
    if ((window as any).SwaggerUIBundle) {
      console.log('[ApiSpecViewer] Initializing SwaggerUI');
      (window as any).SwaggerUIBundle({
        spec: newVal,
        dom_id: '#swagger-container',
        presets: [
          (window as any).SwaggerUIBundle.presets.apis,
          (window as any).SwaggerUIBundle.SwaggerUIStandalonePreset
        ]
      });
    }
  }
});
</script>
