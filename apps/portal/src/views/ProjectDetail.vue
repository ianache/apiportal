<template>
  <Shell>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[60vh]">
      <span class="material-symbols-outlined animate-spin text-4xl" style="color: #0058bc;">progress_activity</span>
      <p class="mt-4 font-medium" style="color: #414755;">Loading project details…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-8 max-w-7xl mx-auto">
      <div class="p-6 rounded-2xl flex flex-col items-center gap-4"
           style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;">
        <span class="material-symbols-outlined text-4xl">error</span>
        <p class="text-lg font-bold">{{ error }}</p>
        <button
          @click="fetchData"
          class="py-2 px-6 rounded-xl font-bold transition-opacity hover:opacity-80"
          style="background: #ffffff; color: #991b1b; border: 1px solid #fecaca;"
        >Try Again</button>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="api" class="p-8 max-w-7xl mx-auto" style="font-family: 'Inter', sans-serif;">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 mb-6 text-sm">
        <router-link
          to="/projects"
          class="transition-colors hover:underline"
          style="color: #717786;"
        >APIs Catalog</router-link>
        <span class="material-symbols-outlined text-sm" style="color: #a0a7b5;">chevron_right</span>
        <span class="font-semibold" style="color: #1a1b1f;">{{ api.name }}</span>
      </nav>

      <!-- Header -->
      <header class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div class="lg:col-span-2">
          <div class="flex items-center gap-4 mb-3">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
                 style="background: #0058bc; box-shadow: 0 4px 14px rgba(0,88,188,0.30);">
              <span class="material-symbols-outlined text-3xl text-white"
                    style="font-variation-settings: 'FILL' 1;">api</span>
            </div>
            <div>
              <h1 class="text-4xl font-extrabold tracking-tight" style="color: #1a1b1f;">{{ api.name }}</h1>
              <p class="font-medium text-sm" style="color: #717786;">Project ID: {{ api.id }}</p>
            </div>
          </div>
          <p class="text-lg leading-relaxed max-w-2xl" style="color: #414755;">
            {{ api.description || 'No description provided for this API project.' }}
          </p>
        </div>

        <!-- Lifecycle card -->
        <div class="rounded-3xl p-6 flex flex-col justify-center border"
             style="background: #f4f3f8; border-color: #e3e2e7;">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold uppercase tracking-widest" style="color: #717786;">Lifecycle Status</span>
            <span
              class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
              :style="getStatusStyle(currentVersion?.status)"
            >{{ currentVersion?.status || 'UNKNOWN' }}</span>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span style="color: #717786;">Latest Version</span>
              <span class="font-bold" style="color: #1a1b1f;">v{{ currentVersion?.version }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span style="color: #717786;">Created</span>
              <span style="color: #1a1b1f;">{{ formatDate(api.createdAt) }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Grid: sidebar + main -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">

        <!-- Versions Sidebar -->
        <aside class="lg:col-span-1">
          <div class="flex items-center justify-between mb-4 px-1">
            <h2 class="text-xs font-bold uppercase tracking-widest" style="color: #717786;">Versions</h2>
            <button
              @click="showNewVersionModal = true"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
              style="background: #eff4ff; color: #0058bc;"
              title="Create new version"
            >
              <span class="material-symbols-outlined" style="font-size: 15px;">add</span>
              New
            </button>
          </div>
          <div class="space-y-2">
            <button
              v-for="v in api.versions"
              :key="v.id"
              @click="selectedVersion = v"
              class="w-full text-left p-4 rounded-2xl border transition-all duration-200"
              :style="selectedVersion?.id === v.id
                ? 'background: #ffffff; border-color: #0058bc; box-shadow: 0 2px 8px rgba(0,88,188,0.12); transform: scale(1.02);'
                : 'background: #f4f3f8; border-color: transparent;'"
            >
              <div class="flex items-center justify-between mb-1">
                <span
                  class="font-bold"
                  :style="selectedVersion?.id === v.id ? 'color: #0058bc;' : 'color: #1a1b1f;'"
                >v{{ v.version }}</span>
                <span
                  class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                  :style="getStatusStyle(v.status)"
                >{{ v.status }}</span>
              </div>
              <p class="text-[10px]" style="color: #717786;">{{ formatDate(v.createdAt) }}</p>
            </button>
          </div>
        </aside>

        <!-- Version Detail -->
        <main class="lg:col-span-3 space-y-8">
          <section
            v-if="selectedVersion"
            class="rounded-3xl p-8 border shadow-sm"
            style="background: #ffffff; border-color: #e3e2e7;"
          >
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 class="text-2xl font-bold" style="color: #1a1b1f;">Version v{{ selectedVersion.version }}</h3>
                <p class="text-sm mt-1" style="color: #717786;">Status Management & Operations</p>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap items-center gap-2">

                <!-- Submit for Review -->
                <button
                  v-if="canSubmitForReview"
                  @click="handleStatusTransition('REVIEW')"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                  style="background: #ffffff; border: 1.5px solid #0058bc; color: #0058bc;"
                >
                  <span class="material-symbols-outlined" style="font-size: 16px;">rate_review</span>
                  Submit for Review
                </button>

                <!-- Approve — amber-700 para pasar WCAG AA con blanco -->
                <button
                  v-if="canApprove"
                  @click="handleStatusTransition('APPROVED')"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                  style="background: #b45309; color: #ffffff; box-shadow: 0 4px 12px rgba(180,83,9,0.25);"
                >
                  <span class="material-symbols-outlined" style="font-size: 16px;">verified</span>
                  Approve Version
                </button>

                <!-- Publish — emerald-700 para pasar WCAG AA con blanco -->
                <button
                  v-if="canPublish"
                  @click="handleStatusTransition('PUBLISHED')"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                  style="background: #047857; color: #ffffff; box-shadow: 0 4px 12px rgba(4,120,87,0.25);"
                >
                  <span class="material-symbols-outlined" style="font-size: 16px;">rocket_launch</span>
                  Publish API
                </button>

                <!-- Design Flow -->
                <button
                  v-if="selectedVersion.status === 'DESIGN'"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 active:scale-95"
                  style="background: #0058bc; color: #ffffff; box-shadow: 0 4px 12px rgba(0,88,188,0.25);"
                >
                  <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                  Design Flow
                </button>
              </div>
            </div>

            <!-- Details grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="p-5 rounded-2xl border" style="background: #f4f3f8; border-color: #e3e2e7;">
                <h4 class="text-xs font-bold uppercase tracking-widest mb-4" style="color: #717786;">
                  Implementation Details
                </h4>
                <div class="space-y-3">
                  <div class="flex items-center justify-between text-sm">
                    <span style="color: #717786;">Version ID</span>
                    <code
                      class="text-[11px] px-2 py-0.5 rounded font-mono"
                      style="background: #ffffff; color: #1a1b1f; border: 1px solid #e3e2e7;"
                    >{{ selectedVersion.id }}</code>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span style="color: #717786;">Last Updated</span>
                    <span class="font-medium" style="color: #1a1b1f;">{{ formatDate(selectedVersion.updatedAt) }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span style="color: #717786;">Status</span>
                    <span
                      class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                      :style="getStatusStyle(selectedVersion.status)"
                    >{{ selectedVersion.status }}</span>
                  </div>
                </div>
              </div>

              <div class="p-5 rounded-2xl border" style="background: #f4f3f8; border-color: #e3e2e7;">
                <h4 class="text-xs font-bold uppercase tracking-widest mb-4" style="color: #717786;">
                  Designer Insights
                </h4>
                <p class="text-sm leading-relaxed italic" style="color: #414755;">
                  "This version includes updated rate-limiting policies and new endpoints for batch
                  processing. Ready for security review."
                </p>
              </div>
            </div>
          </section>
        </main>

      </div>
    </div>

    <!-- New Version Modal -->
    <div
      v-if="showNewVersionModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background: rgba(26,27,31,0.55); backdrop-filter: blur(4px);"
    >
      <div
        class="rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200"
        style="background: #ffffff;"
      >
        <div class="flex items-start justify-between mb-2">
          <h2 class="text-2xl font-bold" style="color: #1a1b1f;">New Version</h2>
          <button
            @click="showNewVersionModal = false"
            class="p-1.5 rounded-full transition-colors hover:bg-gray-100 ml-4"
            style="color: #717786;"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <p class="text-sm mb-6" style="color: #717786;">Create a new branch from current state.</p>

        <div>
          <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 ml-1" style="color: #414755;">
            Version Number (SemVer) <span style="color: #991b1b;">*</span>
          </label>
          <input
            v-model="newVersionNumber"
            type="text"
            class="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
            style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
            placeholder="e.g. 1.0.0"
          />
        </div>

        <div class="flex gap-3 mt-8">
          <button
            @click="showNewVersionModal = false"
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
            style="color: #414755; border: 1px solid #e3e2e7;"
          >
            <span class="material-symbols-outlined text-base">close</span>
            Cancel
          </button>
          <button
            class="flex-1 py-3 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            style="background: #0058bc; color: #ffffff; box-shadow: 0 4px 14px rgba(0,88,188,0.30);"
          >
            <span class="material-symbols-outlined text-base">add_circle</span>
            Create
          </button>
        </div>
      </div>
    </div>

  </Shell>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import { useRegistryStore } from '../stores/registry';
import { useAuthStore } from '../stores/auth';
import type { API, APIVersion, APIStatus } from 'shared-types';

const route = useRoute();
const registry = useRegistryStore();
const auth = useAuthStore();

const api = ref<API | null>(null);
const selectedVersion = ref<APIVersion | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showNewVersionModal = ref(false);
const newVersionNumber = ref('');

const currentVersion = computed(() => api.value?.versions?.[0] || null);

const userRole = computed(() => {
  const roles = auth.user?.resource_access?.[import.meta.env.VITE_KEYCLOAK_CLIENT_ID]?.roles || [];
  if (roles.includes('API-Admin') || roles.includes('API-Manager')) return 'API_MANAGER';
  if (roles.includes('API-Designer')) return 'API_DESIGNER';
  return 'API_DEVELOPER';
});

const canSubmitForReview = computed(() =>
  selectedVersion.value?.status === 'DESIGN' &&
  (userRole.value === 'API_MANAGER' || userRole.value === 'API_DESIGNER')
);

const canApprove = computed(() =>
  selectedVersion.value?.status === 'REVIEW' && userRole.value === 'API_MANAGER'
);

const canPublish = computed(() =>
  selectedVersion.value?.status === 'APPROVED' && userRole.value === 'API_MANAGER'
);

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const id = route.params.id as string;
    const data = await registry.fetchApiById(id);
    api.value = data;
    if (data.versions?.length) selectedVersion.value = data.versions[0];
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);

const handleStatusTransition = async (status: APIStatus) => {
  if (!api.value || !selectedVersion.value) return;
  try {
    await registry.updateVersionStatus(api.value.id, selectedVersion.value.version, status);
    await fetchData();
  } catch {
    // handled by store
  }
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

const getStatusStyle = (status?: string): Record<string, string> => {
  switch (status) {
    case 'DESIGN':     return { background: '#dbeafe', color: '#1e40af' };
    case 'REVIEW':     return { background: '#fef9c3', color: '#854d0e' };
    case 'APPROVED':   return { background: '#dcfce7', color: '#166534' };
    case 'PUBLISHED':  return { background: '#e0f2fe', color: '#075985' };
    case 'DEPRECATED': return { background: '#ffedd5', color: '#9a3412' };
    case 'RETIRED':    return { background: '#f1f5f9', color: '#334155' };
    default:           return { background: '#f1f5f9', color: '#334155' };
  }
};
</script>
