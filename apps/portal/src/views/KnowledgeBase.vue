<template>
  <Shell>
    <div class="p-8 max-w-5xl mx-auto w-full" style="font-family:'Inter',sans-serif;">

      <!-- Header -->
      <header class="flex items-center gap-4 mb-8">
        <button @click="router.push('/domains')" class="toolbar-btn">
          <span class="material-symbols-outlined" style="font-size:18px;">arrow_back</span>
        </button>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:#eff6ff;">
            <span class="material-symbols-outlined" style="font-size:20px;color:#0058bc;">psychology</span>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-widest" style="color:#0058bc;">Knowledge Base</p>
            <h1 class="text-2xl font-bold" style="color:#1a1b1f;">{{ domainTitle }}</h1>
          </div>
        </div>
      </header>

      <!-- Search Bar -->
      <div class="mb-6">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style="font-size:20px;color:#717786;">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search knowledge base..."
            class="w-full pl-12 pr-4 py-3.5 rounded-2xl border text-sm outline-none transition-all"
            style="background:#fff;border-color:#e3e2e7;color:#1a1b1f;"
            @keydown.enter="executeSearch"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
          >
            <span class="material-symbols-outlined" style="font-size:18px;color:#717786;">close</span>
          </button>
        </div>
      </div>

      <!-- Type Filter & Add Button -->
      <div class="mb-6 flex items-center gap-4">
        <div class="flex items-center gap-2 flex-1">
          <label class="text-sm font-medium" style="color:#414755;">Filter by type:</label>
          <select
            v-model="filterTypeId"
            class="px-3 py-2 rounded-xl border text-sm outline-none"
            style="background:#fff;border-color:#e3e2e7;color:#1a1b1f;"
          >
            <option value="">All types</option>
            <option v-for="t in knowledgeTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <button
            @click="executeSearch"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style="background:#0058bc;color:#fff;"
          >
            Search
          </button>
        </div>
        <button
          @click="openAddPanel"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style="background:#0058bc;color:#fff;"
        >
          <span class="material-symbols-outlined" style="font-size:18px;">add</span>
          Add Knowledge
        </button>
        <button
          @click="showTypeManager = true"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border"
          style="background:#fff;color:#414755;border-color:#e3e2e7;"
        >
          <span class="material-symbols-outlined" style="font-size:18px;">settings</span>
          Manage Types
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-16">
        <span class="material-symbols-outlined animate-spin text-4xl" style="color:#0058bc;">progress_activity</span>
        <p class="mt-4 font-medium" style="color:#414755;">Searching knowledge base...</p>
      </div>

      <!-- Empty State - No Search -->
      <div
        v-else-if="!hasSearched"
        class="border-2 border-dashed rounded-3xl p-16 text-center"
        style="border-color:#c7c6d1;"
      >
        <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" style="background:#f4f3f8;">
          <span class="material-symbols-outlined text-3xl" style="color:#717786;">search</span>
        </div>
        <h2 class="text-lg font-bold mb-2" style="color:#1a1b1f;">Search the Knowledge Base</h2>
        <p class="text-sm max-w-sm mx-auto" style="color:#414755;">
          Enter a query to search for relevant knowledge pieces.
        </p>
      </div>

      <!-- No Results -->
      <div
        v-else-if="results.length === 0"
        class="border-2 border-dashed rounded-3xl p-16 text-center"
        style="border-color:#c7c6d1;"
      >
        <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" style="background:#f4f3f8;">
          <span class="material-symbols-outlined text-3xl" style="color:#717786;">search_off</span>
        </div>
        <h2 class="text-lg font-bold mb-2" style="color:#1a1b1f;">No results found</h2>
        <p class="text-sm max-w-sm mx-auto" style="color:#414755;">
          Try different keywords or add new knowledge to the base.
        </p>
      </div>

      <!-- Search Results - Google Style -->
      <div v-else class="space-y-4">
        <p class="text-sm" style="color:#717786;">
          {{ results.length }} result{{ results.length !== 1 ? 's' : '' }} found
        </p>

        <div
          v-for="result in results"
          :key="result.id"
          class="result-card"
          @click="selectResult(result)"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style="background:#eff6ff;">
              <span class="material-symbols-outlined text-sm" style="color:#0058bc;">description</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="result-title">{{ result.title }}</h3>
                <span class="type-badge">{{ result.typeName }}</span>
              </div>
              <p class="result-snippet">{{ result.content }}</p>
              <div v-if="result.metadata && Object.keys(result.metadata).length > 0" class="flex flex-wrap gap-2 mt-2">
                <span
                  v-for="(value, key) in result.metadata"
                  :key="key"
                  class="result-meta"
                >
                  {{ key }}: {{ value }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Add Knowledge Panel -->
    <div v-if="showAddPanel" class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background:rgba(26,27,31,0.55);backdrop-filter:blur(4px);">
      <div class="rounded-3xl w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto" style="background:#fff;">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold" style="color:#1a1b1f;">Add Knowledge</h2>
            <p class="text-sm mt-1" style="color:#717786;">Add a new piece of knowledge to the base.</p>
          </div>
          <button @click="closeAddPanel" class="p-1.5 rounded-full hover:bg-gray-100" style="color:#717786;">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Type Selection -->
          <div>
            <label class="field-label">Type <span style="color:#991b1b;">*</span></label>
            <select
              v-model="newKnowledge.typeId"
              class="field-input"
              @change="onTypeChange"
            >
              <option value="">Select a type...</option>
              <option v-for="t in knowledgeTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>

          <!-- Title -->
          <div>
            <label class="field-label">Title <span style="color:#991b1b;">*</span></label>
            <input v-model="newKnowledge.title" type="text" class="field-input" placeholder="Knowledge title..." />
          </div>

          <!-- Content -->
          <div>
            <label class="field-label">Content <span style="color:#991b1b;">*</span></label>
            <textarea v-model="newKnowledge.content" class="field-input field-textarea" rows="4" placeholder="Describe this knowledge piece..." />
          </div>

          <!-- Dynamic Metadata Fields -->
          <div v-if="selectedTypeFields.length > 0">
            <label class="field-label">Metadata</label>
            <div class="space-y-3">
              <div v-for="(field, index) in selectedTypeFields" :key="index">
                <label class="text-xs font-medium mb-1 block" style="color:#414755;">
                  {{ field.name }}
                  <span v-if="field.required" style="color:#991b1b;">*</span>
                  <span class="ml-2 text-[10px] px-1.5 py-0.5 rounded" style="background:#f4f3f8;color:#717786;">{{ field.type }}</span>
                </label>
                
                <!-- String input -->
                <input
                  v-if="field.type === 'string'"
                  v-model="newKnowledge.metadata[field.name]"
                  type="text"
                  class="field-input"
                  :placeholder="`Enter ${field.name.toLowerCase()}...`"
                />

                <!-- Integer input -->
                <input
                  v-else-if="field.type === 'integer'"
                  v-model="newKnowledge.metadata[field.name]"
                  type="number"
                  class="field-input"
                  :placeholder="`Enter ${field.name.toLowerCase()}...`"
                />

                <!-- Date input -->
                <input
                  v-else-if="field.type === 'date'"
                  v-model="newKnowledge.metadata[field.name]"
                  type="date"
                  class="field-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button @click="closeAddPanel" class="flex-1 py-3 px-6 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2 border" style="color:#414755;border-color:#e3e2e7;">
            Cancel
          </button>
          <button
            @click="submitKnowledge"
            :disabled="!isValidNewKnowledge"
            class="flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            :style="isValidNewKnowledge
              ? 'background:#0058bc;color:#fff;'
              : 'background:#0058bc;color:#fff;opacity:0.4;cursor:not-allowed;'"
          >
            <span class="material-symbols-outlined text-base">add_circle</span>
            Add Knowledge
          </button>
        </div>
      </div>
    </div>

    <!-- Knowledge Detail Panel -->
    <div v-if="selectedKnowledge" class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background:rgba(26,27,31,0.55);backdrop-filter:blur(4px);">
      <div class="rounded-3xl w-full max-w-lg p-8 shadow-2xl" style="background:#fff;">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:#eff6ff;">
              <span class="material-symbols-outlined" style="font-size:20px;color:#0058bc;">description</span>
            </div>
            <div>
              <h2 class="text-xl font-bold" style="color:#1a1b1f;">{{ selectedKnowledge.title }}</h2>
              <p class="text-xs" style="color:#717786;">{{ selectedKnowledge.typeName }}</p>
            </div>
          </div>
          <button @click="selectedKnowledge = null" class="p-1.5 rounded-full hover:bg-gray-100" style="color:#717786;">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <p class="text-sm leading-relaxed mb-4" style="color:#414755;">{{ selectedKnowledge.content }}</p>

        <div v-if="selectedKnowledge.metadata && Object.keys(selectedKnowledge.metadata).length > 0" class="mb-4">
          <p class="text-xs font-bold uppercase tracking-wider mb-2" style="color:#414755;">Metadata</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(value, key) in selectedKnowledge.metadata"
              :key="key"
              class="result-meta"
            >
              {{ key }}: {{ value }}
            </span>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="deleteKnowledge(selectedKnowledge.id)" class="flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border hover:bg-gray-50" style="color:#991b1b;border-color:#fecaca;">
            <span class="material-symbols-outlined">delete</span>
            Delete
          </button>
          <button @click="selectedKnowledge = null" class="flex-1 py-2.5 rounded-xl font-bold" style="background:#0058bc;color:#fff;">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Type Manager Modal -->
    <div v-if="showTypeManager" class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background:rgba(26,27,31,0.55);backdrop-filter:blur(4px);">
      <div class="rounded-3xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto" style="background:#fff;">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold" style="color:#1a1b1f;">Manage Knowledge Types</h2>
            <p class="text-sm mt-1" style="color:#717786;">Define types and their metadata fields.</p>
          </div>
          <button @click="showTypeManager = false" class="p-1.5 rounded-full hover:bg-gray-100" style="color:#717786;">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Existing Types List -->
        <div class="mb-6">
          <h3 class="text-sm font-bold mb-3" style="color:#414755;">Existing Types</h3>
          <div class="space-y-2">
            <div
              v-for="type in knowledgeTypes"
              :key="type.id"
              class="flex items-center justify-between p-3 rounded-xl border"
              style="border-color:#e3e2e7;background:#faf9fe;"
            >
              <div>
                <p class="font-semibold" style="color:#1a1b1f;">{{ type.name }}</p>
                <p class="text-xs" style="color:#717786;">{{ type.fields.length }} fields</p>
              </div>
              <div class="flex gap-2">
                <button @click="editType(type)" class="p-2 rounded-lg hover:bg-gray-100" style="color:#0058bc;">
                  <span class="material-symbols-outlined" style="font-size:18px;">edit</span>
                </button>
                <button @click="deleteType(type.id)" class="p-2 rounded-lg hover:bg-gray-100" style="color:#991b1b;">
                  <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
                </button>
              </div>
            </div>
            <p v-if="knowledgeTypes.length === 0" class="text-sm text-center py-4" style="color:#717786;">
              No types defined yet.
            </p>
          </div>
        </div>

        <!-- Add/Edit Type Form -->
        <div class="border-t pt-6" style="border-color:#e3e2e7;">
          <h3 class="text-sm font-bold mb-3" style="color:#414755;">{{ editingType ? 'Edit Type' : 'Add New Type' }}</h3>
          
          <div class="space-y-4">
            <div>
              <label class="field-label">Type Name <span style="color:#991b1b;">*</span></label>
              <input v-model="typeForm.name" type="text" class="field-input" placeholder="e.g. Technical Spec" />
            </div>
            <div>
              <label class="field-label">Description</label>
              <input v-model="typeForm.description" type="text" class="field-input" placeholder="Optional description..." />
            </div>
            
            <!-- Fields -->
            <div>
              <label class="field-label">Metadata Fields</label>
              <div class="space-y-3">
                <div v-for="(field, index) in typeForm.fields" :key="index" class="field-row">
                  <div class="field-row-grid">
                    <div class="field-name-col">
                      <input v-model="field.name" type="text" class="field-input" placeholder="Field name" />
                    </div>
                    <div class="field-type-col">
                      <select v-model="field.type" class="field-input">
                        <option value="string">String</option>
                        <option value="integer">Integer</option>
                        <option value="date">Date</option>
                      </select>
                    </div>
                    <div class="field-required-col">
                      <label class="flex items-center gap-1.5 text-xs cursor-pointer" style="color:#414755;">
                        <input type="checkbox" v-model="field.required" class="w-4 h-4 rounded" />
                        <span>Req</span>
                      </label>
                    </div>
                    <div class="field-action-col">
                      <button @click="removeField(index)" class="field-delete-btn" title="Remove field">
                        <span class="material-symbols-outlined" style="font-size:16px;">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button @click="addField" class="mt-3 flex items-center gap-1 text-xs font-medium" style="color:#0058bc;">
                <span class="material-symbols-outlined" style="font-size:14px;">add</span>
                Add Field
              </button>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button @click="cancelTypeEdit" class="flex-1 py-2.5 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2 border" style="color:#414755;border-color:#e3e2e7;">
              Cancel
            </button>
            <button
              @click="saveType"
              :disabled="!typeForm.name.trim()"
              class="flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              :style="typeForm.name.trim() ? 'background:#0058bc;color:#fff;' : 'background:#0058bc;color:#fff;opacity:0.4;cursor:not-allowed;'"
            >
              {{ editingType ? 'Update Type' : 'Create Type' }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </Shell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Shell from '../components/layout/Shell.vue';
import { useDomainsStore } from '../stores/domains';
import { useAuthStore } from '../stores/auth';

interface KnowledgeField {
  name: string;
  type: 'string' | 'integer' | 'date';
  required: boolean;
}

interface KnowledgeType {
  id: string;
  name: string;
  description: string | null;
  fields: KnowledgeField[];
}

interface KnowledgeResult {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  typeName: string;
}

const router = useRouter();
const route = useRoute();
const domainsStore = useDomainsStore();
const authStore = useAuthStore();

const domainId = computed(() => route.params.id as string);
const domainTitle = ref('');

const knowledgeTypes = ref<KnowledgeType[]>([]);
const searchQuery = ref('');
const filterTypeId = ref('');
const results = ref<KnowledgeResult[]>([]);
const loading = ref(false);
const hasSearched = ref(false);
const showAddPanel = ref(false);
const selectedKnowledge = ref<KnowledgeResult | null>(null);

const selectedTypeFields = computed(() => {
  if (!newKnowledge.value.typeId) return [];
  const type = knowledgeTypes.value.find(t => t.id === newKnowledge.value.typeId);
  return type?.fields || [];
});

const newKnowledge = ref({
  typeId: '',
  title: '',
  content: '',
  metadata: {} as Record<string, any>
});

const isValidNewKnowledge = computed(() => {
  if (!newKnowledge.value.typeId || !newKnowledge.value.title.trim() || !newKnowledge.value.content.trim()) {
    return false;
  }
  for (const field of selectedTypeFields.value) {
    if (field.required && !newKnowledge.value.metadata[field.name]) {
      return false;
    }
  }
  return true;
});

onMounted(async () => {
  await domainsStore.fetchDomain(domainId.value);
  const domain = domainsStore.byId(domainId.value);
  if (domain) {
    domainTitle.value = domain.title;
  }
  await fetchKnowledgeTypes();
});

async function fetchKnowledgeTypes() {
  try {
    const token = await authStore.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${bffBase}/knowledge-types`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      knowledgeTypes.value = await res.json();
    }
  } catch (e) {
    console.error('Failed to fetch knowledge types:', e);
  }
}

function onTypeChange() {
  newKnowledge.value.metadata = {};
}

async function executeSearch() {
  loading.value = true;
  hasSearched.value = true;

  try {
    const token = await authStore.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const res = await fetch(`${bffBase}/knowledge/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: searchQuery.value,
        domainId: domainId.value,
        typeId: filterTypeId.value || undefined,
        limit: 20
      })
    });

    if (res.ok) {
      const data = await res.json();
      results.value = data.results || [];
    } else {
      results.value = [];
    }
  } catch (e) {
    console.error('Search failed:', e);
    results.value = [];
  } finally {
    loading.value = false;
  }
}

function clearSearch() {
  searchQuery.value = '';
  filterTypeId.value = '';
  results.value = [];
  hasSearched.value = false;
}

function selectResult(result: KnowledgeResult) {
  selectedKnowledge.value = result;
}

function openAddPanel() {
  newKnowledge.value = { typeId: '', title: '', content: '', metadata: {} };
  showAddPanel.value = true;
}

function closeAddPanel() {
  showAddPanel.value = false;
  newKnowledge.value = { typeId: '', title: '', content: '', metadata: {} };
}

async function submitKnowledge() {
  if (!isValidNewKnowledge.value) return;

  try {
    const token = await authStore.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const res = await fetch(`${bffBase}/knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        typeId: newKnowledge.value.typeId,
        domainId: domainId.value,
        title: newKnowledge.value.title.trim(),
        content: newKnowledge.value.content.trim(),
        metadata: newKnowledge.value.metadata
      })
    });

    if (res.ok) {
      closeAddPanel();
      executeSearch();
    }
  } catch (e) {
    console.error('Add knowledge failed:', e);
  }
}

async function deleteKnowledge(id: string) {
  if (!confirm('Delete this knowledge piece?')) return;

  try {
    const token = await authStore.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const res = await fetch(`${bffBase}/knowledge/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      selectedKnowledge.value = null;
      executeSearch();
    }
  } catch (e) {
    console.error('Delete knowledge failed:', e);
  }
}

// Type Manager
const showTypeManager = ref(false);
const editingType = ref<KnowledgeType | null>(null);

const typeForm = ref({
  name: '',
  description: '',
  fields: [] as { name: string; type: 'string' | 'integer' | 'date'; required: boolean }[]
});

function addField() {
  typeForm.value.fields.push({ name: '', type: 'string', required: false });
}

function removeField(index: number) {
  typeForm.value.fields.splice(index, 1);
}

function editType(type: KnowledgeType) {
  editingType.value = type;
  typeForm.value = {
    name: type.name,
    description: type.description || '',
    fields: type.fields.map(f => ({ ...f }))
  };
}

function cancelTypeEdit() {
  editingType.value = null;
  typeForm.value = { name: '', description: '', fields: [] };
}

async function saveType() {
  if (!typeForm.value.name.trim()) return;

  try {
    const token = await authStore.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const body = {
      name: typeForm.value.name.trim(),
      description: typeForm.value.description.trim() || undefined,
      fields: typeForm.value.fields.filter(f => f.name.trim()).map(f => ({
        name: f.name.trim(),
        type: f.type,
        required: f.required
      }))
    };

    let res;
    if (editingType.value) {
      res = await fetch(`${bffBase}/knowledge-types/${editingType.value.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
    } else {
      res = await fetch(`${bffBase}/knowledge-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
    }

    if (res.ok) {
      await fetchKnowledgeTypes();
      cancelTypeEdit();
    }
  } catch (e) {
    console.error('Save type failed:', e);
  }
}

async function deleteType(id: string) {
  if (!confirm('Delete this type? Knowledge pieces using this type will not be deleted.')) return;

  try {
    const token = await authStore.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const res = await fetch(`${bffBase}/knowledge-types/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      await fetchKnowledgeTypes();
    }
  } catch (e) {
    console.error('Delete type failed:', e);
  }
}
</script>

<style scoped>
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e3e2e7;
  background: #fff;
  cursor: pointer;
  color: #414755;
  transition: background 0.12s;
}
.toolbar-btn:hover { background: #f4f3f8; }

.result-card {
  background: #fff;
  border: 1px solid #e3e2e7;
  border-radius: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.result-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border-color: #c7c6d1;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1b1f;
}

.result-snippet {
  font-size: 13px;
  color: #414755;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-meta {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  background: #f4f3f8;
  color: #414755;
}

.type-badge {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  background: #eff6ff;
  color: #0058bc;
}

.field-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #414755;
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #e3e2e7;
  border-radius: 10px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #1a1b1f;
  background: #faf9fe;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.field-input:focus { border-color: #0058bc; }
.field-textarea { resize: vertical; min-height: 80px; }

.field-row {
  background: #faf9fe;
  border: 1px solid #e3e2e7;
  border-radius: 10px;
  padding: 10px 12px;
}

.field-row-grid {
  display: grid;
  grid-template-columns: 1fr 100px 60px 36px;
  gap: 8px;
  align-items: center;
}

.field-name-col {
  min-width: 0;
}

.field-type-col {
  min-width: 0;
}

.field-required-col {
  display: flex;
  justify-content: center;
}

.field-action-col {
  display: flex;
  justify-content: center;
}

.field-delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #a0a7b5;
  transition: background 0.12s, color 0.12s;
}
.field-delete-btn:hover {
  background: #fef2f2;
  color: #991b1b;
}
</style>
