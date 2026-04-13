<template>
  <div class="fixed inset-0 flex flex-col overflow-hidden" style="font-family: 'Inter', sans-serif; background: #faf9fe;">
    <!-- Toolbar -->
    <header class="flex items-center justify-between px-6 flex-shrink-0 z-20 shadow-sm"
      style="height: 64px; background: #ffffff; border-bottom: 1px solid #e3e2e7;">
      <div class="flex items-center gap-4">
        <button @click="router.push('/transformations')"
          class="flex items-center gap-2 text-sm font-bold transition-all hover:opacity-60"
          style="color: #414755;">
          <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
          Back
        </button>
        <div class="h-6 w-px bg-slate-200"></div>
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-blue-50">
            <span class="material-symbols-outlined" style="font-size: 20px; color: #0058bc;">transform</span>
          </div>
          <div>
            <h1 class="text-sm font-black text-slate-900 leading-none mb-0.5">
              {{ transformation?.name || 'Loading...' }}
            </h1>
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">
              Data Transformation Designer
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button @click="fitView" class="p-2 rounded-xl hover:bg-slate-100 text-slate-400" title="Fit View">
          <span class="material-symbols-outlined">fit_screen</span>
        </button>
        <div class="h-6 w-px bg-slate-200 mx-1"></div>
        <div v-if="saving" class="flex items-center gap-2 text-xs font-bold text-slate-400">
          <span class="material-symbols-outlined animate-spin" style="font-size: 16px;">progress_activity</span>
          Saving...
        </div>
        <button @click="handleSave"
          class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-blue-100"
          style="background: #0058bc; color: #ffffff;">
          <span class="material-symbols-outlined" style="font-size: 18px;">save</span>
          Save Changes
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Canvas Area -->
      <main class="flex-1 relative bg-slate-50 overflow-hidden">
        
        <!-- Background Guide Lines (Vertical separators) -->
        <div class="absolute inset-0 flex pointer-events-none z-0 opacity-50">
          <div class="w-[320px] border-r border-slate-200 h-full"></div>
          <div class="flex-1"></div>
          <div class="w-[320px] border-l border-slate-200 h-full"></div>
        </div>

        <!-- Floating Draggable Tx Tools Palette -->
        <div 
          class="absolute z-20"
          :style="{ left: palettePos.x + 'px', top: palettePos.y + 'px' }"
        >
          <div class="bg-white rounded-2xl border p-3 shadow-2xl flex flex-col gap-1 items-center" 
            style="border-color: #e3e2e7; min-width: 120px;">
            
            <div 
              class="w-full flex justify-center mb-2 opacity-20 cursor-move py-1 hover:opacity-50 transition-opacity"
              @mousedown="startPaletteDrag"
            >
              <span class="material-symbols-outlined" style="font-size: 16px;">drag_indicator</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div v-if="txCatalog.loading" class="p-2 animate-spin text-slate-400 col-span-2">
                <span class="material-symbols-outlined">progress_activity</span>
              </div>
              <template v-else>
                <div v-for="tool in dynamicTools" :key="tool.id"
                  class="w-10 h-10 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-all hover:bg-slate-50 group relative"
                  draggable="true"
                  @dragstart="onToolDragStart($event, tool)"
                  :title="tool.label">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" :style="{ background: tool.bg }">
                    <span v-if="isEmoji(tool.icon)" class="text-lg">{{ tool.icon }}</span>
                    <span v-else class="material-symbols-outlined text-white text-[18px]">{{ tool.icon }}</span>
                  </div>
                  <div class="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-30 shadow-lg">
                    {{ tool.label }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Vue Flow Canvas -->
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          :snap-to-grid="true"
          :snap-grid="[20, 20]"
          :default-edge-options="{ 
            type: 'smoothstep', 
            animated: true, 
            style: { stroke: '#94a3b8', strokeWidth: 2 } 
          }"
          class="transformation-canvas"
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @connect="onConnect"
          @schema-loaded="onSchemaLoaded"
          @drop="onDrop"
          @dragover.prevent>
          <Background :gap="20" pattern-color="#e2e8f0" />
        </VueFlow>
      </main>

      <!-- Right: Fixed Properties Panel -->
      <aside class="w-80 bg-white border-l z-30 shadow-xl flex flex-col shrink-0"
        style="border-color: #e3e2e7;">
        
        <div class="p-4 border-b flex items-center justify-between bg-slate-50">
          <h2 class="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">settings</span>
            Properties
          </h2>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="selectedNode && !['input', 'output'].includes(selectedNode.type)" class="p-6 space-y-8">
            <!-- Global Info -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Node Name</label>
              <input v-model="selectedNode.data.label"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none border transition-all shadow-inner"
                style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;" />
            </div>
            
            <!-- Parameters: INPUTS (Read-only) -->
            <div v-if="selectedNode.data.properties?.some(p => p.nature === 'input')" class="space-y-4">
              <div class="flex items-center gap-2">
                <div class="h-px flex-1 bg-slate-100"></div>
                <span class="text-[9px] font-black uppercase tracking-widest text-blue-500">Connections (Pins)</span>
                <div class="h-px flex-1 bg-slate-100"></div>
              </div>
              
              <div v-for="(prop, idx) in selectedNode.data.properties.filter(p => p.nature === 'input')" :key="prop.name" class="space-y-1">
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {{ prop.name }}
                </label>
                <div class="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-50 border border-blue-100 text-blue-700 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px]">link</span>
                  <span v-if="getConnectedSourceForNodeHandle(selectedNode.id, `p_${idx}`)">
                    Connected to: {{ getConnectedSourceForNodeHandle(selectedNode.id, `p_${idx}`) }}
                  </span>
                  <span v-else class="text-blue-300 italic">No field connected</span>
                </div>
              </div>
            </div>

            <!-- Parameters: VARIABLES (Editable) -->
            <div v-if="selectedNode.data.properties?.some(p => p.nature === 'variable')" class="space-y-6">
              <div class="flex items-center gap-2">
                <div class="h-px flex-1 bg-slate-100"></div>
                <span class="text-[9px] font-black uppercase tracking-widest text-amber-500">Variables (Editor)</span>
                <div class="h-px flex-1 bg-slate-100"></div>
              </div>
              
              <div v-for="prop in selectedNode.data.properties.filter(p => p.nature === 'variable')" :key="prop.name" class="space-y-2">
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {{ prop.name }} <span v-if="prop.required" class="text-red-500">*</span>
                </label>
                
                <template v-if="prop.type === 'textarea'">
                  <textarea v-model="selectedNode.data.values[prop.name]" rows="6"
                    class="w-full px-4 py-2.5 rounded-xl text-xs font-mono outline-none border transition-all shadow-inner"
                    style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"></textarea>
                </template>
                
                <template v-else-if="prop.type === 'boolean'">
                  <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <input type="checkbox" v-model="selectedNode.data.values[prop.name]" class="w-4 h-4 rounded border-slate-300" />
                    <span class="text-xs font-medium text-slate-600">Active</span>
                  </div>
                </template>

                <template v-else-if="prop.type === 'select'">
                  <select v-model="selectedNode.data.values[prop.name]"
                    class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all shadow-inner"
                    style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;">
                    <option v-for="opt in prop.options" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </template>

                <template v-else>
                  <input v-model="selectedNode.data.values[prop.name]"
                    :type="prop.type === 'number' ? 'number' : 'text'"
                    class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all shadow-inner"
                    style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;" />
                </template>
              </div>
            </div>
          </div>

          <div v-else-if="selectedEdge" class="p-6 space-y-6">
            <div class="p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <h3 class="text-xs font-black uppercase tracking-widest text-blue-600 mb-2">Selected Connection</h3>
              <p class="text-[10px] font-bold text-blue-400 leading-relaxed">
                Press <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">DEL</span> or <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">BSPC</span> to remove this connection.
              </p>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center h-full p-8 text-center opacity-40">
            <span class="material-symbols-outlined text-4xl mb-2">touch_app</span>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Select a transformation node or connection to edit its properties</p>
          </div>
        </div>

        <div v-if="selectedNode && !['input', 'output'].includes(selectedNode.type)" class="p-4 bg-slate-50 border-t" style="border-color: #e3e2e7;">
          <button @click="deleteSelectedNode" class="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            <span class="material-symbols-outlined text-[16px]">delete</span>
            Delete Node
          </button>
        </div>
        <div v-else-if="selectedEdge" class="p-4 bg-slate-50 border-t" style="border-color: #e3e2e7;">
          <button @click="deleteSelectedEdge" class="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            <span class="material-symbols-outlined text-[16px]">link_off</span>
            Remove Connection
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, markRaw, toRaw, computed, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VueFlow, useVueFlow, addEdge } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { useTransformationsStore, type DataTransformation } from '../stores/transformations';
import { useAuthStore } from '../stores/auth';
import { useTxNodeTypeCatalogStore } from '../stores/txNodeTypeCatalog';
import TxNode from '../components/designer/TxNode.vue';
import SchemaNode from '../components/designer/SchemaNode.vue';

const nodeTypes = {
  schemaInput: markRaw(SchemaNode),
  schemaOutput: markRaw(SchemaNode),
  txNode: markRaw(TxNode),
  source: markRaw(TxNode), target: markRaw(TxNode), mapper: markRaw(TxNode), filter: markRaw(TxNode), script: markRaw(TxNode),
};

const route = useRoute();
const router = useRouter();
const store = useTransformationsStore();
const auth = useAuthStore();
const txCatalog = useTxNodeTypeCatalogStore();

const transformation = ref<DataTransformation | null>(null);
const saving = ref(false);
const selectedNode = ref<any>(null);
const selectedEdge = ref<any>(null);
const palettePos = reactive({ x: 340, y: 80 });
const draggingPalette = ref(false);

const { project, addNodes, fitView, toObject, removeNodes, removeEdges, onViewportChange, findNode, getEdges } = useVueFlow();
const nodes = ref<any[]>([]);
const edges = ref<any[]>([]);

const onConnect = (params: any) => { edges.value = addEdge(params, edges.value); };
const isEmoji = (str?: string | null) => str ? /\p{Emoji}/u.test(str) : false;

const dynamicTools = computed(() => txCatalog.entries.map(e => ({
  id: e.id, type: 'txNode', label: e.name, icon: e.icon || 'transform', bg: e.color || '#0058bc',
  inputs: e.properties.filter(p => p.nature === 'input').map((p, idx) => ({ id: `p_${idx}`, label: p.name })),
  properties: e.properties
})));

const getConnectedSourceForNodeHandle = (nodeId: string, handleId: string) => {
  const edge = getEdges.value.find(e => e.target === nodeId && e.targetHandle === handleId);
  if (!edge) return null;
  const sourceNode = findNode(edge.source);
  if (sourceNode && sourceNode.type === 'input') {
    const field = sourceNode.data.fields.find((f: any) => f.id === edge.sourceHandle);
    return field ? field.name : null;
  }
  return null;
};

const onSchemaLoaded = ({ nodeId, schema }: { nodeId: string, schema: any }) => {
  const node = findNode(nodeId);
  if (!node) return;
  const fields: Array<{ id: string; name: string }> = [];
  const parseProperties = (obj: any, prefix = '') => {
    const props = obj.properties || {};
    Object.keys(props).forEach(key => {
      const fieldName = prefix ? `${prefix}.${key}` : key;
      const prop = props[key];
      if (prop.type === 'object' && prop.properties) parseProperties(prop, fieldName);
      else fields.push({ id: `${nodeId}_f_${fieldName}`, name: fieldName });
    });
  };
  if (schema.properties) parseProperties(schema);
  else if (schema.items && schema.items.properties) parseProperties(schema.items);
  if (fields.length > 0) node.data = { ...node.data, fields };
};

const HEADER_HEIGHT = 64;
const getSchemaNodeHeight = (zoom = 1) => (window.innerHeight - HEADER_HEIGHT) / zoom;

const initializeDefaultNodes = () => {
  const h = getSchemaNodeHeight();
  return [
    {
      id: 'input-schema', type: 'schemaInput', position: { x: 0, y: 0 },
      style: { width: '320px', height: `${h}px`, overflow: 'hidden' },
      draggable: false, selectable: false, deletable: false,
      data: {
        side: 'input',
        height: h,
        fields: Array.from({ length: 15 }, (_, i) => ({ id: `input-schema_f_${i}`, name: `field_source_${i+1}` })),
        onSchemaLoaded: (schema: any) => onSchemaLoaded({ nodeId: 'input-schema', schema })
      }
    },
    {
      id: 'output-schema', type: 'schemaOutput', position: { x: 800, y: 0 },
      style: { width: '320px', height: `${h}px`, overflow: 'hidden' },
      draggable: false, selectable: false, deletable: false,
      data: {
        side: 'output',
        height: h,
        fields: Array.from({ length: 15 }, (_, i) => ({ id: `output-schema_f_${i}`, name: `target_property_${i+1}` })),
        onSchemaLoaded: (schema: any) => onSchemaLoaded({ nodeId: 'output-schema', schema })
      }
    }
  ];
};

onViewportChange(({ x, y, zoom }) => {
  const h = getSchemaNodeHeight(zoom);
  const nodeStyle = { width: '320px', height: `${h}px`, overflow: 'hidden' };
  const inputNode = findNode('input-schema');
  if (inputNode) {
    inputNode.position = { x: -x / zoom, y: -y / zoom };
    inputNode.style = nodeStyle;
    inputNode.data = { ...inputNode.data, height: h };
  }
  const outputNode = findNode('output-schema');
  if (outputNode) {
    const canvasWidth = window.innerWidth - 320;
    outputNode.position = { x: (canvasWidth - 320 - x) / zoom, y: -y / zoom };
    outputNode.style = nodeStyle;
    outputNode.data = { ...outputNode.data, height: h };
  }
});

const onWindowResize = () => {
  const h = getSchemaNodeHeight();
  const nodeStyle = { width: '320px', height: `${h}px`, overflow: 'hidden' };
  const inputNode = findNode('input-schema');
  if (inputNode) { inputNode.style = nodeStyle; inputNode.data = { ...inputNode.data, height: h }; }
  const outputNode = findNode('output-schema');
  if (outputNode) { outputNode.style = nodeStyle; outputNode.data = { ...outputNode.data, height: h }; }
};

const startPaletteDrag = (e: MouseEvent) => {
  draggingPalette.value = true;
  const startX = e.clientX - palettePos.x;
  const startY = e.clientY - palettePos.y;
  const onMouseMove = (moveE: MouseEvent) => { palettePos.x = moveE.clientX - startX; palettePos.y = moveE.clientY - startY; };
  const onMouseUp = () => { draggingPalette.value = false; window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)) return;
    if (selectedNode.value && !['input', 'output'].includes(selectedNode.value.type)) { removeNodes([selectedNode.value.id]); selectedNode.value = null; }
    else if (selectedEdge.value) { removeEdges([selectedEdge.value.id]); selectedEdge.value = null; }
  }
};

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', onWindowResize);
  const id = route.params.id as string;
  try {
    const token = await auth.getToken();
    const env = (window as any).NEXUS_ENV || import.meta.env;
    const bffBase = env.VITE_API_URL || env.API_URL || 'http://localhost:3001';
    await txCatalog.fetch();
    const res = await fetch(`${bffBase}/transformations/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      transformation.value = await res.json();
      if (transformation.value?.definition) {
        const flow = transformation.value.definition;
        nodes.value = flow.nodes || [];
        edges.value = flow.edges || [];
        const initH = getSchemaNodeHeight();
        const initStyle = { width: '320px', height: `${initH}px`, overflow: 'hidden' };
        nodes.value.forEach(n => {
          if (n.id === 'input-schema' || n.id === 'output-schema') {
            n.type = n.id === 'input-schema' ? 'schemaInput' : 'schemaOutput';
            n.style = initStyle;
            n.data.side = n.id === 'input-schema' ? 'input' : 'output';
            n.data.height = initH;
            n.data.onSchemaLoaded = (schema: any) => onSchemaLoaded({ nodeId: n.id, schema });
          }
        });
        if (!nodes.value.find(n => n.id === 'input-schema')) nodes.value.push(initializeDefaultNodes()[0]);
        if (!nodes.value.find(n => n.id === 'output-schema')) nodes.value.push(initializeDefaultNodes()[1]);
      } else nodes.value = initializeDefaultNodes();
    }
    setTimeout(() => fitView(), 100);
  } catch (err) { console.error(err); }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', onWindowResize);
});
const onNodeClick = (event: any) => { selectedNode.value = event.node; selectedEdge.value = null; };
const onEdgeClick = (event: any) => { selectedEdge.value = event.edge; selectedNode.value = null; };
const deleteSelectedNode = () => { if (selectedNode.value) { removeNodes([selectedNode.value.id]); selectedNode.value = null; } };
const deleteSelectedEdge = () => { if (selectedEdge.value) { removeEdges([selectedEdge.value.id]); selectedEdge.value = null; } };
const onToolDragStart = (event: DragEvent, tool: any) => { if (event.dataTransfer) { event.dataTransfer.setData('application/vueflow-tool', JSON.stringify(tool)); event.dataTransfer.effectAllowed = 'move'; } };
const onDrop = (event: DragEvent) => {
  const toolData = event.dataTransfer?.getData('application/vueflow-tool');
  if (!toolData) return;
  const tool = JSON.parse(toolData);
  const position = project({ x: event.clientX, y: event.clientY });
  addNodes([{ id: `node_${Date.now()}`, type: tool.type, position, data: { label: tool.label, icon: tool.icon, bg: tool.bg, inputs: JSON.parse(JSON.stringify(tool.inputs)), properties: tool.properties, values: {} } }]);
};
const handleSave = async () => {
  if (!transformation.value) return;
  saving.value = true;
  try {
    const flow = toObject();
    await store.updateTransformation(transformation.value.id, { definition: toRaw(flow) });
    saving.value = false;
  } catch (err) { console.error(err); saving.value = false; }
};
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
.transformation-canvas { width: 100%; height: 100%; }
/* Schema panel nodes: reset VueFlow built-in node styling */
.vue-flow__node-schemaInput,
.vue-flow__node-schemaOutput {
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  background: transparent !important;
  border-radius: 0 !important;
}
.vue-flow__edge-path { stroke-dasharray: 5; animation: dash 1s linear infinite; }
.vue-flow__edge.selected .vue-flow__edge-path { stroke: #3b82f6 !important; stroke-width: 3; filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5)); }
@keyframes dash { from { stroke-dashoffset: 10; } to { stroke-dashoffset: 0; } }
.vue-flow__node-input, .vue-flow__node-output { z-index: 5 !important; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>
