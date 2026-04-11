<template>
  <Shell>
    <div class="p-8 max-w-7xl mx-auto" style="font-family: 'Inter', sans-serif;">

      <!-- Header -->
      <header class="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
        <div>
          <span class="text-xs font-bold tracking-widest uppercase mb-2 block" style="color: #0058bc;">Explorer</span>
          <h1 class="text-4xl font-extrabold tracking-tight" style="color: #1a1b1f;">API Explorer</h1>
          <p class="mt-2 max-w-md text-sm" style="color: #414755;">
            Search and explore APIs by domain, label, name, and status.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- View Toggle -->
          <div class="flex items-center p-1 rounded-xl" style="background: #f4f3f8;">
            <button
              @click="viewMode = 'grid'"
              class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
              :style="viewMode === 'grid'
                ? 'background: #ffffff; color: #0058bc; box-shadow: 0 1px 4px rgba(0,0,0,0.10);'
                : 'color: #717786;'"
            >
              <span class="material-symbols-outlined text-lg">grid_view</span>
              Grid
            </button>
            <button
              @click="viewMode = 'table'"
              class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
              :style="viewMode === 'table'
                ? 'background: #ffffff; color: #0058bc; box-shadow: 0 1px 4px rgba(0,0,0,0.10);'
                : 'color: #717786;'"
            >
              <span class="material-symbols-outlined text-lg">view_list</span>
              Table
            </button>
          </div>
        </div>
      </header>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border p-6 mb-8" style="border-color: #e3e2e7; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Domain Filter -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5" style="color: #414755;">
              Domain
            </label>
            <select
              v-model="filters.domainId"
              class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
            >
              <option value="">All Domains</option>
              <option v-for="d in domainsStore.domains" :key="d.id" :value="d.id">{{ d.title }}</option>
            </select>
          </div>

          <!-- Label Filter -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5" style="color: #414755;">
              Label
            </label>
            <input
              v-model="filters.label"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              placeholder="Filter by label..."
            />
          </div>

          <!-- Name Filter -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5" style="color: #414755;">
              API Name
            </label>
            <input
              v-model="filters.name"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              placeholder="Filter by name..."
            />
</div>

            <!-- Status Filter -->
            <div class="flex items-end gap-3">
              <div v-if="isManagerOrDesigner" class="flex-1">
                <label class="block text-xs font-bold uppercase tracking-widest mb-1.5" style="color: #414755;">
                  Status
                </label>
                <div class="relative">
                  <button
                    type="button"
                    @click="statusDropdownOpen = !statusDropdownOpen"
                    class="w-full px-4 py-2.5 rounded-xl text-sm text-left border flex items-center justify-between transition-all"
                    style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
                  >
                    <span v-if="filters.statuses.length > 0">{{ filters.statuses.join(', ') }}</span>
                    <span v-else style="color: #717786;">Select status...</span>
                    <span class="material-symbols-outlined transition-transform" :class="statusDropdownOpen ? 'rotate-180' : ''" style="font-size: 18px;">expand_more</span>
                  </button>
                  <div
                    v-if="statusDropdownOpen"
                    class="absolute z-10 w-full mt-1 py-1 rounded-xl border"
                    style="background: #ffffff; border-color: #e3e2e7; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
                  >
                    <label
                      v-for="status in availableStatuses"
                      :key="status"
                      class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        :value="status"
                        :checked="filters.statuses.includes(status)"
                        @change="toggleStatus(status)"
                        class="w-4 h-4 rounded accent-blue-600"
                      />
                      <span class="text-sm font-medium" :style="getStatusStyle(status).color">{{ status }}</span>
                    </label>
                  </div>
                </div>
              </div>
              <div v-else-if="isDeveloper" class="flex-1">
                <label class="block text-xs font-bold uppercase tracking-widest mb-1.5" style="color: #414755;">
                  Status
                </label>
                <div class="px-4 py-2.5 rounded-xl text-sm font-semibold" style="background: #e0f2fe; color: #075985;">
                  PUBLISHED
                </div>
                <p class="text-xs mt-1" style="color: #717786;">Only published APIs visible</p>
              </div>
              <button
                @click="executeSearch"
                :disabled="!hasActiveFilters"
                class="px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
                :style="hasActiveFilters
                  ? 'background: #0058bc; color: #ffffff; cursor: pointer;'
                  : 'background: #e3e2e7; color: #717786; cursor: not-allowed;'"
              >
                <span class="material-symbols-outlined" style="font-size: 18px;">search</span>
                Search
              </button>
            </div>
          </div>

        <!-- Active Filters Display -->
        <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t flex items-center gap-2" style="border-color: #e3e2e7;">
          <span class="text-xs font-medium" style="color: #717786;">Active filters:</span>
          <span
            v-if="filters.domainId"
            class="px-2 py-1 rounded-lg text-xs font-semibold"
            style="background: #f3e8ff; color: #7c3aed;"
          >
            Domain: {{ getDomainName(filters.domainId) }}
          </span>
          <span
            v-if="filters.label"
            class="px-2 py-1 rounded-lg text-xs font-semibold"
            style="background: #e0e7ff; color: #0058bc;"
          >
            Label: {{ filters.label }}
          </span>
          <span
            v-if="filters.name"
            class="px-2 py-1 rounded-lg text-xs font-semibold"
            style="background: #e0e7ff; color: #0058bc;"
          >
            Name: {{ filters.name }}
          </span>
          <span
            v-if="filteredStatuses.length > 0"
            class="px-2 py-1 rounded-lg text-xs font-semibold"
            style="background: #dcfce7; color: #166534;"
          >
            Status: {{ filteredStatuses.join(', ') }}
          </span>
          <button
            @click="clearFilters"
            class="ml-auto text-xs font-semibold flex items-center gap-1 hover:opacity-80"
            style="color: #991b1b;"
          >
            <span class="material-symbols-outlined" style="font-size: 14px;">clear</span>
            Clear All
          </button>
        </div>
      </div>

      <!-- Results Count -->
      <div v-if="hasSearched" class="mb-4 flex items-center justify-between">
        <span class="text-sm font-medium" style="color: #414755;">
          {{ filteredApis.length }} API{{ filteredApis.length !== 1 ? 's' : '' }} found
        </span>
      </div>

      <!-- Loading -->
      <div v-if="registry.loading" class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl" style="color: #0058bc;">progress_activity</span>
        <p class="mt-4 font-medium" style="color: #414755;">Loading APIs...</p>
      </div>

      <!-- Empty State - No Search Yet -->
      <div
        v-else-if="!hasSearched"
        class="border-2 border-dashed rounded-3xl p-20 text-center flex flex-col items-center"
        style="border-color: #c7c6d1;"
      >
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" style="background: #f4f3f8;">
          <span class="material-symbols-outlined text-4xl" style="color: #717786;">search</span>
        </div>
        <h2 class="text-xl font-bold mb-2" style="color: #1a1b1f;">Search for APIs</h2>
        <p class="mb-8 max-w-sm text-sm" style="color: #414755;">
          Apply at least one filter and click Search to find APIs.
        </p>
      </div>

      <!-- Empty Results - No Match -->
      <div
        v-else-if="filteredApis.length === 0"
        class="border-2 border-dashed rounded-3xl p-20 text-center flex flex-col items-center"
        style="border-color: #c7c6d1;"
      >
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" style="background: #f4f3f8;">
          <span class="material-symbols-outlined text-4xl" style="color: #717786;">search_off</span>
        </div>
        <h2 class="text-xl font-bold mb-2" style="color: #1a1b1f;">No APIs found</h2>
        <p class="mb-8 max-w-sm text-sm" style="color: #414755;">
          Try adjusting your filters to find the APIs you're looking for.
        </p>
        <button
          @click="clearFilters"
          class="py-2.5 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90 active:scale-95"
          style="background: #f4f3f8; color: #414755; border: 1px solid #e3e2e7;"
        >
          <span class="material-symbols-outlined" style="font-size: 18px;">clear</span>
          Clear Filters
        </button>
      </div>

      <!-- ── Grid View ──────────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="api in filteredApis"
          :key="api.id"
          class="group rounded-2xl border p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1"
          style="background: #ffffff; border-color: #e3e2e7; box-shadow: 0 1px 4px rgba(0,0,0,0.06);"
          @click="navigateToDetail(api.id)"
        >
          <!-- Card header -->
          <div class="flex justify-between items-start mb-5">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: #eff4ff;">
              <span
                class="material-symbols-outlined text-2xl"
                style="color: #0058bc; font-variation-settings: 'FILL' 1;"
              >api</span>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span
                class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                :style="getStatusStyle(api.versions?.[0]?.status)"
              >
                {{ api.versions?.[0]?.status || 'N/A' }}
              </span>
              <span
                v-if="getDomainName(api.domainId)"
                class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                style="background: #f3e8ff; color: #7c3aed;"
              >
                {{ getDomainName(api.domainId) }}
              </span>
            </div>
          </div>

          <!-- Card body -->
          <h3 class="text-base font-bold mb-1.5" style="color: #1a1b1f;">{{ api.name }}</h3>
          <p class="text-sm leading-relaxed line-clamp-2 mb-3" style="color: #414755;">
            {{ api.description || 'No description provided.' }}
          </p>
          
          <!-- Labels -->
          <div v-if="api.label" class="mb-4">
            <span class="px-2 py-1 text-[10px] font-semibold rounded-lg" style="background: #e0e7ff; color: #0058bc;">
              {{ api.label }}
            </span>
          </div>

          <!-- Card footer -->
          <div class="pt-4 border-t flex items-center justify-between" style="border-color: #e3e2e7;">
            <span class="text-xs font-semibold flex items-center gap-1" style="color: #717786;">
              <span class="material-symbols-outlined" style="font-size: 14px;">tag</span>
              v{{ api.versions?.[0]?.version || '0.0.0' }}
            </span>
            <div class="flex items-center gap-2">
              <span
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity group-hover:opacity-80 cursor-pointer"
                style="background: #f0fdf4; color: #15803d;"
                @click.stop="navigateToSpec(api.id, api.versions?.[0]?.version)"
              >
                <span class="material-symbols-outlined" style="font-size: 15px;">book</span>
                View Spec
              </span>
              <span
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity group-hover:opacity-80"
                style="background: #eff4ff; color: #0058bc;"
              >
                <span class="material-symbols-outlined" style="font-size: 15px;">tune</span>
                Manage
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Table View ─────────────────────────────────────────────────── -->
      <div
        v-else
        class="overflow-hidden rounded-2xl border"
        style="background: #ffffff; border-color: #e3e2e7; box-shadow: 0 1px 4px rgba(0,0,0,0.06);"
      >
        <table class="w-full text-left border-collapse">
          <thead>
            <tr style="background: #f4f3f8; border-bottom: 1px solid #e3e2e7;">
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">API Name</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">Domain</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">Label</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">Latest Version</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">Status</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color: #414755;">Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="api in filteredApis"
              :key="api.id"
              class="transition-colors cursor-pointer border-t hover:bg-gray-50"
              style="border-color: #e3e2e7;"
              @click="navigateToDetail(api.id)"
            >
              <td class="px-6 py-4 font-semibold" style="color: #1a1b1f;">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background: #eff4ff;">
                    <span class="material-symbols-outlined" style="color: #0058bc; font-size: 16px;">api</span>
                  </div>
                  {{ api.name }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="getDomainName(api.domainId)"
                  class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full inline-block"
                  style="background: #f3e8ff; color: #7c3aed;"
                >
                  {{ getDomainName(api.domainId) }}
                </span>
                <span v-else class="text-sm" style="color: #717786;">—</span>
              </td>
              <td class="px-6 py-4">
                <span v-if="api.label" class="px-2 py-1 text-[10px] font-semibold rounded-lg" style="background: #e0e7ff; color: #0058bc;">
                  {{ api.label }}
                </span>
                <span v-else class="text-sm" style="color: #717786;">—</span>
              </td>
              <td class="px-6 py-4 text-sm font-medium" style="color: #414755;">
                v{{ api.versions?.[0]?.version || '0.0.0' }}
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full inline-block"
                  :style="getStatusStyle(api.versions?.[0]?.status)"
                >
                  {{ api.versions?.[0]?.status || 'N/A' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm" style="color: #414755;">{{ formatDate(api.updatedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </Shell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import { useRegistryStore } from '../stores/registry';
import { useDomainsStore } from '../stores/domains';
import { useAuthStore } from '../stores/auth';

const registry = useRegistryStore();
const domainsStore = useDomainsStore();
const authStore = useAuthStore();
const router = useRouter();

const viewMode = ref<'grid' | 'table'>('grid');
const hasSearched = ref(false);
const statusDropdownOpen = ref(false);

const filters = ref({
  domainId: '',
  label: '',
  name: '',
  statuses: ['PUBLISHED'] as string[]
});

const availableStatuses = ['DESIGN', 'REVIEW', 'APPROVED', 'PUBLISHED', 'DEPRECATED', 'RETIRED'];

const isManagerOrDesigner = computed(() => {
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'nexus-portal';
  const roles = authStore.user?.resource_access?.[clientId]?.roles || [];
  return roles.includes('API-Manager') || roles.includes('API-Designer') || roles.includes('API-Admin');
});

const isDeveloper = computed(() => {
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'nexus-portal';
  const roles = authStore.user?.resource_access?.[clientId]?.roles || [];
  return roles.includes('API-Developer') && !roles.includes('API-Manager') && !roles.includes('API-Designer') && !roles.includes('API-Admin');
});

const filteredStatuses = computed(() => {
  return isManagerOrDesigner.value ? filters.value.statuses : ['PUBLISHED'];
});

const hasActiveFilters = computed(() => {
  return filters.value.domainId || filters.value.label || filters.value.name || filteredStatuses.value.length > 0;
});

const filteredApis = computed(() => {
  if (!hasSearched.value) return [];
  
  return registry.apis.filter(api => {
    // Domain filter
    if (filters.value.domainId && api.domainId !== filters.value.domainId) {
      return false;
    }
    
    // Label filter
    if (filters.value.label && !(api.label?.toLowerCase().includes(filters.value.label.toLowerCase()))) {
      return false;
    }
    
    // Name filter
    if (filters.value.name && !(api.name?.toLowerCase().includes(filters.value.name.toLowerCase()))) {
      return false;
    }
    
    // Status filter
    if (filteredStatuses.value.length > 0) {
      const apiStatus = api.versions?.[0]?.status;
      if (!apiStatus || !filteredStatuses.value.includes(apiStatus)) {
        return false;
      }
    }
    
    return true;
  });
});

const executeSearch = () => {
  if (hasActiveFilters.value) {
    hasSearched.value = true;
  }
  registry.fetchApis();
};

onMounted(() => {
  domainsStore.fetch();
});

const toggleStatus = (status: string) => {
  const index = filters.value.statuses.indexOf(status);
  if (index === -1) {
    filters.value.statuses.push(status);
  } else {
    filters.value.statuses.splice(index, 1);
  }
};

const clearFilters = () => {
  filters.value = {
    domainId: '',
    label: '',
    name: '',
    statuses: ['PUBLISHED']
  };
  hasSearched.value = false;
};

const getDomainName = (domainId: string | undefined): string => {
  if (!domainId) return '';
  const domain = domainsStore.domains.find(d => d.id === domainId);
  return domain?.title || '';
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const navigateToDetail = (id: string) => { router.push(`/projects/${id}`); };

const navigateToSpec = (id: string, version?: string) => {
  router.push(`/explorer/${id}/spec${version ? `/${version}` : ''}`);
};

const getStatusStyle = (status: string | undefined): Record<string, string> => {
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