<template>
  <div class="fixed inset-0 flex flex-col" style="font-family: 'Inter', sans-serif; background: #faf9fe;">

    <!-- ── Toolbar ─────────────────────────────────────── -->
    <header class="flex items-center justify-between px-4 flex-shrink-0 z-20"
      style="height:56px;background:#ffffff;border-bottom:1px solid #e3e2e7;">

      <!-- Left -->
      <div class="flex items-center gap-3">
        <button @click="handleBack"
          class="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60"
          style="color:#414755;">
          <span class="material-symbols-outlined" style="font-size:18px;">arrow_back</span>Back
        </button>
        <span style="color:#e3e2e7;">|</span>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined" style="font-size:20px;color:#4338ca;">package_2</span>
          <span class="text-sm font-bold" style="color:#1a1b1f;">
            {{ product?.name ?? 'Product' }} Designer
          </span>
          <span v-if="isDirty" class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-700 uppercase tracking-widest">Unsaved Changes</span>
        </div>
      </div>

      <!-- Right -->
      <div class="flex items-center gap-3">
        <span v-if="saveStatus === 'saving'" class="flex items-center gap-1 text-xs font-medium" style="color:#a0a7b5;">
          <span class="material-symbols-outlined animate-spin" style="font-size:14px;">progress_activity</span>Saving…
        </span>
        <span v-else-if="saveStatus === 'saved'" class="flex items-center gap-1 text-xs font-medium" style="color:#047857;">
          <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span>Saved
        </span>

        <button @click="onSave" :disabled="saveStatus === 'saving'"
          class="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
          style="background:#4338ca;color:#ffffff;box-shadow: 0 4px 12px rgba(67, 56, 202, 0.25);">
          <span class="material-symbols-outlined" style="font-size:18px;">save</span>Save Diagram
        </button>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
      
      <!-- ── Left Panel: SWCI Library ─────────────────── -->
      <aside class="w-64 border-r bg-white flex flex-col z-10" style="border-color:#e3e2e7;">
        <div class="p-4 border-bottom">
          <h2 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">SWCI Components</h2>
          
          <button 
            @click="openCreateSWCI"
            class="w-full flex items-center justify-center gap-2 py-2 mb-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all text-xs font-bold uppercase"
          >
            <span class="material-symbols-outlined" style="font-size:16px;">add</span>
            New SWCI
          </button>

          <div class="relative mb-4">
            <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size:16px;">search</span>
            <input 
              v-model="swciSearch" 
              type="text" 
              placeholder="Filter components..." 
              class="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs outline-none focus:border-indigo-300 transition-colors"
            />
          </div>
        </div>

        <!-- Grouped SWCI Components -->
        <div class="flex-1 overflow-y-auto p-3 space-y-4">
          <div v-for="group in groupedSWCIs" :key="group.typeName" class="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm">
            <button 
              @click="toggleGroup(group.typeName)"
              class="w-full flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-indigo-500" style="font-size:18px;">{{ group.icon || 'folder' }}</span>
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-700">{{ group.typeName }}</span>
              </div>
              <span class="material-symbols-outlined text-slate-400 transition-transform" :class="expandedGroups[group.typeName] ? 'rotate-180' : ''">expand_more</span>
            </button>

            <div v-show="expandedGroups[group.typeName]" class="p-2 space-y-2 border-t border-slate-50 animate-in slide-in-from-top-1 duration-200">
              <div
                v-for="item in group.items"
                :key="item.id"
                class="p-2.5 rounded-lg border border-transparent bg-slate-50/30 cursor-grab active:cursor-grabbing hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                draggable="true"
                @dragstart="onDragStart($event, item)"
              >
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-indigo-400" style="font-size:16px;">{{ item.type?.icon || 'settings_input_component' }}</span>
                  <p class="text-xs font-bold text-slate-600 truncate">{{ item.name }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="groupedSWCIs.length === 0" class="text-center py-10">
            <p class="text-xs text-slate-400 italic">No components found</p>
          </div>
        </div>
      </aside>

      <!-- ── Canvas area ─────────────────────────────────── -->
      <main class="flex-1 relative overflow-hidden bg-slate-50" @drop="onDrop" @dragover.prevent>
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          :default-edge-options="defaultEdgeOptions"
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @pane-click="onPaneClick"
          @connect="onConnect"
          @nodes-change="onNodesChange"
          @edges-change="onEdgesChange"
          :delete-key-code="['Delete', 'Backspace']"
          :connection-mode="ConnectionMode.Loose"
          :snap-to-grid="snapToGrid"
          :snap-grid="[20, 20]"
          fit-view-on-init
        >
          <Background :gap="24" :size="1.5" pattern-color="#d4d2db" variant="dots" />
          
          <!-- Custom Toolbar in Canvas -->
          <div class="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
            <button 
              @click="snapToGrid = !snapToGrid"
              class="w-10 h-10 rounded-xl bg-white shadow-lg border border-slate-100 flex items-center justify-center transition-all hover:bg-slate-50 active:scale-95"
              :title="snapToGrid ? 'Disable Snap' : 'Enable Snap'"
              :style="{ color: snapToGrid ? '#4338ca' : '#94a3b8' }"
            >
              <span class="material-symbols-outlined" :style="{ fontVariationSettings: snapToGrid ? `'FILL' 1` : `'FILL' 0` }">
                {{ snapToGrid ? 'grid_on' : 'grid_off' }}
              </span>
            </button>
            <Controls position="bottom-right" style="position: static; margin: 0;" />
          </div>
        </VueFlow>
      </main>

      <!-- ── Right Panel: Properties ──────────────────── -->
      <aside v-if="selectedElement" class="w-80 border-l bg-white flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-200" style="border-color:#e3e2e7;">
        <div class="p-5 border-b flex items-center justify-between">
          <h2 class="text-sm font-black uppercase tracking-widest text-slate-900">Properties</h2>
          <button @click="selectedElement = null" class="material-symbols-outlined text-slate-400 hover:text-slate-600">close</button>
        </div>

        <div class="p-6 space-y-6 overflow-y-auto">
          <!-- Node Properties -->
          <template v-if="selectedElement.type === 'swci'">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Component Name</label>
              <input 
                v-model="editForm.name" 
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
              />
            </div>

            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Component Type</label>
              <select 
                v-model="editForm.typeId"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
              >
                <option v-for="t in productStore.configItemTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            
            <div v-if="isApiType" class="pt-4 border-t">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Linked API</label>
              <select 
                v-model="editForm.selectedApiId"
                @change="onApiChange"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all mb-3"
              >
                <option value="">None</option>
                <option v-for="api in registryStore.apis" :key="api.id" :value="api.id">{{ api.name }}</option>
              </select>
              
              <template v-if="editForm.selectedApiId">
                <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Version</label>
                <select 
                  v-model="editForm.apiVersionId"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option v-for="v in selectedApiVersions" :key="v.id" :value="v.id">{{ v.version }}</option>
                </select>
              </template>
            </div>

            <div v-if="selectedTypeSpecs.length > 0" class="space-y-4 pt-4 border-t">
              <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-900">Type Specifications</h3>
              <div v-for="spec in selectedTypeSpecs" :key="spec.id">
                <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  {{ spec.name }} <span v-if="spec.required" class="text-red-500">*</span>
                </label>
                <div v-if="spec.dataType === 'boolean'" class="flex items-center">
                  <input type="checkbox" v-model="editForm.properties[spec.id]" class="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500" />
                </div>
                <input v-else-if="spec.dataType === 'integer'" 
                  type="number" 
                  v-model.number="editForm.properties[spec.id]" 
                  class="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100" 
                />
                <input v-else 
                  type="text" 
                  v-model="editForm.properties[spec.id]" 
                  class="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100" 
                />
              </div>
            </div>

            <div class="pt-6 border-t">
              <button 
                @click="updateSWCI"
                class="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all"
              >Update SWCI Info</button>
            </div>
          </template>

          <!-- Edge Properties -->
          <template v-else-if="selectedElement.source">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Dependency Type</label>
              <select 
                v-model="selectedElement.data.type"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all appearance-none"
              >
                <option value="REST_CALL">REST Call</option>
                <option value="GRPC">gRPC</option>
                <option value="PUBSUB">Pub/Sub</option>
                <option value="JDBC">JDBC Connection</option>
                <option value="SOAP">SOAP Call</option>
              </select>
            </div>
          </template>
        </div>
      </aside>
    </div>

    <!-- ── Modals ─────────────────────────── -->
    <!-- Create SWCI Modal -->
    <div v-if="showCreateSWCI" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 class="text-2xl font-black text-slate-900 mb-2">New SWCI</h2>
        <p class="text-sm text-slate-500 mb-6">Create a shared component for the organization.</p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Name</label>
            <input v-model="newSWCI.name" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Type</label>
            <select v-model="newSWCI.typeId" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all">
              <option v-for="t in productStore.configItemTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button @click="showCreateSWCI = false" class="flex-1 py-3 font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
          <button @click="handleCreateSWCI" :disabled="!newSWCI.name || !newSWCI.typeId" class="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 transition-all">Create Component</button>
        </div>
      </div>
    </div>

    <!-- Reusable Confirmation Modal for Exit -->
    <ConfirmationModal
      :show="showExitModal"
      title="Unsaved Changes"
      message="You have unsaved changes in your diagram. Do you want to save them before leaving?"
      confirmText="Save and Exit"
      rejectText="Discard and Exit"
      @confirm="confirmExit(true)"
      @reject="confirmExit(false)"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, markRaw, reactive, onUnmounted } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { VueFlow, useVueFlow, ConnectionMode, type Node, type Edge, type Connection } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { useProductStore } from '../stores/products';
import { useRegistryStore } from '../stores/registry';
import SWCINode from '../components/designer/SWCINode.vue';
import ConfirmationModal from '../components/ConfirmationModal.vue';

// --- Flow Components ---
const nodeTypes = {
  swci: markRaw(SWCINode),
};

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const registryStore = useRegistryStore();
const { addNodes, addEdges, toObject, fromObject } = useVueFlow();

const productId = route.params.id as string;
const product = ref<any>(null);
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle');
const swciSearch = ref('');
const showCreateSWCI = ref(false);
const selectedElement = ref<any>(null);
const snapToGrid = ref(true);

// Unsaved changes state
const isDirty = ref(false);
const showExitModal = ref(false);
let nextRoute: any = null;

const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);

const expandedGroups = ref<Record<string, boolean>>({});

const newSWCI = reactive({
  name: '',
  typeId: ''
});

const editForm = reactive({
  id: '',
  name: '',
  description: '',
  typeId: '',
  apiVersionId: null as string | null,
  selectedApiId: '',
  properties: {} as Record<string, any>
});

const defaultEdgeOptions = {
  style: { stroke: '#6366f1', strokeWidth: 2.5 },
  animated: false,
  markerEnd: 'arrowclosed',
};

// --- Computed ---
const groupedSWCIs = computed(() => {
  const query = swciSearch.value.toLowerCase();
  const items = productStore.swcis.filter(s => s.name.toLowerCase().includes(query));
  const groups: Record<string, { typeName: string, icon: string, items: any[] }> = {};
  items.forEach(item => {
    const typeName = item.type?.name || 'Uncategorized';
    if (!groups[typeName]) {
      groups[typeName] = {
        typeName,
        icon: item.type?.icon || 'settings_input_component',
        items: []
      };
    }
    groups[typeName].items.push(item);
  });
  const sortedGroupKeys = Object.keys(groups).sort();
  return sortedGroupKeys.map(key => {
    groups[key].items.sort((a, b) => a.name.localeCompare(b.name));
    return groups[key];
  });
});

const isApiType = computed(() => {
  const type = productStore.configItemTypes.find(t => t.id === editForm.typeId);
  return type?.name === 'API' || type?.name === 'MICROSERVICE';
});

const selectedTypeSpecs = computed(() => {
  const type = productStore.configItemTypes.find(t => t.id === editForm.typeId);
  return type?.specifications || [];
});

const selectedApiVersions = computed(() => {
  if (!editForm.selectedApiId) return [];
  const api = registryStore.apis.find(a => a.id === editForm.selectedApiId);
  return api?.versions || [];
});

// --- Lifecycle & Guards ---
onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  try {
    product.value = await productStore.getProduct(productId);
    await productStore.fetchSWCIs(product.value.organizationId);
    await productStore.fetchConfigItemTypes();
    await registryStore.fetchApis();
    productStore.configItemTypes.forEach(t => expandedGroups.value[t.name] = false);
    if (product.value.diagram) {
      fromObject(product.value.diagram);
    }
    // Set dirty false after initial load
    setTimeout(() => { isDirty.value = false; }, 500);
  } catch (err) {
    console.error('Initialization error', err);
  }
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (isDirty.value) {
    event.preventDefault();
    event.returnValue = ''; // Standard for modern browsers
  }
};

onBeforeRouteLeave((to, _from, next) => {
  if (isDirty.value) {
    nextRoute = to;
    showExitModal.value = true;
    next(false); // Cancel initial navigation
  } else {
    next();
  }
});

// --- Methods ---
const onNodesChange = () => { isDirty.value = true; };
const onEdgesChange = () => { isDirty.value = true; };

const confirmExit = async (shouldSave: boolean) => {
  showExitModal.value = false;
  if (shouldSave) {
    await onSave();
  }
  isDirty.value = false;
  if (nextRoute) {
    router.push(nextRoute);
  }
};

const handleBack = () => {
  router.push(`/organizations/${product.value?.organizationId || ''}/products`);
};

const toggleGroup = (typeName: string) => {
  expandedGroups.value[typeName] = !expandedGroups.value[typeName];
};

const onDragStart = (event: DragEvent, swci: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify(swci));
    event.dataTransfer.effectAllowed = 'move';
  }
};

const onDrop = (event: DragEvent) => {
  const data = event.dataTransfer?.getData('application/vueflow');
  if (!data) return;
  const swci = JSON.parse(data);
  const position = { x: event.clientX - 300, y: event.clientY - 100 };
  const newNode: Node = {
    id: `node-${Date.now()}`,
    type: 'swci',
    position,
    label: swci.name,
    data: { 
      swciId: swci.id,
      name: swci.name,
      type: swci.type?.name,
      icon: swci.type?.icon,
      description: swci.description
    },
  };
  addNodes([newNode]);
  isDirty.value = true;
};

const onConnect = (params: Connection) => {
  const newEdge: Edge = {
    ...params,
    id: `edge-${Date.now()}`,
    data: { type: 'REST_CALL' }
  };
  addEdges([newEdge]);
  isDirty.value = true;
};

const onNodeClick = ({ node }: { node: Node }) => {
  selectedElement.value = node;
  const swci = productStore.swcis.find(s => s.id === node.data.swciId);
  if (swci) {
    editForm.id = swci.id;
    editForm.name = swci.name;
    editForm.description = swci.description || '';
    editForm.typeId = swci.typeId;
    editForm.apiVersionId = swci.apiVersionId || null;
    editForm.selectedApiId = swci.apiVersion?.apiId || '';
    const props: Record<string, any> = {};
    swci.properties?.forEach(p => {
      const spec = swci.type?.specifications?.find(s => s.id === p.specificationId);
      if (spec?.dataType === 'boolean') props[p.specificationId] = p.value === 'true';
      else if (spec?.dataType === 'integer') props[p.specificationId] = parseInt(p.value);
      else props[p.specificationId] = p.value;
    });
    editForm.properties = props;
  }
};

const onApiChange = () => {
  editForm.apiVersionId = null;
};

const onEdgeClick = ({ edge }: { edge: Edge }) => {
  selectedElement.value = edge;
};

const onPaneClick = () => {
  selectedElement.value = null;
};

const updateSWCI = async () => {
  if (!editForm.id) return;
  try {
    const propsToSave = Object.entries(editForm.properties).map(([specId, val]) => ({
      specificationId: specId,
      value: String(val)
    }));
    const updated = await productStore.updateSWCI(editForm.id, {
      name: editForm.name,
      description: editForm.description,
      typeId: editForm.typeId,
      apiVersionId: editForm.apiVersionId,
      properties: propsToSave
    });
    nodes.value = nodes.value.map(n => {
      if (n.data.swciId === editForm.id) {
        return {
          ...n,
          data: { ...n.data, name: updated.name, type: updated.type?.name, icon: updated.type?.icon, description: updated.description },
          label: updated.name
        };
      }
      return n;
    });
    selectedElement.value = null;
    isDirty.value = true;
  } catch (err) {
    alert('Failed to update SWCI');
  }
};

const openCreateSWCI = () => {
  newSWCI.name = '';
  newSWCI.typeId = productStore.configItemTypes[0]?.id || '';
  showCreateSWCI.value = true;
};

const handleCreateSWCI = async () => {
  if (!product.value) return;
  try {
    await productStore.createSWCI(product.value.organizationId, {
      name: newSWCI.name,
      typeId: newSWCI.typeId
    });
    showCreateSWCI.value = false;
  } catch (err) {
    alert('Failed to create SWCI');
  }
};

const onSave = async () => {
  saveStatus.value = 'saving';
  try {
    const diagram = toObject();
    await productStore.updateProduct(productId, { diagram });
    saveStatus.value = 'saved';
    isDirty.value = false;
    setTimeout(() => { saveStatus.value = 'idle'; }, 2000);
  } catch (err) {
    saveStatus.value = 'idle';
    alert('Failed to save diagram');
  }
};

const goBack = () => {
  handleBack();
};

</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';

.vue-flow__node-swci {
  padding: 0;
  border: none;
  background: transparent;
}

.vue-flow__edge.selected .vue-flow__edge-path {
  stroke: #4338ca !important;
  stroke-width: 4px !important;
}

.vue-flow__controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: white;
  padding: 4px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.vue-flow__controls-button {
  border: none !important;
  border-radius: 8px !important;
  fill: #414755 !important;
}

.vue-flow__controls-button:hover {
  background: #f4f3f8 !important;
}
</style>
