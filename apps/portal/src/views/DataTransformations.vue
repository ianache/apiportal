<template>
  <PageLayout
    title="Data Transformation"
    subtitle="Data Transformation"
    description="Gestión de las transformaciones de datos requeridas para las Integraciones"
  >
    <template #actions>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:opacity-90 shadow-sm"
        style="background: #0058bc; color: #ffffff;"
      >
        <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
        New Transformation
      </button>

      <!-- View Toggle -->
      <div class="flex items-center p-1 rounded-xl shadow-sm border" style="background: #f4f3f8; border-color: #e3e2e7;">
        <button
          @click="viewMode = 'table'"
          class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
          :style="viewMode === 'table'
            ? 'background: #ffffff; color: #0058bc; box-shadow: 0 1px 4px rgba(0,0,0,0.10); border: 1px solid #e3e2e7;'
            : 'color: #717786; border: 1px solid transparent;'"
        >
          <span class="material-symbols-outlined text-lg">view_list</span>
          Table
        </button>
        <button
          @click="viewMode = 'cards'"
          class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
          :style="viewMode === 'cards'
            ? 'background: #ffffff; color: #0058bc; box-shadow: 0 1px 4px rgba(0,0,0,0.10); border: 1px solid #e3e2e7;'
            : 'color: #717786; border: 1px solid transparent;'"
        >
          <span class="material-symbols-outlined text-lg">grid_view</span>
          Cards
        </button>
      </div>
    </template>

    <!-- Search Section -->
    <SearchTemplate
      :fields="searchFields"
      :search="handleSearch"
      :clear="handleClear"
    />

    <!-- Loading State -->
    <div v-if="store.loading && store.transformations.length === 0" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p class="text-slate-500 font-medium">Loading transformations...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTransformations.length === 0" class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
      <span class="material-symbols-outlined text-5xl text-slate-200 mb-4">transform</span>
      <h3 class="text-lg font-bold text-slate-900">No transformations found</h3>
      <p class="text-slate-500 mb-6">No transformations match your current search criteria.</p>
      <button
        @click="handleClear"
        class="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
      >
        Clear Filters
      </button>
    </div>

    <!-- Table View -->
    <div v-else-if="viewMode === 'table'" class="bg-white rounded-2xl border overflow-hidden shadow-sm animate-in fade-in duration-500" style="border-color: #e3e2e7;">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr style="background: #f8f9fc; border-bottom: 1px solid #e3e2e7;">
            <th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Name</th>
            <th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Description</th>
            <th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Source</th>
            <th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Target</th>
            <th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y" style="border-color: #f0f0f5;">
          <tr v-for="t in filteredTransformations" :key="t.id" class="hover:bg-slate-50/50 transition-colors group">
            <td class="px-6 py-4">
              <div class="font-bold text-slate-900">{{ t.name }}</div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">
              <span class="line-clamp-1">{{ t.description }}</span>
            </td>
            <td class="px-6 py-4">
              <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-widest">
                {{ t.source || 'N/A' }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-widest">
                {{ t.target || 'N/A' }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <router-link
                  :to="`/transformations/${t.id}/design`"
                  class="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Edit"
                >
                  <span class="material-symbols-outlined text-[20px]">edit</span>
                </router-link>
                <button
                  @click="store.deleteTransformation(t.id)"
                  class="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  title="Delete"
                >
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cards View -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in zoom-in-95 duration-500">
      <CardTemplate v-for="t in filteredTransformations" :key="t.id">
        <template #header-text>
          <h3 class="text-lg font-extrabold leading-tight text-slate-900">{{ t.name }}</h3>
          <p class="text-[10px] font-bold uppercase tracking-wider mt-1 text-slate-400">TRANSFORMATION</p>
        </template>
        
        <template #body>
          <div class="py-4 space-y-4">
            <p class="text-sm text-slate-600 line-clamp-2 min-h-[40px]">{{ t.description }}</p>
            
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source</span>
                <span class="text-xs font-bold text-blue-600">{{ t.source || 'N/A' }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</span>
                <span class="text-xs font-bold text-indigo-600">{{ t.target || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </template>

        <template #info>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px] text-slate-400">id_card</span>
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">ID: {{ t.id.split('-')[0] }}...</span>
          </div>
        </template>

        <template #actions>
          <router-link
            :to="`/transformations/${t.id}/design`"
            class="flex-1 py-3 px-4 rounded-2xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            style="background: #0069e4; color: #ffffff;"
          >
            <span class="material-symbols-outlined text-[18px]">edit</span>
            Edit
          </router-link>
          <button
            @click="store.deleteTransformation(t.id)"
            class="py-3 px-4 rounded-2xl text-sm font-bold border transition-all active:scale-95 flex items-center justify-center text-red-600 border-red-100 bg-red-50 hover:bg-red-100"
          >
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </template>
      </CardTemplate>
    </div>

    <!-- Create Transformation Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div class="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 class="text-2xl font-black text-slate-900 mb-6">New Transformation</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 text-slate-400">Name</label>
            <input
              v-model="newTransformation.name"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              placeholder="e.g. Order Mapper"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 text-slate-400">Description</label>
            <textarea
              v-model="newTransformation.description"
              rows="3"
              class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all"
              style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              placeholder="What does this transformation do?"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 text-slate-400">Organization</label>
              <select
                v-model="newTransformation.organizationId"
                class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all"
                style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              >
                <option value="">Select Org...</option>
                <option v-for="org in orgStore.organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 text-slate-400">Domain</label>
              <select
                v-model="newTransformation.domainId"
                class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all"
                style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"
              >
                <option value="">Select Domain...</option>
                <option v-for="dom in domStore.domains" :key="dom.id" :value="dom.id">{{ dom.title }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button
            @click="showCreateModal = false"
            class="flex-1 py-3 px-6 rounded-2xl font-bold text-sm transition-all active:scale-95 border hover:bg-slate-50"
            style="color: #414755;"
          >
            Cancel
          </button>
          <button
            @click="handleCreate"
            :disabled="!newTransformation.name"
            class="flex-1 py-3 px-6 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg disabled:opacity-50"
            style="background: #0058bc; color: #ffffff;"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '../components/layout/PageLayout.vue';
import CardTemplate from '../components/CardTemplate.vue';
import SearchTemplate, { type SearchField } from '../components/SearchTemplate.vue';
import { useTransformationsStore } from '../stores/transformations';
import { useOrganizationStore } from '../stores/organizations';
import { useDomainsStore } from '../stores/domains';

const router = useRouter();
const store = useTransformationsStore();
const orgStore = useOrganizationStore();
const domStore = useDomainsStore();

const viewMode = ref<'table' | 'cards'>('table');
const showCreateModal = ref(false);

const newTransformation = reactive({
  name: '',
  description: '',
  organizationId: '',
  domainId: ''
});

const handleCreate = async () => {
  if (!newTransformation.name) return;
  try {
    const created = await store.createTransformation(newTransformation);
    showCreateModal.value = false;
    // Reset form
    newTransformation.name = '';
    newTransformation.description = '';
    newTransformation.organizationId = '';
    newTransformation.domainId = '';
    // Navigate to designer
    router.push(`/transformations/${created.id}/design`);
  } catch (err) {
    console.error('Failed to create transformation', err);
  }
};

const searchFields: SearchField[] = [
  { name: 'name', label: 'Name', placeholder: 'Filter by name...' },
  { name: 'description', label: 'Description', placeholder: 'Filter by description...' },
  { name: 'source', label: 'Source', placeholder: 'Filter by source...' },
  { name: 'target', label: 'Target', placeholder: 'Filter by target...' },
];

const currentFilters = reactive({
  name: '',
  description: '',
  source: '',
  target: ''
});

const handleSearch = (values: any) => {
  currentFilters.name = values.name || '';
  currentFilters.description = values.description || '';
  currentFilters.source = values.source || '';
  currentFilters.target = values.target || '';
};

const handleClear = () => {
  currentFilters.name = '';
  currentFilters.description = '';
  currentFilters.source = '';
  currentFilters.target = '';
};

const filteredTransformations = computed(() => {
  return store.transformations.filter(t => {
    const nameMatch = !currentFilters.name || t.name.toLowerCase().includes(currentFilters.name.toLowerCase());
    const descMatch = !currentFilters.description || (t.description || '').toLowerCase().includes(currentFilters.description.toLowerCase());
    const sourceMatch = !currentFilters.source || (t.source || '').toLowerCase().includes(currentFilters.source.toLowerCase());
    const targetMatch = !currentFilters.target || (t.target || '').toLowerCase().includes(currentFilters.target.toLowerCase());
    return nameMatch && descMatch && sourceMatch && targetMatch;
  });
});

onMounted(() => {
  store.fetchTransformations();
  orgStore.fetchOrganizations();
  domStore.fetch();
});
</script>

<style scoped>
.animate-in {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}
.fade-in {
  animation-name: fadeIn;
}
.zoom-in-95 {
  animation-name: zoomIn95;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoomIn95 {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
