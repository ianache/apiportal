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
            <p class="text-xs" style="color: #717786;">API Documentation</p>
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
            <p class="mt-4 text-sm" style="color: #414755;">Loading documentation...</p>
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

        <div v-if="showRedoc" id="redoc-container" class="flex-1 overflow-y-auto" style="height: 100%;"></div>

        <div v-if="showFallback && spec" class="flex-1 overflow-y-auto p-6" style="height: 100%;">
          <pre class="text-xs overflow-x-auto" style="color: #414755;">{{ JSON.stringify(spec, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </Shell>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();

const apiId = ref(route.params.id as string);
const version = ref((route.params.version as string) || '');
const apiName = ref('');
const spec = ref<object | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showFallback = ref(false);
const showRedoc = ref(false);
const redocInitAttempted = ref(false);

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
  showRedoc.value = false;
  redocInitAttempted.value = false;

  try {
    const auth = useAuthStore();
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${bffBase}/apis/${apiId.value}/versions/${version.value}/openapi`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spec: ${response.statusText}`);
    }
    const data = await response.json();
    spec.value = data.openapi;
    loading.value = false;
  } catch (err: any) {
    error.value = err.message || 'Failed to load specification';
    loading.value = false;
  }
};

const loadRedoc = (): Promise<void> => {
  return new Promise((resolve) => {
    if ((window as any).Redoc) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/redoc@2.5.2/bundles/redoc.styles.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/redoc@2.5.2/bundles/redoc.standalone.js';
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      error.value = 'Failed to load Redoc';
      resolve();
    };
    document.head.appendChild(script);
  });
};

const sanitizeSpec = (rawSpec: any): any => {
  const defined = new Set<string>();
  const addKeys = (section: Record<string, unknown> | undefined, prefix: string) => {
    if (section) Object.keys(section).forEach(k => defined.add(`${prefix}${k}`));
  };
  addKeys(rawSpec.components?.schemas, '#/components/schemas/');
  addKeys(rawSpec.components?.parameters, '#/components/parameters/');
  addKeys(rawSpec.components?.responses, '#/components/responses/');
  addKeys(rawSpec.components?.requestBodies, '#/components/requestBodies/');

  const fix = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(fix);
    if (obj && typeof obj === 'object') {
      if (typeof obj.$ref === 'string' && !defined.has(obj.$ref)) {
        return { type: 'object', description: `[Unresolved: ${obj.$ref}]` };
      }
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fix(v)]));
    }
    return obj;
  };

  return fix(rawSpec);
};

const initRedoc = async () => {
  if (!spec.value || redocInitAttempted.value) return;
  
  redocInitAttempted.value = true;
  showRedoc.value = true;
  
  await loadRedoc();
  await nextTick();
  
  await new Promise(resolve => setTimeout(resolve, 200));

  const container = document.getElementById('redoc-container');
  if (container && (window as any).Redoc) {
    try {
      (window as any).Redoc.init(sanitizeSpec(spec.value), {
        scrollYOffset: 50,
        nativeScrollbars: true
      }, container);
    } catch (err: any) {
      console.error('Redoc init error:', err);
      showRedoc.value = false;
      showFallback.value = true;
    }
  }
};

onMounted(async () => {
  await fetchApiDetails();
  await fetchSpec();
  await initRedoc();
});

watch(spec, async (newSpec) => {
  if (newSpec) {
    showFallback.value = false;
    await nextTick();
    await initRedoc();
  }
});
</script>
