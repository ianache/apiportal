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
        <!-- View Toggle -->
        <div class="flex items-center p-1 rounded-xl bg-slate-100 mr-2">
          <button @click="viewTab = 'design'" 
            class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
            :class="viewTab === 'design' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            <span class="material-symbols-outlined text-[18px]">grid_view</span>
            Design
          </button>
          <button @click="viewTab = 'code'"
            class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
            :class="viewTab === 'code' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            <span class="material-symbols-outlined text-[18px]">code</span>
            Code
          </button>
        </div>

        <!-- AI Generate Action -->
        <button @click="openAiGenerateModal"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 border border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-100"
          title="AI Generate Script">
          <span class="material-symbols-outlined" style="font-size: 18px;">auto_awesome</span>
          AI Generate
        </button>

        <div class="h-6 w-px bg-slate-200 mx-1"></div>
        
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
    <div class="flex-1 flex overflow-hidden relative">
      
      <!-- Design View -->
      <div v-show="viewTab === 'design'" class="flex-1 flex overflow-hidden">
        <!-- Left: Canvas Area -->
        <main class="flex-1 relative bg-slate-50 overflow-hidden">
          
          <!-- Background Guide Lines -->
          <div class="absolute inset-0 flex pointer-events-none z-0 opacity-50">
            <div class="w-[320px] border-r border-slate-200 h-full"></div>
            <div class="flex-1"></div>
            <div class="w-[320px] border-l border-slate-200 h-full"></div>
          </div>

          <!-- Floating Draggable Tx Tools Palette -->
          <div class="absolute z-20" :style="{ left: palettePos.x + 'px', top: palettePos.y + 'px' }">
            <div class="bg-white rounded-2xl border p-3 shadow-2xl flex flex-col gap-1 items-center" 
              style="border-color: #e3e2e7; min-width: 120px;">
              <div class="w-full flex justify-center mb-2 opacity-20 cursor-move py-1 hover:opacity-50 transition-opacity"
                @mousedown="startPaletteDrag">
                <span class="material-symbols-outlined" style="font-size: 16px;">drag_indicator</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div v-if="txCatalog.loading" class="p-2 animate-spin text-slate-400 col-span-2">
                  <span class="material-symbols-outlined">progress_activity</span>
                </div>
                <template v-else>
                  <div v-for="tool in dynamicTools" :key="tool.id"
                    class="w-10 h-10 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-all hover:bg-slate-50 group relative"
                    draggable="true" @dragstart="onToolDragStart($event, tool)" :title="tool.label">
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

          <VueFlow
            v-model:nodes="nodes" v-model:edges="edges" :node-types="nodeTypes" :snap-to-grid="true" :snap-grid="[20, 20]"
            :default-edge-options="{ type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } }"
            class="transformation-canvas" @node-click="onNodeClick" @edge-click="onEdgeClick" @connect="onConnect"
            @schema-loaded="onSchemaLoaded" @drop="onDrop" @dragover.prevent>
            <Background :gap="20" pattern-color="#e2e8f0" />
          </VueFlow>
        </main>

        <!-- Right: Fixed Properties Panel -->
        <aside class="w-80 bg-white border-l z-30 shadow-xl flex flex-col shrink-0" style="border-color: #e3e2e7;">
          <div class="p-4 border-b flex items-center justify-between bg-slate-50">
            <h2 class="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">settings</span>
              Properties
            </h2>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div v-if="selectedNode && !['input', 'output'].includes(selectedNode.type)" class="p-6 space-y-8">
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Node Name</label>
                <input v-model="selectedNode.data.label" type="text"
                  class="w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none border transition-all shadow-inner"
                  style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;" />
              </div>
              <div v-if="selectedNode.data.properties?.some(p => p.nature === 'input')" class="space-y-4">
                <div class="flex items-center gap-2">
                  <div class="h-px flex-1 bg-slate-100"></div>
                  <span class="text-[9px] font-black uppercase tracking-widest text-blue-500">Connections (Pins)</span>
                  <div class="h-px flex-1 bg-slate-100"></div>
                </div>
                <div v-for="(prop, idx) in selectedNode.data.properties.filter(p => p.nature === 'input')" :key="prop.name" class="space-y-1">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">{{ prop.name }}</label>
                  <div class="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-50 border border-blue-100 text-blue-700 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">link</span>
                    <span v-if="getConnectedSourceForNodeHandle(selectedNode.id, `p_${idx}`)">Connected to: {{ getConnectedSourceForNodeHandle(selectedNode.id, `p_${idx}`) }}</span>
                    <span v-else class="text-blue-300 italic">No field connected</span>
                  </div>
                </div>
              </div>
              <div v-if="selectedNode.data.properties?.some(p => p.nature === 'variable')" class="space-y-6">
                <div class="flex items-center gap-2">
                  <div class="h-px flex-1 bg-slate-100"></div>
                  <span class="text-[9px] font-black uppercase tracking-widest text-amber-500">Variables (Editor)</span>
                  <div class="h-px flex-1 bg-slate-100"></div>
                </div>
                <div v-for="prop in selectedNode.data.properties.filter(p => p.nature === 'variable')" :key="prop.name" class="space-y-2">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">{{ prop.name }} <span v-if="prop.required" class="text-red-500">*</span></label>
                  <template v-if="prop.type === 'textarea'">
                    <textarea v-model="selectedNode.data.values[prop.name]" rows="6" class="w-full px-4 py-2.5 rounded-xl text-xs font-mono outline-none border transition-all shadow-inner" style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;"></textarea>
                  </template>
                  <template v-else-if="prop.type === 'boolean'">
                    <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <input type="checkbox" v-model="selectedNode.data.values[prop.name]" class="w-4 h-4 rounded border-slate-300" />
                      <span class="text-xs font-medium text-slate-600">Active</span>
                    </div>
                  </template>
                  <template v-else-if="prop.type === 'select'">
                    <select v-model="selectedNode.data.values[prop.name]" class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all shadow-inner" style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;">
                      <option v-for="opt in prop.options" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                  </template>
                  <template v-else>
                    <input v-model="selectedNode.data.values[prop.name]" :type="prop.type === 'number' ? 'number' : 'text'" class="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all shadow-inner" style="background: #f4f3f8; border-color: #e3e2e7; color: #1a1b1f;" />
                  </template>
                </div>
              </div>
            </div>
            <div v-else-if="selectedEdge" class="p-6 space-y-6">
              <div class="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <h3 class="text-xs font-black uppercase tracking-widest text-blue-600 mb-2">Selected Connection</h3>
                <p class="text-[10px] font-bold text-blue-400 leading-relaxed">Press <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">DEL</span> or <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">BSPC</span> to remove this connection.</p>
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

      <!-- Code View -->
      <div v-show="viewTab === 'code'" class="flex-1 flex flex-col bg-slate-900 p-8 overflow-hidden relative">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <span class="material-symbols-outlined text-blue-400">code</span>
            </div>
            <div>
              <h2 class="text-lg font-black text-white leading-none">Transformation Script</h2>
              <p class="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                Language: {{ transformation?.language || 'Unknown' }}
              </p>
            </div>
          </div>
          <button @click="copyToClipboard(transformation?.code || '')"
            class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">content_copy</span>
            Copy Script
          </button>
        </div>
        
        <div class="flex-1 bg-black/40 rounded-2xl border border-white/10 shadow-2xl p-6 relative overflow-hidden">
          <textarea v-if="transformation"
            v-model="transformation.code"
            class="w-full h-full bg-transparent text-green-400 font-mono text-sm outline-none resize-none custom-scrollbar"
            placeholder="// No code generated yet. Use 'AI Generate' to create a script."></textarea>
          <div v-if="!transformation?.code" class="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none">
            <span class="material-symbols-outlined text-6xl mb-4">auto_awesome</span>
            <p class="font-bold uppercase tracking-widest">No script generated yet</p>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Generate Modal -->
    <div v-if="aiModal.open" class="fixed inset-0 z-[100] flex items-center justify-center p-6" style="background:rgba(26,27,31,0.55);backdrop-filter:blur(4px);">
      <div class="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-purple-600 text-2xl">auto_awesome</span>
          </div>
          <h2 class="text-2xl font-black text-slate-900">AI Generate Script</h2>
        </div>
        <div class="space-y-6">
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Select Template Language</label>
            <div class="grid grid-cols-2 gap-3">
              <button @click="aiModal.language = 'velocity'" 
                class="flex flex-col items-center gap-3 p-4 rounded-2xl border-2"
                :class="aiModal.language === 'velocity' ? 'border-purple-600 bg-purple-50' : 'border-slate-100'">
                <span class="material-symbols-outlined text-3xl">rocket_launch</span>
                <span class="text-sm font-black">Apache Velocity</span>
              </button>
              <button @click="aiModal.language = 'mustache'"
                class="flex flex-col items-center gap-3 p-4 rounded-2xl border-2"
                :class="aiModal.language === 'mustache' ? 'border-purple-600 bg-purple-50' : 'border-slate-100'">
                <span class="material-symbols-outlined text-3xl">face</span>
                <span class="text-sm font-black">Mustache</span>
              </button>
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-8">
          <button @click="aiModal.open = false" class="flex-1 py-3 px-6 rounded-2xl font-bold border">Cancel</button>
          <button @click="generateAiScript" :disabled="!aiModal.language || aiModal.generating" 
            class="flex-1 py-3 px-6 rounded-2xl font-bold bg-purple-600 text-white disabled:opacity-50">
            {{ aiModal.generating ? 'Generating...' : 'Generate' }}
          </button>
        </div>
      </div>
    </div>

    <!-- AI Result Modal -->
    <div v-if="aiModal.result" class="fixed inset-0 z-[110] flex items-center justify-center p-6" style="background:rgba(26,27,31,0.55);backdrop-filter:blur(4px);">
      <div class="bg-white rounded-[32px] w-full max-w-3xl p-8 shadow-2xl flex flex-col max-h-[85vh]">
        <h2 class="text-xl font-black mb-6">Generated {{ aiModal.language }} Script</h2>
        <div class="flex-1 overflow-y-auto bg-slate-900 rounded-2xl p-6 font-mono text-sm text-green-400">
          <pre class="whitespace-pre-wrap">{{ aiModal.result }}</pre>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="aiModal.result = ''" class="flex-1 py-3 px-6 rounded-2xl font-bold border">Close</button>
          <button @click="applyAiScript" class="flex-1 py-3 px-6 rounded-2xl font-bold bg-blue-600 text-white">Apply Script</button>
        </div>
      </div>
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
import { useLLMPreferencesStore } from '../stores/preferences';
import TxNode from '../components/designer/TxNode.vue';
import SchemaNode from '../components/designer/SchemaNode.vue';

const nodeTypes = {
  input: markRaw(SchemaNode), output: markRaw(SchemaNode), txNode: markRaw(TxNode),
  source: markRaw(TxNode), target: markRaw(TxNode), mapper: markRaw(TxNode), filter: markRaw(TxNode), script: markRaw(TxNode),
};

const route = useRoute();
const router = useRouter();
const store = useTransformationsStore();
const auth = useAuthStore();
const txCatalog = useTxNodeTypeCatalogStore();
const llmStore = useLLMPreferencesStore();

const transformation = ref<DataTransformation | null>(null);
const saving = ref(false);
const selectedNode = ref<any>(null);
const selectedEdge = ref<any>(null);
const palettePos = reactive({ x: 340, y: 80 });
const viewTab = ref<'design' | 'code'>('design');
const aiModal = reactive({ open: false, language: '' as 'velocity' | 'mustache' | '', generating: false, result: '' });

const { project, addNodes, fitView, setViewport, toObject, removeNodes, removeEdges, onViewportChange, findNode, getEdges } = useVueFlow();
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
  if (sourceNode?.type === 'input') {
    return sourceNode.data.fields.find((f: any) => f.id === edge.sourceHandle)?.name || null;
  }
  return null;
};

const onSchemaLoaded = ({ nodeId, schema }: { nodeId: string, schema: any }) => {
  const node = findNode(nodeId);
  if (!node) return;
  const fields: any[] = [];
  const parse = (obj: any, prefix = '') => {
    const props = obj.properties || {};
    Object.keys(props).forEach(key => {
      const name = prefix ? `${prefix}.${key}` : key;
      if (props[key].type === 'object' && props[key].properties) parse(props[key], name);
      else fields.push({ id: `${nodeId}_f_${name}`, name });
    });
  };
  if (schema.properties) parse(schema);
  else if (schema.items?.properties) parse(schema.items);
  if (fields.length) node.data = { ...node.data, fields };
};

const HEADER_H = 64;
const schemaNodeStyle = (zoom = 1) => ({ width: '320px', height: `${(window.innerHeight - HEADER_H) / zoom}px` });
const schemaNodeData = (side, fields = []) => ({
  side, height: window.innerHeight - HEADER_H, fields,
  onSchemaLoaded: (s) => onSchemaLoaded({ nodeId: side === 'input' ? 'input-schema' : 'output-schema', schema: s })
});
const initializeDefaultNodes = () => [
  { id: 'input-schema', type: 'input', position: { x: 0, y: 0 }, draggable: false, selectable: false, deletable: false,
    style: schemaNodeStyle(), data: schemaNodeData('input') },
  { id: 'output-schema', type: 'output', position: { x: 0, y: 0 }, draggable: false, selectable: false, deletable: false,
    style: schemaNodeStyle(), data: schemaNodeData('output') }
];

onViewportChange(({ x, y, zoom }) => {
  const s = schemaNodeStyle(zoom);
  const h = (window.innerHeight - HEADER_H) / zoom;
  const iNode = findNode('input-schema');
  if (iNode) { iNode.position = { x: -x / zoom, y: -y / zoom }; iNode.style = s; iNode.data = { ...iNode.data, height: h }; }
  const oNode = findNode('output-schema');
  if (oNode) { oNode.position = { x: (window.innerWidth - 640 - x) / zoom, y: -y / zoom }; oNode.style = s; oNode.data = { ...oNode.data, height: h }; }
});
const onWindowResize = () => {
  const s = schemaNodeStyle(); const h = window.innerHeight - HEADER_H;
  const iNode = findNode('input-schema'); if (iNode) { iNode.style = s; iNode.data = { ...iNode.data, height: h }; }
  const oNode = findNode('output-schema'); if (oNode) { oNode.style = s; oNode.data = { ...oNode.data, height: h }; }
};

const startPaletteDrag = (e: MouseEvent) => {
  const startX = e.clientX - palettePos.x, startY = e.clientY - palettePos.y;
  const move = (me: MouseEvent) => { palettePos.x = me.clientX - startX; palettePos.y = me.clientY - startY; };
  const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.key === 'Delete' || e.key === 'Backspace') && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
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
    const bff = (window as any).NEXUS_ENV?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
    await txCatalog.fetch(); await llmStore.fetchFromDB();
    const res = await fetch(`${bff}/transformations/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      transformation.value = await res.json();
      const initH = window.innerHeight - HEADER_H;
      const initStyle = schemaNodeStyle();
      if (transformation.value?.definition) {
        const def = transformation.value.definition; nodes.value = def.nodes || []; edges.value = def.edges || [];
        nodes.value.forEach(n => {
          if (['input-schema', 'output-schema'].includes(n.id)) {
            n.type = n.id === 'input-schema' ? 'input' : 'output';
            n.style = initStyle;
            n.data = { ...n.data, side: n.id === 'input-schema' ? 'input' : 'output', height: initH,
              onSchemaLoaded: (s) => onSchemaLoaded({ nodeId: n.id, schema: s }) };
          }
        });
        if (!nodes.value.find(n => n.id === 'input-schema')) nodes.value.push(initializeDefaultNodes()[0]);
        if (!nodes.value.find(n => n.id === 'output-schema')) nodes.value.push(initializeDefaultNodes()[1]);
        if (def.inputSchema?.length) { const iN = nodes.value.find(n => n.id === 'input-schema'); if (iN) iN.data.fields = def.inputSchema; }
        if (def.outputSchema?.length) { const oN = nodes.value.find(n => n.id === 'output-schema'); if (oN) oN.data.fields = def.outputSchema; }
      } else nodes.value = initializeDefaultNodes();
    }
    setTimeout(() => {
      const txIds = nodes.value.filter(n => n.id !== 'input-schema' && n.id !== 'output-schema').map(n => n.id);
      if (txIds.length > 0) fitView({ nodes: txIds, padding: 0.2 });
      else setViewport({ x: 0, y: 0, zoom: 1 });
    }, 150);
  } catch (err) { console.error(err); }
});

onUnmounted(() => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('resize', onWindowResize); });
const onNodeClick = (e: any) => { selectedNode.value = e.node; selectedEdge.value = null; };
const onEdgeClick = (e: any) => { selectedEdge.value = e.edge; selectedNode.value = null; };
const deleteSelectedNode = () => { if (selectedNode.value) { removeNodes([selectedNode.value.id]); selectedNode.value = null; } };
const deleteSelectedEdge = () => { if (selectedEdge.value) { removeEdges([selectedEdge.value.id]); selectedEdge.value = null; } };
const onToolDragStart = (e: DragEvent, t: any) => { if (e.dataTransfer) { e.dataTransfer.setData('application/vueflow-tool', JSON.stringify(t)); e.dataTransfer.effectAllowed = 'move'; } };
const onDrop = (e: DragEvent) => {
  const tData = e.dataTransfer?.getData('application/vueflow-tool'); if (!tData) return;
  const tool = JSON.parse(tData), pos = project({ x: e.clientX, y: e.clientY });
  addNodes([{ id: `node_${Date.now()}`, type: tool.type, position: pos, data: { label: tool.label, icon: tool.icon, bg: tool.bg, inputs: JSON.parse(JSON.stringify(tool.inputs)), properties: tool.properties, values: {} } }]);
};

const openAiGenerateModal = () => { aiModal.language = ''; aiModal.result = ''; aiModal.open = true; };
const generateAiScript = async () => {
  if (!aiModal.language) return; aiModal.generating = true;
  try {
    const context = { input: findNode('input-schema')?.data.fields, output: findNode('output-schema')?.data.fields, nodes: toObject().nodes.filter(n => !['input', 'output'].includes(n.type)), edges: toObject().edges, lang: aiModal.language };
    const prompt = `Generate a ${aiModal.language.toUpperCase()} mapping script for this context: ${JSON.stringify(context)}. Return ONLY code.`;
    const bff = (window as any).NEXUS_ENV?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${bff}/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.getToken()}` }, body: JSON.stringify({ provider: llmStore.provider, apiKey: llmStore.currentApiKey, model: llmStore.model, messages: [{ role: 'user', content: prompt }] }) });
    if (!res.ok) throw new Error(); aiModal.result = (await res.json()).content; aiModal.open = false;
  } catch (err) { alert('AI Generation failed'); } finally { aiModal.generating = false; }
};
const applyAiScript = () => { if (transformation.value) { transformation.value.code = aiModal.result; transformation.value.language = aiModal.language; handleSave(); viewTab.value = 'code'; } aiModal.result = ''; };
const copyToClipboard = (t: string) => navigator.clipboard.writeText(t);
const handleSave = async () => {
  if (!transformation.value) return; saving.value = true;
  try {
    const flow = toRaw(toObject());
    const iFields = findNode('input-schema')?.data.fields || [];
    const oFields = findNode('output-schema')?.data.fields || [];
    const definition = { ...flow, inputSchema: iFields, outputSchema: oFields };
    await store.updateTransformation(transformation.value.id, {
      definition, code: transformation.value.code, language: transformation.value.language
    });
  } catch (err) { console.error(err); } finally { saving.value = false; }
};
</script>

<style>
@import '@vue-flow/core/dist/style.css'; @import '@vue-flow/core/dist/theme-default.css';
.transformation-canvas { width: 100%; height: 100%; }
.vue-flow__edge-path { stroke-dasharray: 5; animation: dash 1s linear infinite; }
.vue-flow__edge.selected .vue-flow__edge-path { stroke: #3b82f6 !important; stroke-width: 3; filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5)); }
@keyframes dash { from { stroke-dashoffset: 10; } to { stroke-dashoffset: 0; } }
.vue-flow__node-input, .vue-flow__node-output { z-index: 5 !important; border: none !important; box-shadow: none !important; padding: 0 !important; background: transparent !important; border-radius: 0 !important; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>
