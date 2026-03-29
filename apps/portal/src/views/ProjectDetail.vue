<template>
  <Shell>
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[60vh]">
      <span class="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      <p class="mt-4 text-on-surface-variant font-medium">Loading project details...</p>
    </div>

    <div v-else-if="error" class="p-8 max-w-7xl mx-auto">
      <div class="bg-error-container text-on-error-container p-6 rounded-2xl flex flex-col items-center gap-4">
        <span class="material-symbols-outlined text-4xl">error</span>
        <p class="text-lg font-bold">{{ error }}</p>
        <button @click="fetchData" class="py-2 px-6 bg-white rounded-xl text-error font-bold shadow-sm">Try Again</button>
      </div>
    </div>

    <div v-else-if="api" class="p-8 max-w-7xl mx-auto" style="font-family: 'Inter', sans-serif;">
      
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 mb-6 text-sm">
        <router-link to="/projects" class="text-on-surface-variant hover:text-primary transition-colors">Projects</router-link>
        <span class="material-symbols-outlined text-outline text-sm">chevron_right</span>
        <span class="text-on-surface font-semibold">{{ api.name }}</span>
      </nav>

      <!-- Header Section -->
      <header class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div class="lg:col-span-2">
          <div class="flex items-center gap-4 mb-3">
             <div class="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">api</span>
              </div>
              <div>
                <h1 class="text-4xl font-extrabold tracking-tight text-on-surface">{{ api.name }}</h1>
                <p class="text-on-surface-variant font-medium">Project ID: {{ api.id }}</p>
              </div>
          </div>
          <p class="text-on-surface-variant text-lg leading-relaxed max-w-2xl">
            {{ api.description || 'No description provided for this API project.' }}
          </p>
        </div>

        <div class="bg-surface-container-low rounded-3xl p-6 flex flex-col justify-center border border-outline-variant/10">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Lifecycle Status</span>
            <span 
              class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
              :class="getStatusClass(currentVersion?.status)"
            >
              {{ currentVersion?.status || 'UNKNOWN' }}
            </span>
          </div>
          <div class="space-y-2">
             <div class="flex items-center justify-between text-sm">
               <span class="text-on-surface-variant">Latest Version</span>
               <span class="font-bold text-on-surface">v{{ currentVersion?.version }}</span>
             </div>
             <div class="flex items-center justify-between text-sm">
               <span class="text-on-surface-variant">Created</span>
               <span class="text-on-surface">{{ formatDate(api.createdAt) }}</span>
             </div>
          </div>
        </div>
      </header>

      <!-- Main Tabs/Content -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <!-- Versions Sidebar -->
        <aside class="lg:col-span-1">
          <div class="flex items-center justify-between mb-4 px-2">
            <h2 class="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Versions</h2>
            <button @click="showNewVersionModal = true" class="text-primary hover:bg-primary/5 p-1 rounded-lg transition-colors" title="Create New Version">
              <span class="material-symbols-outlined">add_circle</span>
            </button>
          </div>
          <div class="space-y-2">
            <button 
              v-for="v in api.versions" 
              :key="v.id"
              @click="selectedVersion = v"
              class="w-full text-left p-4 rounded-2xl border transition-all duration-200"
              :class="selectedVersion?.id === v.id 
                ? 'bg-white border-primary shadow-sm scale-[1.02]' 
                : 'bg-surface-container-lowest border-transparent hover:border-outline-variant/30'"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold" :class="selectedVersion?.id === v.id ? 'text-primary' : 'text-on-surface'">v{{ v.version }}</span>
                <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" :class="getStatusClass(v.status)">{{ v.status }}</span>
              </div>
              <p class="text-[10px] text-on-surface-variant">{{ formatDate(v.createdAt) }}</p>
            </button>
          </div>
        </aside>

        <!-- Version Detail Area -->
        <main class="lg:col-span-3 space-y-8">
          <section v-if="selectedVersion" class="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 class="text-2xl font-bold text-on-surface">Version v{{ selectedVersion.version }}</h3>
                <p class="text-on-surface-variant text-sm mt-1">Status Management & Operations</p>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2">
                <button 
                  v-if="canSubmitForReview"
                  @click="handleStatusTransition('REVIEW')"
                  class="px-4 py-2 rounded-xl text-sm font-bold border border-primary text-primary hover:bg-primary/5 transition-all"
                >Submit for Review</button>
                
                <button 
                  v-if="canApprove"
                  @click="handleStatusTransition('APPROVED')"
                  class="px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
                >Approve Version</button>

                <button 
                  v-if="canPublish"
                  @click="handleStatusTransition('PUBLISHED')"
                  class="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                >Publish API</button>

                <button 
                  v-if="selectedVersion.status === 'DESIGN'"
                  class="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span class="material-symbols-outlined text-sm">edit</span>
                  Design Flow
                </button>
              </div>
            </div>

            <!-- Version Status Timeline/Details -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-6">
                <div class="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                   <h4 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Implementation Details</h4>
                   <div class="space-y-3">
                     <div class="flex items-center justify-between text-sm">
                       <span class="text-on-surface-variant">Version ID</span>
                       <code class="text-[11px] bg-white px-1.5 py-0.5 rounded">{{ selectedVersion.id }}</code>
                     </div>
                     <div class="flex items-center justify-between text-sm">
                       <span class="text-on-surface-variant">Last Updated</span>
                       <span class="text-on-surface font-medium">{{ formatDate(selectedVersion.updatedAt) }}</span>
                     </div>
                   </div>
                </div>
              </div>

              <div class="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                <h4 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Designer Insights</h4>
                <p class="text-sm text-on-surface-variant leading-relaxed italic">
                  "This version includes updated rate-limiting policies and new endpoints for batch processing. Ready for security review."
                </p>
              </div>
            </div>
          </section>
        </main>

      </div>

    </div>

    <!-- New Version Modal (Placeholder) -->
    <div v-if="showNewVersionModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 class="text-2xl font-bold mb-2">New Version</h2>
        <p class="text-sm text-on-surface-variant mb-6">Create a new branch from current state.</p>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Version Number (SemVer)</label>
            <input v-model="newVersionNumber" type="text" class="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. 1.0.0" />
          </div>
        </div>
        <div class="flex gap-3 mt-8">
          <button @click="showNewVersionModal = false" class="flex-1 py-3 px-6 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low transition-all">Cancel</button>
          <button class="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">Create</button>
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
import { API, APIVersion, APIStatus } from 'shared-types';

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

// RBAC
const userRole = computed(() => {
  const roles = auth.user?.resource_access?.[import.meta.env.VITE_KEYCLOAK_CLIENT_ID]?.roles || [];
  if (roles.includes('API-Admin')) return 'API_MANAGER';
  if (roles.includes('API-Manager')) return 'API_MANAGER';
  if (roles.includes('API-Designer')) return 'API_DESIGNER';
  return 'API_DEVELOPER';
});

const canSubmitForReview = computed(() => 
  selectedVersion.value?.status === 'DESIGN' && 
  (userRole.value === 'API_MANAGER' || userRole.value === 'API_DESIGNER')
);

const canApprove = computed(() => 
  selectedVersion.value?.status === 'REVIEW' && 
  userRole.value === 'API_MANAGER'
);

const canPublish = computed(() => 
  selectedVersion.value?.status === 'APPROVED' && 
  userRole.value === 'API_MANAGER'
);

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const id = route.params.id as string;
    const data = await registry.fetchApiById(id);
    api.value = data;
    if (data.versions?.length) {
      selectedVersion.value = data.versions[0];
    }
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
    // Refresh local data
    await fetchData();
  } catch (err) {
    // Handled by store
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const getStatusClass = (status?: string) => {
  switch (status) {
    case 'DESIGN': return 'bg-blue-100 text-blue-700';
    case 'REVIEW': return 'bg-amber-100 text-amber-700';
    case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
    case 'PUBLISHED': return 'bg-secondary-container/30 text-secondary';
    case 'DEPRECATED': return 'bg-orange-100 text-orange-700';
    case 'RETIRED': return 'bg-slate-100 text-slate-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};
</script>
