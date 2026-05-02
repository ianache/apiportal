<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import ApiRedoc from '../components/explorer/ApiRedoc.vue';
import ApiConsole from '../components/explorer/ApiConsole.vue';
import { useRegistryStore } from '../stores/registry';
import { useDomainsStore } from '../stores/domains';
import { useSubscriptionsStore } from '../stores/subscriptions';
import type { API, APIVersion } from 'shared-types';

const route = useRoute();
const router = useRouter();
const registry = useRegistryStore();
const domainsStore = useDomainsStore();
const subsStore = useSubscriptionsStore();

const apiId = computed(() => route.params.id as string);
const api = ref<API | null>(null);
const selectedVersionStr = ref((route.params.version as string) || '');
const activeTab = ref<'docs' | 'console' | 'subscriptions'>('docs');
const loading = ref(true);
const error = ref<string | null>(null);
const spec = ref<any>(null);
const loadingSpec = ref(false);

const subscription = computed(() => {
  return subsStore.subscriptions.find(s => s.apiId === apiId.value);
});

const isSubscribed = computed(() => !!subscription.value);

const selectedVersion = computed(() => {
  if (!api.value || !api.value.versions) return null;
  if (!selectedVersionStr.value) return api.value.versions[0];
  return api.value.versions.find(v => v.version === selectedVersionStr.value) || api.value.versions[0];
});

const domainTitle = (id?: string | null) => {
  if (!id) return null;
  return domainsStore.domains.find(d => d.id === id)?.title;
};

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    api.value = await registry.fetchApiById(apiId.value);
    if (!selectedVersionStr.value && api.value.versions?.length) {
      selectedVersionStr.value = api.value.versions[0].version;
    }
    await Promise.all([
      fetchSpec(),
      subsStore.fetchMySubscriptions()
    ]);
  } catch (err: any) {
    error.value = err.message || 'Failed to load API details';
  } finally {
    loading.value = false;
  }
};

const fetchSpec = async () => {
  if (!selectedVersion.value) return;
  loadingSpec.value = true;
  try {
    spec.value = await registry.fetchOpenApiSpec(apiId.value, selectedVersion.value.version);
  } catch (err) {
    console.error('Failed to fetch spec:', err);
  } finally {
    loadingSpec.value = false;
  }
};

watch(selectedVersion, fetchSpec);

onMounted(async () => {
  domainsStore.fetch();
  await fetchData();
});

const changeVersion = (v: string) => {
  selectedVersionStr.value = v;
  router.replace(`/explorer/${apiId.value}/${v}`);
};

const handleSubscribe = async () => {
  if (!api.value) return;
  try {
    await subsStore.subscribeToApi(api.value.id);
    activeTab.value = 'subscriptions';
  } catch (err: any) {
    alert(err.message);
  }
};

const handleUnsubscribe = async () => {
  if (!subscription.value) return;
  if (!confirm('Are you sure you want to revoke this subscription?')) return;
  try {
    await subsStore.unsubscribe(subscription.value.id);
  } catch (err: any) {
    alert(err.message);
  }
};

const copyKey = (key: string) => {
  navigator.clipboard.writeText(key);
  // Optional: show toast
};
</script>

<template>
  <Shell>
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[60vh]">
      <span class="material-symbols-outlined animate-spin text-4xl" style="color: #0058bc;">progress_activity</span>
      <p class="mt-4 font-medium" style="color: #414755;">Loading API Explorer…</p>
    </div>

    <div v-else-if="error" class="p-8 max-w-7xl mx-auto text-center">
      <span class="material-symbols-outlined text-5xl text-red-500">error</span>
      <p class="mt-4 text-xl font-bold">{{ error }}</p>
      <button @click="fetchData" class="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl">Retry</button>
    </div>

    <div v-else-if="api" class="flex flex-col h-[calc(100vh-64px)]">
      <!-- API Header -->
      <header class="bg-white border-b px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style="border-color: #e3e2e7;">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
            <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">api</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ api.name }}</h1>
            <div class="flex items-center gap-3 mt-1">
              <span v-if="api.domainId" class="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {{ domainTitle(api.domainId) }}
              </span>
              <span class="text-xs font-medium text-gray-500 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">schedule</span>
                Updated {{ new Date(api.updatedAt).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Version Switcher -->
          <div class="relative group">
            <select 
              :value="selectedVersion?.version" 
              @change="changeVersion(($event.target as HTMLSelectElement).value)"
              class="appearance-none pl-4 pr-10 py-2 rounded-xl border border-gray-200 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option v-for="v in api.versions" :key="v.id" :value="v.version">
                v{{ v.version }} ({{ v.status }})
              </option>
            </select>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">expand_more</span>
          </div>

          <button 
            v-if="!isSubscribed"
            @click="handleSubscribe"
            :disabled="subsStore.loading"
            class="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {{ subsStore.loading ? 'Processing...' : 'Subscribe' }}
          </button>
          <div v-else class="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-100">
            <span class="material-symbols-outlined text-base">check_circle</span>
            <span class="text-sm font-bold">Subscribed</span>
          </div>
        </div>
      </header>

      <!-- Description Section -->
      <div class="bg-gray-50 px-8 py-4 border-b border-gray-200">
        <p class="text-sm text-gray-600 max-w-4xl">{{ api.description || 'No description provided.' }}</p>
      </div>

      <!-- Navigation Tabs -->
      <nav class="bg-white border-b border-gray-200 flex px-8">
        <button 
          @click="activeTab = 'docs'"
          class="px-6 py-4 text-sm font-bold border-b-2 transition-all"
          :class="activeTab === 'docs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Documentation
        </button>
        <button 
          @click="activeTab = 'console'"
          class="px-6 py-4 text-sm font-bold border-b-2 transition-all"
          :class="activeTab === 'console' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Console (Try It)
        </button>
        <button 
          @click="activeTab = 'subscriptions'"
          class="px-6 py-4 text-sm font-bold border-b-2 transition-all"
          :class="activeTab === 'subscriptions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          My Subscriptions
        </button>
      </nav>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-hidden relative">
        <div v-if="loadingSpec" class="absolute inset-0 z-10 bg-white/80 flex items-center justify-center">
          <span class="material-symbols-outlined animate-spin text-3xl text-blue-600">progress_activity</span>
        </div>

        <!-- Documentation & Console -->
        <template v-if="activeTab !== 'subscriptions'">
          <div v-if="!spec" class="flex flex-col items-center justify-center h-full text-gray-400">
            <span class="material-symbols-outlined text-6xl mb-4">description_off</span>
            <p>No specification available for this version.</p>
          </div>
          <template v-else>
            <ApiRedoc v-if="activeTab === 'docs'" :spec="spec" />
            <ApiConsole v-if="activeTab === 'console'" :spec="spec" />
          </template>
        </template>

        <!-- Subscriptions Tab -->
        <div v-else class="h-full overflow-y-auto p-8">
          <div v-if="!isSubscribed" class="flex flex-col items-center justify-center py-20 text-gray-400">
            <span class="material-symbols-outlined text-6xl mb-4">key_off</span>
            <h3 class="text-xl font-bold text-gray-700">No active subscription</h3>
            <p class="mt-2 mb-6">Subscribe to this API to get access keys and start consuming it.</p>
            <button @click="handleSubscribe" class="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold">Subscribe Now</button>
          </div>
          
          <div v-else class="max-w-4xl">
            <div class="flex justify-between items-start mb-8">
              <div>
                <h3 class="text-xl font-bold text-gray-900">Your Subscription</h3>
                <p class="text-sm text-gray-500 mt-1">Status: <span class="font-bold text-green-600">{{ subscription?.status }}</span></p>
              </div>
              <button @click="handleUnsubscribe" class="text-sm font-bold text-red-600 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-50">Revoke Access</button>
            </div>

            <h4 class="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">API Keys per Environment</h4>
            <div class="grid gap-4">
              <div v-for="key in subscription?.keys" :key="key.id" class="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div class="flex items-center gap-4 flex-1">
                  <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <span class="material-symbols-outlined text-gray-400">lan</span>
                  </div>
                  <div>
                    <span class="text-xs font-bold uppercase text-gray-400">Environment ID</span>
                    <p class="text-sm font-bold text-gray-700">{{ key.environmentId }}</p>
                  </div>
                </div>
                <div class="flex-1 w-full">
                  <span class="text-xs font-bold uppercase text-gray-400">API Key</span>
                  <div class="flex items-center gap-2 mt-1">
                    <code class="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-xs font-mono border border-gray-100">{{ key.apiKey }}</code>
                    <button @click="copyKey(key.apiKey)" class="p-2 hover:bg-gray-100 rounded-lg" title="Copy key">
                      <span class="material-symbols-outlined text-base">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </Shell>
</template>
