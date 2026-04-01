<template>
  <Shell>
    <div class="p-8 max-w-7xl mx-auto w-full" style="font-family:'Inter',sans-serif;">

      <!-- Header -->
      <header class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold" style="color:#1a1b1f;">Node Types</h1>
          <p class="mt-1 text-sm" style="color:#717786;">
            Define reusable node types for the Integration Designer. Each type has a name and a set of typed properties.
          </p>
        </div>
        <button @click="openCreate"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style="background:#0058bc;color:#fff;box-shadow:0 4px 14px rgba(0,88,188,0.30);">
          <span class="material-symbols-outlined" style="font-size:18px;">add</span>New Node Type
        </button>
      </header>

      <!-- Empty state -->
      <div v-if="!store.entries.length"
        class="border-2 border-dashed rounded-3xl p-20 text-center flex flex-col items-center"
        style="border-color:#c7c6d1;">
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6" style="background:#f4f3f8;">
          <span class="material-symbols-outlined text-4xl" style="color:#717786;">widgets</span>
        </div>
        <h2 class="text-xl font-bold mb-2" style="color:#1a1b1f;">No node types yet</h2>
        <p class="mb-8 max-w-sm text-sm" style="color:#414755;">
          Create node types to use as reusable building blocks in your integration flows.
        </p>
        <button @click="openCreate"
          class="py-2.5 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
          style="background:#0058bc;color:#fff;box-shadow:0 4px 14px rgba(0,88,188,0.30);">
          <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span>Create First Node Type
        </button>
      </div>

      <!-- Cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div v-for="entry in store.entries" :key="entry.id" class="nt-card">

          <!-- Card header -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="nt-icon">
                <span class="material-symbols-outlined" style="font-size:20px;color:#0058bc;font-variation-settings:'FILL' 1;">widgets</span>
              </div>
              <p class="text-base font-bold truncate" style="color:#1a1b1f;">{{ entry.name }}</p>
            </div>
            <div class="flex gap-1 flex-shrink-0">
              <button @click="openEdit(entry)" class="nt-action-btn" title="Edit">
                <span class="material-symbols-outlined" style="font-size:17px;">edit</span>
              </button>
              <button @click="confirmDelete(entry.id)" class="nt-action-btn nt-action-btn--danger" title="Delete">
                <span class="material-symbols-outlined" style="font-size:17px;">delete</span>
              </button>
            </div>
          </div>

          <!-- Description -->
          <p v-if="entry.description" class="text-sm leading-relaxed mb-3 line-clamp-2" style="color:#414755;">
            {{ entry.description }}
          </p>
          <p v-else class="text-sm mb-3 italic" style="color:#c7c6d1;">No description</p>

          <!-- Properties -->
          <div v-if="entry.properties.length" class="space-y-1">
            <p class="text-xs font-bold uppercase tracking-wider mb-1.5" style="color:#a0a7b5;">Properties</p>
            <div v-for="prop in entry.properties" :key="prop.name" class="flex items-center gap-2">
              <span class="nt-prop-name">{{ prop.name }}</span>
              <span class="nt-prop-type">{{ prop.type }}</span>
              <span v-if="prop.required" class="nt-prop-required">required</span>
            </div>
          </div>
          <p v-else class="text-xs" style="color:#c7c6d1;">No properties defined</p>
        </div>
      </div>

    </div>

    <!-- ── Create / Edit Modal ── -->
    <div v-if="modal.open" class="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style="background:rgba(26,27,31,0.55);backdrop-filter:blur(4px);">
      <div class="rounded-3xl w-full max-w-lg shadow-2xl flex flex-col" style="background:#fff;max-height:90vh;">

        <!-- Modal header -->
        <div class="flex items-start justify-between p-8 pb-4 flex-shrink-0">
          <div>
            <h2 class="text-2xl font-bold" style="color:#1a1b1f;">{{ modal.editing ? 'Edit Node Type' : 'New Node Type' }}</h2>
            <p class="text-sm mt-1" style="color:#717786;">Define a reusable node type with its properties.</p>
          </div>
          <button @click="closeModal" class="p-1.5 rounded-full hover:bg-gray-100 ml-4" style="color:#717786;">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Scrollable body -->
        <div class="overflow-y-auto px-8 pb-2 flex-1 min-h-0">

          <!-- Error -->
          <div v-if="modal.error" class="mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2"
            style="background:#fef2f2;color:#991b1b;border:1px solid #fecaca;">
            <span class="material-symbols-outlined text-base">error</span>{{ modal.error }}
          </div>

          <div class="space-y-4">
            <!-- Name -->
            <div>
              <label class="field-label">Name <span style="color:#991b1b;">*</span></label>
              <input v-model="form.name" type="text" class="field-input" placeholder="e.g. HTTP Transformer"
                :disabled="!!modal.editing" />
              <p class="field-hint">Unique name for this node type. Cannot be changed after creation.</p>
            </div>
            <!-- Description -->
            <div>
              <label class="field-label">Description</label>
              <textarea v-model="form.description" class="field-input field-textarea" rows="2"
                placeholder="What does this node type do?" />
            </div>

            <!-- Properties -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="field-label" style="margin:0;">Properties</label>
                <button @click="addProp"
                  class="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-colors hover:bg-blue-50"
                  style="color:#0058bc;">
                  <span class="material-symbols-outlined" style="font-size:14px;">add</span>Add Property
                </button>
              </div>

              <div v-if="!form.properties.length" class="text-xs text-center py-4 rounded-xl" style="color:#a0a7b5;background:#f4f3f8;">
                No properties yet — click "Add Property" to define inputs for this node type.
              </div>

              <div v-for="(prop, i) in form.properties" :key="i" class="prop-row">
                <input v-model="prop.name" type="text" class="field-input prop-input" placeholder="Property name" />
                <select v-model="prop.type" class="field-input prop-select">
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="select">select</option>
                  <option value="textarea">textarea</option>
                </select>
                <label class="flex items-center gap-1 text-xs font-medium flex-shrink-0" style="color:#414755;">
                  <input type="checkbox" v-model="prop.required" />req
                </label>
                <button @click="removeProp(i)" class="nt-action-btn nt-action-btn--danger flex-shrink-0">
                  <span class="material-symbols-outlined" style="font-size:15px;">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-8 pt-4 flex-shrink-0">
          <button @click="closeModal"
            class="flex-1 py-3 px-6 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2 border"
            style="color:#414755;border-color:#e3e2e7;">
            <span class="material-symbols-outlined text-base">close</span>Cancel
          </button>
          <button @click="handleSave" :disabled="!form.name.trim()"
            class="flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            :style="form.name.trim()
              ? 'background:#0058bc;color:#fff;box-shadow:0 4px 14px rgba(0,88,188,0.30);'
              : 'background:#0058bc;color:#fff;opacity:0.4;cursor:not-allowed;'">
            <span class="material-symbols-outlined text-base">{{ modal.editing ? 'save' : 'add_circle' }}</span>
            {{ modal.editing ? 'Save Changes' : 'Create Node Type' }}
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
        <h2 class="text-xl font-bold mb-2" style="color:#1a1b1f;">Delete node type?</h2>
        <p class="text-sm mb-8" style="color:#717786;">
          Nodes using this type in integrations will show as "unknown type". This cannot be undone.
        </p>
        <div class="flex gap-3">
          <button @click="deleteId = null"
            class="flex-1 py-2.5 rounded-xl font-bold border hover:bg-gray-50"
            style="color:#414755;border-color:#e3e2e7;">Cancel</button>
          <button @click="handleDelete"
            class="flex-1 py-2.5 rounded-xl font-bold"
            style="background:#991b1b;color:#fff;">Delete</button>
        </div>
      </div>
    </div>

  </Shell>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import Shell from '../../components/layout/Shell.vue';
import { useNodeTypeCatalogStore } from '../../stores/nodeTypeCatalog';
import type { NodeTypeCatalogEntry, NodePropDef } from '../../stores/nodeTypeCatalog';

const store = useNodeTypeCatalogStore();
onMounted(() => store.fetch());

// ── Form ──────────────────────────────────────────────────
interface PropForm { name: string; type: NodePropDef['type']; required: boolean; }
const emptyForm = () => ({ name: '', description: '', properties: [] as PropForm[] });
const form = reactive(emptyForm());

const modal = reactive<{ open: boolean; editing: string | null; error: string }>({
  open: false, editing: null, error: '',
});
const deleteId = ref<string | null>(null);

function openCreate() {
  Object.assign(form, emptyForm());
  modal.editing = null; modal.error = ''; modal.open = true;
}

function openEdit(entry: NodeTypeCatalogEntry) {
  Object.assign(form, {
    name: entry.name,
    description: entry.description ?? '',
    properties: entry.properties.map(p => ({ ...p })),
  });
  modal.editing = entry.id; modal.error = ''; modal.open = true;
}

function closeModal() { modal.open = false; }

function addProp() {
  form.properties.push({ name: '', type: 'string', required: false });
}

function removeProp(i: number) { form.properties.splice(i, 1); }

async function handleSave() {
  modal.error = '';
  const props = form.properties.filter(p => p.name.trim());
  try {
    if (modal.editing) {
      await store.update(modal.editing, {
        description: form.description.trim() || undefined,
        properties: props,
      });
    } else {
      await store.add({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        properties: props,
      });
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
.nt-card {
  background: #ffffff;
  border: 1px solid #e3e2e7;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.15s, transform 0.15s;
}
.nt-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); transform: translateY(-1px); }

.nt-icon {
  width: 40px; height: 40px; border-radius: 12px;
  background: #eff6ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.nt-action-btn {
  width: 30px; height: 30px; border-radius: 8px; border: none; background: none;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  color: #a0a7b5; transition: background 0.12s, color 0.12s;
}
.nt-action-btn:hover { background: #f4f3f8; color: #414755; }
.nt-action-btn--danger:hover { background: #fef2f2; color: #991b1b; }

.nt-prop-name {
  font-size: 11px; font-weight: 600; color: #1a1b1f;
  background: #f4f3f8; padding: 1px 7px; border-radius: 6px;
}
.nt-prop-type {
  font-size: 10px; font-weight: 700; color: #7c3aed;
  background: #f5f3ff; padding: 1px 6px; border-radius: 6px;
  font-family: 'Inter', monospace;
}
.nt-prop-required {
  font-size: 9px; font-weight: 700; color: #991b1b;
  background: #fef2f2; padding: 1px 5px; border-radius: 5px;
  text-transform: uppercase; letter-spacing: 0.04em;
}

/* Form */
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #414755; margin-bottom: 6px; }
.field-hint  { font-size: 11px; color: #a0a7b5; margin-top: 4px; }
.field-input {
  width: 100%; padding: 9px 12px; border: 1px solid #e3e2e7; border-radius: 10px;
  font-size: 13px; font-family: 'Inter', sans-serif; color: #1a1b1f; background: #faf9fe;
  outline: none; box-sizing: border-box; transition: border-color 0.15s;
}
.field-input:focus { border-color: #0058bc; }
.field-input:disabled { opacity: 0.5; cursor: not-allowed; }
.field-textarea { resize: vertical; min-height: 64px; }

.prop-row {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 6px;
}
.prop-input  { flex: 1; min-width: 0; }
.prop-select { width: 110px; flex-shrink: 0; }
</style>
