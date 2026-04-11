<template>
  <Shell>
    <div class="p-8 max-w-7xl mx-auto w-full" style="font-family:'Inter',sans-serif;">

      <!-- Header -->
      <header class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold" style="color:#1a1b1f;">Domains</h1>
          <p class="mt-1 text-sm" style="color:#717786;">
            Group integrations by business domain. Each domain has a name, title, description and searchable labels.
          </p>
        </div>
        <button @click="openCreate" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style="background:#0058bc;color:#fff;box-shadow:0 4px 14px rgba(0,88,188,0.30);">
          <span class="material-symbols-outlined" style="font-size:18px;">add</span>New Domain
        </button>
      </header>

      <!-- Empty State -->
      <div v-if="!store.domains.length" class="border-2 border-dashed rounded-3xl p-20 text-center flex flex-col items-center" style="border-color:#c7c6d1;">
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" style="background:#f4f3f8;">
          <span class="material-symbols-outlined text-4xl" style="color:#717786;">category</span>
        </div>
        <h2 class="text-xl font-bold mb-2" style="color:#1a1b1f;">No domains yet</h2>
        <p class="mb-8 max-w-sm text-sm" style="color:#414755;">
          Create domains to classify your integrations by business area (e.g. Payments, Identity, Notifications).
        </p>
        <button @click="openCreate" class="py-2.5 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
          style="background:#0058bc;color:#fff;box-shadow:0 4px 14px rgba(0,88,188,0.30);">
          <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span>Create First Domain
        </button>
      </div>

      <!-- Domain cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div
          v-for="domain in store.domains"
          :key="domain.id"
          class="domain-card"
        >
          <!-- Card header -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="domain-icon">
                <span class="material-symbols-outlined" style="font-size:20px;color:#0058bc;">category</span>
              </div>
              <div class="min-w-0">
                <p class="text-base font-bold truncate" style="color:#1a1b1f;">{{ domain.title }}</p>
                <p class="text-xs font-semibold" style="color:#a0a7b5;">{{ domain.name }}</p>
              </div>
            </div>
            <div class="flex gap-1 flex-shrink-0">
              <button @click="openERModeler(domain)" class="domain-action-btn" title="ER Modeler">
                <span class="material-symbols-outlined" style="font-size:17px;">table_chart</span>
              </button>
              <button @click="openConceptModeler(domain)" class="domain-action-btn" title="Concept Modeler">
                <span class="material-symbols-outlined" style="font-size:17px;">account_tree</span>
              </button>
              <button @click="openKnowledgeBase(domain)" class="domain-action-btn" title="Knowledge Base">
                <span class="material-symbols-outlined" style="font-size:17px;">psychology</span>
              </button>
              <button @click="openEdit(domain)" class="domain-action-btn" title="Edit">
                <span class="material-symbols-outlined" style="font-size:17px;">edit</span>
              </button>
              <button @click="confirmDelete(domain.id)" class="domain-action-btn domain-action-btn--danger" title="Delete">
                <span class="material-symbols-outlined" style="font-size:17px;">delete</span>
              </button>
            </div>
          </div>

          <!-- Description -->
          <p v-if="domain.description" class="text-sm leading-relaxed mb-3 line-clamp-2" style="color:#414755;">
            {{ domain.description }}
          </p>
          <p v-else class="text-sm mb-3 italic" style="color:#c7c6d1;">No description</p>

          <!-- Labels -->
          <div v-if="domain.labels.length" class="flex flex-wrap gap-1.5">
            <span v-for="label in domain.labels" :key="label" class="label-chip">{{ label }}</span>
          </div>
          <p v-else class="text-xs" style="color:#c7c6d1;">No labels</p>
        </div>
      </div>

    </div>

    <!-- ── Modal ── -->
    <div v-if="modal.open" class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background:rgba(26,27,31,0.55);backdrop-filter:blur(4px);">
      <div class="rounded-3xl w-full max-w-lg p-8 shadow-2xl" style="background:#fff;">

        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold" style="color:#1a1b1f;">{{ modal.editing ? 'Edit Domain' : 'New Domain' }}</h2>
            <p class="text-sm mt-1" style="color:#717786;">{{ modal.editing ? 'Update domain information.' : 'Define a new business domain.' }}</p>
          </div>
          <button @click="closeModal" class="p-1.5 rounded-full hover:bg-gray-100 ml-4" style="color:#717786;">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Error -->
        <div v-if="modal.error" class="mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2"
          style="background:#fef2f2;color:#991b1b;border:1px solid #fecaca;">
          <span class="material-symbols-outlined text-base">error</span>{{ modal.error }}
        </div>

        <div class="space-y-4">
          <!-- Name -->
          <div>
            <label class="field-label">Name <span style="color:#991b1b;">*</span></label>
            <input v-model="form.name" type="text" class="field-input" placeholder="e.g. payments" :disabled="!!modal.editing" />
            <p class="field-hint">Unique identifier (slug). Cannot be changed after creation.</p>
          </div>
          <!-- Title -->
          <div>
            <label class="field-label">Title <span style="color:#991b1b;">*</span></label>
            <input v-model="form.title" type="text" class="field-input" placeholder="e.g. Payments & Billing" />
          </div>
          <!-- Description -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="field-label">Description</label>
              <button 
                v-if="form.title"
                @click="generateDescription" 
                :disabled="aiGenerating"
                class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                style="background:#f4f3f8;color:#0058bc;"
              >
                <span v-if="aiGenerating" class="material-symbols-outlined animate-spin" style="font-size:14px;">progress_activity</span>
                <span v-else class="material-symbols-outlined" style="font-size:14px;">auto_awesome</span>
                AI Generate
              </button>
            </div>
            <textarea v-model="form.description" class="field-input field-textarea" rows="3" placeholder="Describe what belongs to this domain…" />
          </div>
          <!-- Labels -->
          <div>
            <label class="field-label">Labels</label>
            <div class="label-input-wrap">
              <div class="flex flex-wrap gap-1.5 mb-1.5">
                <span v-for="(lbl, i) in form.labels" :key="i" class="label-chip label-chip--editable">
                  {{ lbl }}
                  <button @click="removeLabel(i)" class="label-remove">&times;</button>
                </span>
              </div>
              <input
                v-model="labelInput"
                type="text"
                class="label-add-input"
                placeholder="Type a label and press Enter or comma…"
                @keydown.enter.prevent="addLabel"
                @keydown.prevent.exact.key="onLabelKey"
              />
            </div>
            <p class="field-hint">Press Enter or , to add. Used for search filtering.</p>
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button @click="closeModal" class="flex-1 py-3 px-6 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2 border" style="color:#414755;border-color:#e3e2e7;">
            <span class="material-symbols-outlined text-base">close</span>Cancel
          </button>
          <button @click="handleSave" :disabled="!form.name.trim() || !form.title.trim()"
            class="flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            :style="(form.name.trim() && form.title.trim())
              ? 'background:#0058bc;color:#fff;box-shadow:0 4px 14px rgba(0,88,188,0.30);'
              : 'background:#0058bc;color:#fff;opacity:0.4;cursor:not-allowed;'">
            <span class="material-symbols-outlined text-base">{{ modal.editing ? 'save' : 'add_circle' }}</span>
            {{ modal.editing ? 'Save Changes' : 'Create Domain' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Delete confirmation ── -->
    <div v-if="deleteId" class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background:rgba(26,27,31,0.55);backdrop-filter:blur(4px);">
      <div class="rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center" style="background:#fff;">
        <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style="background:#fef2f2;">
          <span class="material-symbols-outlined text-2xl" style="color:#991b1b;">delete</span>
        </div>
        <h2 class="text-xl font-bold mb-2" style="color:#1a1b1f;">Delete domain?</h2>
        <p class="text-sm mb-8" style="color:#717786;">
          Integrations assigned to this domain will become unassigned. This cannot be undone.
        </p>
        <div class="flex gap-3">
          <button @click="deleteId = null" class="flex-1 py-2.5 rounded-xl font-bold border hover:bg-gray-50" style="color:#414755;border-color:#e3e2e7;">Cancel</button>
          <button @click="handleDelete" class="flex-1 py-2.5 rounded-xl font-bold" style="background:#991b1b;color:#fff;">Delete</button>
        </div>
      </div>
    </div>

  </Shell>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Shell from '../../components/layout/Shell.vue';
import { useDomainsStore } from '../../stores/domains';
import { useLLMPreferencesStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';
import type { Domain } from '../../stores/domains';

const router = useRouter();
const store = useDomainsStore();
const llmPrefs = useLLMPreferencesStore();
const auth = useAuthStore();
onMounted(() => store.fetch());

// ── Form state ───────────────────────────────────────
const emptyForm = () => ({ name: '', title: '', description: '', labels: [] as string[] });
const form = reactive(emptyForm());
const labelInput = ref('');
const aiGenerating = ref(false);

const modal = reactive<{ open: boolean; editing: string | null; error: string }>({
  open: false, editing: null, error: ''
});
const deleteId = ref<string | null>(null);

function openCreate() {
  Object.assign(form, emptyForm());
  labelInput.value = '';
  modal.editing = null;
  modal.error = '';
  modal.open = true;
}

function openEdit(domain: Domain) {
  Object.assign(form, { ...domain, labels: [...domain.labels] });
  labelInput.value = '';
  modal.editing = domain.id;
  modal.error = '';
  modal.open = true;
}

function openConceptModeler(domain: Domain) {
  router.push(`/domains/${domain.id}/concept-modeler`);
}

function openERModeler(domain: Domain) {
  router.push(`/domains/${domain.id}/er-modeler`);
}

function openKnowledgeBase(domain: Domain) {
  router.push(`/domains/${domain.id}/knowledge-base`);
}

function closeModal() { modal.open = false; }

function addLabel() {
  const val = labelInput.value.trim().replace(/,$/, '');
  if (val && !form.labels.includes(val)) form.labels.push(val);
  labelInput.value = '';
}

function onLabelKey(e: KeyboardEvent) {
  if (e.key === ',') { e.preventDefault(); addLabel(); }
}

function removeLabel(i: number) { form.labels.splice(i, 1); }

async function generateDescription() {
  if (!form.title || aiGenerating.value) return;
  aiGenerating.value = true;
  try {
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const messages = [
      { role: 'system', content: 'You are a helpful assistant that generates detailed business domain descriptions. Provide a comprehensive description (2-3 paragraphs, MAXIMUM 500 characters) explaining what this domain represents, its purpose, typical integrations, and business value. Keep it concise and under 500 characters.' },
      { role: 'user', content: `Generate a detailed description for a domain titled "${form.title}". The response MUST be under 500 characters.` }
    ];
    const res = await fetch(`${bffBase}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        provider: llmPrefs.provider,
        apiKey: llmPrefs.currentApiKey,
        customApiUrl: llmPrefs.apiUrl,
        model: llmPrefs.model,
        messages
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const content = data.content || '';
      form.description = content.length > 500 ? content.substring(0, 500) : content;
    }
  } catch (e) {
    console.error('AI generate failed:', e);
  } finally {
    aiGenerating.value = false;
  }
}

async function handleSave() {
  if (labelInput.value.trim()) addLabel();
  modal.error = '';
  try {
    const payload = { name: form.name.trim(), title: form.title.trim(), description: form.description.trim(), labels: [...form.labels] };
    if (modal.editing) {
      await store.update(modal.editing, payload);
    } else {
      await store.add(payload);
    }
    modal.open = false;
  } catch (e: any) {
    modal.error = e.message;
  }
}

function confirmDelete(id: string) { deleteId.value = id; }

async function handleDelete() {
  if (deleteId.value) { await store.remove(deleteId.value); deleteId.value = null; }
}
</script>

<style scoped>
.domain-card {
  background: #ffffff;
  border: 1px solid #e3e2e7;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.15s, transform 0.15s;
}
.domain-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); transform: translateY(-1px); }

.domain-icon {
  width: 40px; height: 40px; border-radius: 12px;
  background: #eff6ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.domain-action-btn {
  width: 30px; height: 30px; border-radius: 8px; border: none; background: none;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  color: #a0a7b5; transition: background 0.12s, color 0.12s;
}
.domain-action-btn:hover { background: #f4f3f8; color: #414755; }
.domain-action-btn--danger:hover { background: #fef2f2; color: #991b1b; }

.label-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 20px;
  font-size: 11px; font-weight: 600; font-family: 'Inter', sans-serif;
  background: #eff6ff; color: #0058bc;
}
.label-chip--editable { background: #f0fdf4; color: #166534; }
.label-remove { background: none; border: none; cursor: pointer; font-size: 13px; line-height: 1; color: inherit; padding: 0 0 0 2px; opacity: 0.7; }
.label-remove:hover { opacity: 1; }

/* Form fields */
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #414755; margin-bottom: 6px; }
.field-hint  { font-size: 11px; color: #a0a7b5; margin-top: 4px; }
.field-input {
  width: 100%; padding: 9px 12px; border: 1px solid #e3e2e7; border-radius: 10px;
  font-size: 13px; font-family: 'Inter', sans-serif; color: #1a1b1f; background: #faf9fe;
  outline: none; box-sizing: border-box; transition: border-color 0.15s;
}
.field-input:focus { border-color: #0058bc; }
.field-input:disabled { opacity: 0.5; cursor: not-allowed; }
.field-textarea { resize: vertical; min-height: 72px; }

.label-input-wrap {
  border: 1px solid #e3e2e7; border-radius: 10px; padding: 8px 10px;
  background: #faf9fe; transition: border-color 0.15s;
}
.label-input-wrap:focus-within { border-color: #0058bc; }
.label-add-input {
  width: 100%; border: none; outline: none; background: transparent;
  font-size: 13px; font-family: 'Inter', sans-serif; color: #1a1b1f;
}
</style>
