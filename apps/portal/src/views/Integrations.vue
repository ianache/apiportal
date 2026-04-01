<template>
  <Shell>
    <div class="p-8 max-w-7xl mx-auto" style="font-family: 'Inter', sans-serif;">

      <!-- Header -->
      <header class="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <span class="text-xs font-bold tracking-widest uppercase mb-2 block" style="color: #006e28;">Integrations Catalog</span>
          <h1 class="text-5xl font-extrabold tracking-tight" style="color: #1a1b1f;">Integrations</h1>
          <p class="mt-2 max-w-md text-sm" style="color: #414755;">
            Connect external systems, webhooks, and third-party services to your APIs.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Search -->
          <div class="relative flex items-center">
            <span class="material-symbols-outlined absolute left-3 pointer-events-none" style="color:#a0a7b5;font-size:17px;">search</span>
            <input v-model="search" type="text" placeholder="Search integrations…"
              class="pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
              style="border-color:#e3e2e7;background:#f4f3f8;color:#1a1b1f;width:200px;" />
          </div>

          <!-- View Toggle -->
          <div class="flex items-center p-1 rounded-xl" style="background:#f4f3f8;">
            <button @click="viewMode='grid'" class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
              :style="viewMode==='grid' ? 'background:#fff;color:#006e28;box-shadow:0 1px 4px rgba(0,0,0,0.10);' : 'color:#717786;'">
              <span class="material-symbols-outlined text-lg">grid_view</span>Grid
            </button>
            <button @click="viewMode='table'" class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
              :style="viewMode==='table' ? 'background:#fff;color:#006e28;box-shadow:0 1px 4px rgba(0,0,0,0.10);' : 'color:#717786;'">
              <span class="material-symbols-outlined text-lg">view_list</span>Table
            </button>
          </div>

          <!-- New Integration -->
          <button @click="openCreateModal"
            class="py-2.5 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90 active:scale-95"
            style="background:#006e28;color:#fff;box-shadow:0 4px 14px rgba(0,110,40,0.28);">
            <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span>New Integration
          </button>
        </div>
      </header>

      <!-- Domain tabs -->
      <div v-if="domainsStore.domains.length" class="flex items-center gap-2 mb-4 flex-wrap">
        <button @click="activeDomain=''" class="domain-tab" :class="{ 'domain-tab--active': activeDomain === '' }">
          <span class="material-symbols-outlined" style="font-size:15px;">layers</span>All Domains
        </button>
        <button v-for="d in domainsStore.domains" :key="d.id"
          @click="activeDomain = d.id" class="domain-tab" :class="{ 'domain-tab--active': activeDomain === d.id }">
          <span class="material-symbols-outlined" style="font-size:15px;">category</span>{{ d.title }}
        </button>
      </div>

      <!-- Status filter chips -->
      <div class="flex items-center gap-2 mb-6 flex-wrap">
        <button v-for="f in statusFilters" :key="f.value" @click="activeStatus = f.value"
          class="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          :style="activeStatus === f.value ? 'background:#006e28;color:#fff;' : 'background:#f4f3f8;color:#414755;'">
          {{ f.label }}
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="filtered.length === 0"
        class="border-2 border-dashed rounded-3xl p-20 text-center flex flex-col items-center"
        style="border-color:#c7c6d1;">
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" style="background:#f0fdf4;">
          <span class="material-symbols-outlined text-4xl" style="color:#006e28;">hub</span>
        </div>
        <h2 class="text-xl font-bold mb-2" style="color:#1a1b1f;">
          {{ hasFilters ? 'No matching integrations' : 'No integrations yet' }}
        </h2>
        <p class="mb-8 max-w-sm text-sm" style="color:#414755;">
          {{ hasFilters ? 'Try adjusting your search, domain or status filter.' : 'Connect your first external system to route, transform, and monitor API traffic.' }}
        </p>
        <button v-if="!hasFilters" @click="openCreateModal"
          class="py-2.5 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
          style="background:#006e28;color:#fff;box-shadow:0 4px 14px rgba(0,110,40,0.28);">
          <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span>Create First Integration
        </button>
      </div>

      <!-- ── Grid View ── -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="item in filtered" :key="item.id"
          class="group rounded-2xl border p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1"
          style="background:#fff;border-color:#e3e2e7;box-shadow:0 1px 4px rgba(0,0,0,0.06);"
          @click="router.push('/integrations/' + item.id + '/design')">

          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background:#f0fdf4;">
              <span class="material-symbols-outlined text-2xl" style="color:#006e28;font-variation-settings:'FILL' 1;">{{ item.icon }}</span>
            </div>
            <span class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full" :style="getStatusStyle(item.status)">{{ item.status }}</span>
          </div>

          <!-- Domain badge -->
          <div v-if="item.domainId" class="flex items-center gap-1 mb-2">
            <span class="material-symbols-outlined" style="font-size:13px;color:#0058bc;">category</span>
            <span class="text-[11px] font-semibold" style="color:#0058bc;">{{ domainTitle(item.domainId) }}</span>
          </div>

          <h3 class="text-base font-bold mb-1" style="color:#1a1b1f;">{{ item.name }}</h3>
          <p class="text-xs font-semibold mb-1" style="color:#a0a7b5;">{{ item.type }}</p>
          <p class="text-sm leading-relaxed line-clamp-2 mb-5" style="color:#414755;">{{ item.description }}</p>

          <div class="pt-4 border-t flex items-center justify-between" style="border-color:#e3e2e7;">
            <span class="text-xs font-semibold flex items-center gap-1" style="color:#717786;">
              <span class="material-symbols-outlined" style="font-size:14px;">link</span>
              {{ item.linkedApis }} API{{ item.linkedApis !== 1 ? 's' : '' }}
            </span>
            <span class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity group-hover:opacity-80" style="background:#f0fdf4;color:#006e28;">
              <span class="material-symbols-outlined" style="font-size:15px;">tune</span>Configure
            </span>
          </div>
        </div>
      </div>

      <!-- ── Table View ── -->
      <div v-else class="overflow-hidden rounded-2xl border" style="background:#fff;border-color:#e3e2e7;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr style="background:#f4f3f8;border-bottom:1px solid #e3e2e7;">
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color:#414755;">Integration</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color:#414755;">Domain</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color:#414755;">Type</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color:#414755;">Status</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color:#414755;">APIs</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider" style="color:#414755;">Updated</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right" style="color:#414755;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filtered" :key="item.id"
              class="transition-colors cursor-pointer border-t hover:bg-gray-50" style="border-color:#e3e2e7;"
              @click="router.push('/integrations/' + item.id + '/design')">
              <td class="px-6 py-4 font-semibold" style="color:#1a1b1f;">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:#f0fdf4;">
                    <span class="material-symbols-outlined" style="color:#006e28;font-size:16px;">{{ item.icon }}</span>
                  </div>
                  {{ item.name }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm">
                <span v-if="item.domainId" class="flex items-center gap-1" style="color:#0058bc;">
                  <span class="material-symbols-outlined" style="font-size:14px;">category</span>
                  {{ domainTitle(item.domainId) }}
                </span>
                <span v-else style="color:#c7c6d1;">—</span>
              </td>
              <td class="px-6 py-4 text-sm" style="color:#414755;">{{ item.type }}</td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full inline-block" :style="getStatusStyle(item.status)">{{ item.status }}</span>
              </td>
              <td class="px-6 py-4 text-sm font-medium" style="color:#414755;">{{ item.linkedApis }}</td>
              <td class="px-6 py-4 text-sm" style="color:#414755;">{{ formatDate(item.updatedAt) }}</td>
              <td class="px-6 py-4 text-right">
                <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80" style="background:#f0fdf4;color:#006e28;">
                  <span class="material-symbols-outlined" style="font-size:15px;">open_in_new</span>Open
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- ── Create Modal ── -->
    <div v-if="showCreateModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background:rgba(26,27,31,0.55);backdrop-filter:blur(4px);">
      <div class="rounded-3xl w-full max-w-lg p-8 shadow-2xl" style="background:#fff;">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold" style="color:#1a1b1f;">New Integration</h2>
            <p class="text-sm mt-1" style="color:#717786;">Connect an external system to your APIs.</p>
          </div>
          <button @click="showCreateModal = false" class="p-1.5 rounded-full hover:bg-gray-100 ml-4" style="color:#717786;">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="modal-label">Name <span style="color:#991b1b;">*</span></label>
            <input v-model="newItem.name" type="text" class="modal-input" placeholder="e.g. Stripe Webhook" />
          </div>
          <div>
            <label class="modal-label">Domain</label>
            <select v-model="newItem.domainId" class="modal-input">
              <option value="">— No domain —</option>
              <option v-for="d in domainsStore.domains" :key="d.id" :value="d.id">{{ d.title }}</option>
            </select>
            <p v-if="!domainsStore.domains.length" class="modal-hint">
              No domains configured.
              <router-link to="/settings/domains" class="underline" style="color:#0058bc;">Create one in Settings → Domains</router-link>.
            </p>
          </div>
          <div>
            <label class="modal-label">Type</label>
            <select v-model="newItem.type" class="modal-input">
              <option v-for="t in integrationTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label class="modal-label">Description</label>
            <textarea v-model="newItem.description" class="modal-input" rows="3" style="resize:none;" placeholder="Describe what this integration does…" />
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button @click="showCreateModal = false"
            class="flex-1 py-3 px-6 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2 border"
            style="color:#414755;border-color:#e3e2e7;">
            <span class="material-symbols-outlined text-base">close</span>Cancel
          </button>
          <button @click="handleCreate" :disabled="!newItem.name"
            class="flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            :style="newItem.name ? 'background:#006e28;color:#fff;box-shadow:0 4px 14px rgba(0,110,40,0.28);' : 'background:#006e28;color:#fff;opacity:0.4;cursor:not-allowed;'">
            <span class="material-symbols-outlined text-base">hub</span>Create Integration
          </button>
        </div>
      </div>
    </div>

  </Shell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import { useDomainsStore } from '../stores/domains';
import { useIntegrationsStore } from '../stores/integrations';
import type { IntegrationStatus } from '../stores/integrations';

const integrationTypes = ['Webhook', 'REST Connector', 'Message Queue', 'Event Stream', 'Data Pipeline', 'Auth Provider'];
const router            = useRouter();
const domainsStore      = useDomainsStore();
const store             = useIntegrationsStore();

onMounted(() => { domainsStore.fetch(); store.fetch(); });

// ── State ────────────────────────────────────────────
const viewMode        = ref<'grid' | 'table'>('grid');
const search          = ref('');
const activeDomain    = ref('');
const activeStatus    = ref('all');
const showCreateModal = ref(false);
const newItem         = ref({ name: '', type: integrationTypes[0], description: '', domainId: '' });

const statusFilters = [
  { label: 'All',      value: 'all'      },
  { label: 'Active',   value: 'ACTIVE'   },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Draft',    value: 'DRAFT'    },
  { label: 'Error',    value: 'ERROR'    },
];

const hasFilters = computed(() => !!search.value.trim() || activeDomain.value !== '' || activeStatus.value !== 'all');

const filtered = computed(() => {
  let list = store.integrations;
  if (activeDomain.value)           list = list.filter(i => i.domainId === activeDomain.value);
  if (activeStatus.value !== 'all') list = list.filter(i => i.status   === activeStatus.value);
  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = list.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.type.toLowerCase().includes(q) ||
      (i.description ?? '').toLowerCase().includes(q) ||
      (i.domain?.title ?? '').toLowerCase().includes(q) ||
      (domainsStore.byId(i.domainId ?? '')?.labels ?? []).some(l => l.toLowerCase().includes(q))
    );
  }
  return list;
});

function domainTitle(id: string | null) {
  return id ? (domainsStore.byId(id)?.title ?? '') : '';
}

function openCreateModal() {
  newItem.value = { name: '', type: integrationTypes[0], description: '', domainId: activeDomain.value };
  showCreateModal.value = true;
}

const iconMap: Record<string, string> = {
  'Webhook': 'webhook', 'REST Connector': 'api', 'Message Queue': 'queue',
  'Event Stream': 'stream', 'Data Pipeline': 'schema', 'Auth Provider': 'lock',
};

async function handleCreate() {
  if (!newItem.value.name.trim()) return;
  await store.create({
    name:        newItem.value.name,
    type:        newItem.value.type,
    description: newItem.value.description,
    domainId:    newItem.value.domainId || null,
    status:      'DRAFT',
    icon:        iconMap[newItem.value.type] ?? 'hub',
    linkedApis:  0,
  });
  showCreateModal.value = false;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const getStatusStyle = (status: IntegrationStatus): Record<string, string> => {
  switch (status) {
    case 'ACTIVE':   return { background: '#dcfce7', color: '#166534' };
    case 'INACTIVE': return { background: '#f1f5f9', color: '#334155' };
    case 'DRAFT':    return { background: '#dbeafe', color: '#1e40af' };
    case 'ERROR':    return { background: '#fee2e2', color: '#991b1b' };
    default:         return { background: '#f1f5f9', color: '#334155' };
  }
};
</script>

<style scoped>
.domain-tab {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
  background: #f4f3f8; color: #414755; border: 1.5px solid transparent;
  cursor: pointer; transition: all 0.12s; font-family: 'Inter', sans-serif;
}
.domain-tab:hover { background: #fff; color: #006e28; border-color: #006e28; }
.domain-tab--active { background: #f0fdf4; color: #006e28; border-color: #006e28; }

.modal-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #414755; margin-bottom: 6px; margin-left: 2px; }
.modal-hint  { font-size: 11px; color: #a0a7b5; margin-top: 4px; }
.modal-input {
  width: 100%; padding: 10px 14px; border: 1px solid #e3e2e7; border-radius: 12px;
  font-size: 13px; font-family: 'Inter', sans-serif; color: #1a1b1f; background: #f4f3f8;
  outline: none; box-sizing: border-box; transition: border-color 0.15s;
}
.modal-input:focus { border-color: #006e28; background: #fff; }
</style>
