<template>
  <div class="fixed inset-0 flex flex-col" style="font-family: 'Inter', sans-serif;">

    <!-- ── Toolbar ─────────────────────────────────────── -->
    <header class="flex items-center justify-between px-4 h-12 flex-shrink-0 z-10"
      style="background:#ffffff; border-bottom:1px solid #e3e2e7;">
      <div class="flex items-center gap-3">
        <button @click="goBack" class="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60" style="color:#414755;">
          <span class="material-symbols-outlined" style="font-size:18px;">arrow_back</span>Back to API
        </button>
        <span style="color:#e3e2e7;">|</span>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined" style="font-size:18px;color:#0058bc;">api</span>
          <span class="text-sm font-semibold" style="color:#1a1b1f;">{{ apiName }} <span style="color:#a0a7b5;">·</span> v{{ version }}</span>
          <span class="px-2 py-0.5 rounded-full text-xs font-bold uppercase" style="background:#eff6ff;color:#0058bc;">OpenAPI 3.1</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- AI Designer -->
        <button @click="showAiPanel = !showAiPanel" class="toolbar-icon-btn ai-btn" :class="{ 'toolbar-icon-btn--active': showAiPanel }" title="AI Designer">
          <span class="material-symbols-outlined" style="font-size:19px;">auto_awesome</span>
        </button>
        <div class="toolbar-divider"></div>
        <!-- Components catalog -->
        <button @click="showComponents = !showComponents" class="toolbar-icon-btn" :class="{ 'toolbar-icon-btn--active': showComponents }" title="Components Catalog">
          <span class="material-symbols-outlined" style="font-size:19px;">dataset</span>
        </button>
        <div class="toolbar-divider"></div>
        <!-- Import / Export -->
        <input ref="fileInputRef" type="file" accept=".yaml,.yml" class="sr-only" @change="onFileImport" />
        <button @click="fileInputRef?.click()" class="toolbar-icon-btn" title="Import YAML (OpenAPI or Design)">
          <span class="material-symbols-outlined" style="font-size:19px;">upload_file</span>
        </button>
        <button @click="snapToGrid = !snapToGrid" class="toolbar-icon-btn" :class="{ 'toolbar-icon-btn--active': snapToGrid }" title="Toggle snap to grid">
          <span class="material-symbols-outlined" style="font-size:19px;">grid_on</span>
        </button>
        <button @click="exportDesignYaml" class="toolbar-icon-btn" title="Export Visual Design YAML">
          <span class="material-symbols-outlined" style="font-size:19px;">device_hub</span>
        </button>
        <button @click="exportYaml" class="toolbar-icon-btn" title="Export OpenAPI 3.1 YAML">
          <span class="material-symbols-outlined" style="font-size:19px;">download</span>
        </button>
        <div class="toolbar-divider"></div>
        <span v-if="saveStatus==='saving'" class="flex items-center gap-1 text-xs font-medium" style="color:#a0a7b5;">
          <span class="material-symbols-outlined" style="font-size:14px;">progress_activity</span>Saving…
        </span>
        <span v-else-if="saveStatus==='saved'" class="flex items-center gap-1 text-xs font-medium" style="color:#047857;">
          <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span>Saved
        </span>
        <span v-else-if="saveStatus==='error'" class="flex items-center gap-1 text-xs font-medium" style="color:#991b1b;">
          <span class="material-symbols-outlined" style="font-size:14px;">error</span>Save failed
        </span>
        <button @click="saveFlow" :disabled="saveStatus==='saving'"
          class="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
          style="background:#0058bc;color:#ffffff;">
          <span class="material-symbols-outlined" style="font-size:16px;">save</span>Save Flow
        </button>
      </div>
    </header>

    <!-- ── Canvas area ─────────────────────────────────── -->
    <div class="flex-1 relative overflow-hidden">

      <!-- Vue Flow -->
      <VueFlow v-model:nodes="nodes" v-model:edges="edges" :node-types="nodeTypes"
        :default-edge-options="defaultEdgeOptions" :connect-on-click="false"
        :snap-to-grid="snapToGrid" :snap-grid="[24, 24]"
        fit-view-on-init class="flow-canvas"
        @node-click="onNodeClick" @edge-click="onEdgeClick" @pane-click="onPaneClick">
        <Background :gap="24" :size="1.5" pattern-color="#d4d2db" variant="dots" />
      </VueFlow>

      <!-- ── LEFT: Components catalog panel ──────────────── -->
      <Transition name="panel-left-slide">
        <aside v-if="showComponents" class="components-panel" @click.stop>
          <div class="panel-header">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined" style="font-size:18px;color:#0058bc;">dataset</span>
              <span class="text-sm font-bold" style="color:#1a1b1f;">Components</span>
            </div>
            <button @click="showComponents=false" class="panel-close">
              <span class="material-symbols-outlined" style="font-size:18px;">close</span>
            </button>
          </div>

          <!-- Add schema -->
          <div class="panel-section">
            <button @click="addSchema" class="btn-add w-full">
              <span class="material-symbols-outlined" style="font-size:16px;">add</span>New Schema
            </button>
          </div>

          <!-- Schema list -->
          <div v-for="schema in components" :key="schema.id" class="schema-card">
            <!-- Card header — always visible -->
            <div class="schema-card-header" @click="toggleSchema(schema.id)" style="cursor:pointer;">
              <span
                class="material-symbols-outlined schema-chevron"
                :class="{ 'schema-chevron--open': !collapsedSchemas.has(schema.id) }"
                style="font-size:18px;color:#a0a7b5;flex-shrink:0;"
              >chevron_right</span>
              <input
                v-model="schema.name"
                class="schema-name-input"
                placeholder="SchemaName"
                @click.stop
              />
              <span v-if="schema.properties.length" class="schema-prop-count">{{ schema.properties.length }}</span>
              <button @click.stop="removeSchema(schema.id)" class="panel-close" title="Remove schema">
                <span class="material-symbols-outlined" style="font-size:16px;">delete</span>
              </button>
            </div>

            <!-- Collapsible body -->
            <div v-if="!collapsedSchemas.has(schema.id)" class="schema-body">
              <input v-model="schema.description" class="panel-input mt-1" placeholder="Description…" />

              <!-- Properties -->
              <div class="mt-2 space-y-1">
                <div v-for="prop in schema.properties" :key="prop.id" class="prop-row">
                  <input v-model="prop.name" class="prop-input" placeholder="field" />
                  <select v-model="prop.type" class="prop-select">
                    <option v-for="t in OPENAPI_TYPES" :key="t" :value="t">{{ t }}</option>
                  </select>
                  <label class="prop-req" :title="prop.required ? 'Required' : 'Optional'">
                    <input type="checkbox" v-model="prop.required" class="sr-only" />
                    <span :style="{ color: prop.required ? '#0058bc' : '#a0a7b5' }" class="material-symbols-outlined" style="font-size:16px;">asterisk</span>
                  </label>
                  <button @click="removeProp(schema, prop.id)" class="panel-close">
                    <span class="material-symbols-outlined" style="font-size:14px;">close</span>
                  </button>
                </div>
              </div>
              <button @click="addProp(schema)" class="btn-add-small mt-2">+ property</button>
            </div>
          </div>

          <div v-if="!components.length" class="px-4 py-6 text-center text-xs" style="color:#a0a7b5;">
            No schemas yet. Add one to reference from operations.
          </div>
        </aside>
      </Transition>

      <!-- ── RIGHT: Properties panel ─────────────────────── -->
      <Transition name="panel-slide">
        <aside v-if="selectedNode || selectedEdge" class="properties-panel" @click.stop>

          <!-- NODE view -->
          <template v-if="selectedNode && panelView === 'node'">
            <div class="panel-header">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined" style="font-size:18px;color:#0058bc;">folder_open</span>
                <span class="text-sm font-bold" style="color:#1a1b1f;">Resource Properties</span>
              </div>
              <button @click="selectedNode=null" class="panel-close">
                <span class="material-symbols-outlined" style="font-size:18px;">close</span>
              </button>
            </div>
            <div class="panel-section">
              <label class="panel-label">Resource Path</label>
              <input v-model="selectedNode.data.path" @input="updateNodeData" class="panel-input" placeholder="/resource" />
              <p class="panel-hint">e.g. <code>/users/{id}</code></p>
            </div>
            <div class="panel-section">
              <label class="panel-label">HTTP Methods</label>
              <div class="space-y-1">
                <div v-for="m in HTTP_METHODS" :key="m.verb" class="method-row">
                  <!-- Toggle -->
                  <label class="method-toggle" :class="{ 'method-toggle--on': hasMethod(m.verb) }">
                    <input type="checkbox" :checked="hasMethod(m.verb)" @change="toggleMethod(m.verb)" class="sr-only" />
                    <span class="method-dot" :style="{ background: m.color }"></span>
                    {{ m.verb }}
                  </label>
                  <!-- Edit button — only when method is active -->
                  <button v-if="hasMethod(m.verb)" @click="openMethodDetail(m.verb)"
                    class="method-edit-btn" title="Configure operation">
                    <span class="material-symbols-outlined" style="font-size:15px;">edit_note</span>
                  </button>
                </div>
              </div>
            </div>
            <div class="panel-section">
              <label class="panel-label">Description</label>
              <textarea v-model="selectedNode.data.description" @input="updateNodeData" class="panel-textarea" rows="3" placeholder="Describe this resource…" />
            </div>
            <div v-if="!selectedNode.data.isRoot" class="panel-section panel-section--danger">
              <button @click="deleteSelectedNode" class="btn-danger">
                <span class="material-symbols-outlined" style="font-size:16px;">delete</span>Remove Resource
              </button>
            </div>
          </template>

          <!-- METHOD DETAIL view -->
          <template v-else-if="selectedNode && panelView === 'method' && selectedMethod">
            <div class="panel-header">
              <button @click="panelView='node'" class="flex items-center gap-1 text-sm font-medium" style="color:#414755;">
                <span class="material-symbols-outlined" style="font-size:18px;">chevron_left</span>
              </button>
              <div class="flex items-center gap-2">
                <span class="method-badge-lg" :style="{ background: methodColor(selectedMethod), color:'#fff' }">{{ selectedMethod }}</span>
                <span class="text-sm font-semibold" style="color:#1a1b1f;">{{ selectedNode.data.path }}</span>
              </div>
              <button @click="selectedNode=null" class="panel-close">
                <span class="material-symbols-outlined" style="font-size:18px;">close</span>
              </button>
            </div>

            <!-- Summary / Description -->
            <div class="panel-section">
              <label class="panel-label">Summary</label>
              <input v-model="opSpec.summary" class="panel-input" placeholder="Short description of the operation" />
            </div>
            <div class="panel-section">
              <label class="panel-label">Description</label>
              <textarea v-model="opSpec.description" class="panel-textarea" rows="2" placeholder="Detailed description…" />
            </div>

            <!-- Query Parameters -->
            <div class="panel-section">
              <div class="flex items-center justify-between mb-2">
                <label class="panel-label" style="margin:0;">Query Parameters</label>
                <button @click="addQueryParam" class="btn-add-small">+ param</button>
              </div>
              <div v-if="!opSpec.parameters.length" class="text-xs" style="color:#a0a7b5;">No parameters</div>
              <div v-for="(p, i) in opSpec.parameters" :key="p.id" class="param-row">
                <input v-model="p.name" class="prop-input" placeholder="name" />
                <select v-model="p.type" class="prop-select">
                  <option v-for="t in OPENAPI_TYPES" :key="t" :value="t">{{ t }}</option>
                </select>
                <label class="prop-req" :title="p.required ? 'Required' : 'Optional'">
                  <input type="checkbox" v-model="p.required" class="sr-only" />
                  <span :style="{ color: p.required ? '#0058bc' : '#a0a7b5' }" class="material-symbols-outlined" style="font-size:16px;">asterisk</span>
                </label>
                <button @click="opSpec.parameters.splice(i,1)" class="panel-close">
                  <span class="material-symbols-outlined" style="font-size:14px;">close</span>
                </button>
              </div>
            </div>

            <!-- Request Body (POST/PUT/PATCH) -->
            <div v-if="canHaveBody" class="panel-section">
              <div class="flex items-center justify-between mb-2">
                <label class="panel-label" style="margin:0;">Request Body</label>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="opSpec.requestBody.enabled" class="sr-only" />
                  <span class="toggle-track" :class="{ 'toggle-track--on': opSpec.requestBody.enabled }"></span>
                </label>
              </div>
              <div v-if="opSpec.requestBody.enabled" class="space-y-2">
                <div>
                  <label class="panel-label">Content Type</label>
                  <select v-model="opSpec.requestBody.contentType" class="panel-input">
                    <option>application/json</option>
                    <option>application/x-www-form-urlencoded</option>
                    <option>multipart/form-data</option>
                  </select>
                </div>
                <div>
                  <label class="panel-label">Schema</label>
                  <select v-model="opSpec.requestBody.schemaRef" class="panel-input">
                    <option value="">— inline / none —</option>
                    <option v-for="s in components" :key="s.id" :value="s.name">#/components/schemas/{{ s.name }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Responses -->
            <div class="panel-section">
              <div class="flex items-center justify-between mb-2">
                <label class="panel-label" style="margin:0;">Responses</label>
                <button @click="addResponse" class="btn-add-small">+ response</button>
              </div>
              <div v-for="(r, i) in opSpec.responses" :key="r.id" class="response-row">
                <input v-model="r.statusCode" class="status-input" placeholder="200" maxlength="3" />
                <input v-model="r.description" class="prop-input flex-1" placeholder="Description" />
                <button @click="opSpec.responses.splice(i,1)" class="panel-close">
                  <span class="material-symbols-outlined" style="font-size:14px;">close</span>
                </button>
                <div class="w-full mt-1 pl-0">
                  <select v-model="r.schemaRef" class="panel-input" style="font-size:11px;">
                    <option value="">— inline / none —</option>
                    <option v-for="s in components" :key="s.id" :value="s.name">#/components/schemas/{{ s.name }}</option>
                  </select>
                </div>
              </div>
            </div>
          </template>

          <!-- EDGE view (path param) -->
          <template v-else-if="selectedEdge && panelView === 'edge'">
            <div class="panel-header">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined" style="font-size:18px;color:#7c3aed;">route</span>
                <span class="text-sm font-bold" style="color:#1a1b1f;">Path Parameter</span>
              </div>
              <button @click="selectedEdge=null" class="panel-close">
                <span class="material-symbols-outlined" style="font-size:18px;">close</span>
              </button>
            </div>
            <div class="panel-section">
              <p class="panel-hint" style="line-height:1.5;">Identifies a resource in the URL, e.g. <code>/users/<strong>:id</strong></code>.</p>
            </div>
            <div class="panel-section">
              <label class="panel-label">Parameter Name</label>
              <input v-model="edgeParam.name" @input="updateEdgeParam" class="panel-input" placeholder="id" />
              <p class="panel-hint">Shown as <code>:{{ edgeParam.name || 'name' }}</code></p>
            </div>
            <div class="panel-section">
              <label class="panel-label">Data Type</label>
              <select v-model="edgeParam.type" @change="updateEdgeParam" class="panel-input">
                <option v-for="t in OPENAPI_TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="panel-section">
              <label class="panel-label">Description</label>
              <textarea v-model="edgeParam.description" @input="updateEdgeParam" class="panel-textarea" rows="2" placeholder="Describe this parameter…" />
            </div>
            <div class="panel-section">
              <div class="param-preview">
                <p class="panel-label" style="margin-bottom:6px;color:#717786;">OpenAPI Preview</p>
                <pre class="param-code">{{ edgeParamPreview }}</pre>
              </div>
            </div>
            <div class="panel-section panel-section--danger">
              <button @click="clearEdgeParam" class="btn-danger">
                <span class="material-symbols-outlined" style="font-size:16px;">link_off</span>Remove Parameter
              </button>
            </div>
          </template>

        </aside>
      </Transition>

      <!-- ── BOTTOM: AI Designer panel ──────────────────── -->
      <Transition name="panel-bottom-slide">
        <aside v-if="showAiPanel" class="ai-panel" @click.stop>

          <!-- Header -->
          <div class="ai-panel-header">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined" style="font-size:18px;color:#7c3aed;">auto_awesome</span>
              <span class="text-sm font-bold" style="color:#1a1b1f;">AI Designer</span>
              <span v-if="llmPrefs.isConfigured" class="ai-model-badge">{{ llmPrefs.model }}</span>
            </div>
            <button @click="showAiPanel = false" class="panel-close">
              <span class="material-symbols-outlined" style="font-size:18px;">close</span>
            </button>
          </div>

          <!-- Not configured -->
          <div v-if="!llmPrefs.isConfigured" class="ai-empty">
            <span class="material-symbols-outlined" style="font-size:32px;color:#d4d2db;">key</span>
            <p class="text-sm font-semibold" style="color:#1a1b1f;margin:8px 0 4px;">No LLM configured</p>
            <p class="text-xs" style="color:#a0a7b5;margin-bottom:12px;">Set your API key in Settings → Preferences.</p>
            <button @click="router.push('/settings/preferences')" class="ai-setup-btn">Go to Preferences</button>
          </div>

          <!-- Chat -->
          <template v-else>
            <div ref="chatScrollRef" class="ai-messages">
              <!-- Empty state -->
              <div v-if="!aiMessages.length" class="ai-welcome">
                <span class="material-symbols-outlined" style="font-size:28px;color:#7c3aed;opacity:0.4;">auto_awesome</span>
                <p class="text-xs" style="color:#a0a7b5;margin-top:8px;text-align:center;max-width:280px;">
                  Describe the API you want to design and I'll generate the visual model for you.
                </p>
              </div>

              <!-- Messages -->
              <div v-for="(msg, i) in aiMessages" :key="i" class="ai-msg-row" :class="`ai-msg-row--${msg.role}`">
                <div class="ai-bubble" :class="`ai-bubble--${msg.role}`">{{ msg.text }}</div>
                <button v-if="msg.design" @click="applyAiDesign(msg.design)" class="ai-apply-btn">
                  <span class="material-symbols-outlined" style="font-size:15px;">auto_fix_high</span>
                  Apply to Canvas
                </button>
              </div>

              <!-- Loading -->
              <div v-if="aiLoading" class="ai-msg-row ai-msg-row--assistant">
                <div class="ai-bubble ai-bubble--assistant ai-bubble--loading">
                  <span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>
                </div>
              </div>
            </div>

            <!-- Input -->
            <div class="ai-input-row">
              <textarea
                v-model="aiInput"
                class="ai-textarea"
                rows="2"
                placeholder="Describe your API… (⌘↵ to send)"
                @keydown.meta.enter.prevent="sendAiMessage"
                @keydown.ctrl.enter.prevent="sendAiMessage"
              />
              <button @click="sendAiMessage" :disabled="aiLoading || !aiInput.trim()" class="ai-send-btn">
                <span class="material-symbols-outlined" style="font-size:18px;">send</span>
              </button>
            </div>
          </template>

        </aside>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core';
import type { Node, Edge, NodeMouseEvent, EdgeMouseEvent } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import ResourceNode from '../components/designer/ResourceNode.vue';
import { useRegistryStore } from '../stores/registry';
import { useLLMPreferencesStore } from '../stores/preferences';
import yaml from 'js-yaml';

// ── Types ────────────────────────────────────────────
interface QueryParam { id: string; name: string; type: string; required: boolean; }
interface ResponseSpec { id: string; statusCode: string; description: string; schemaRef: string; }
interface OperationSpec {
  summary: string; description: string;
  parameters: QueryParam[];
  requestBody: { enabled: boolean; contentType: string; schemaRef: string; };
  responses: ResponseSpec[];
}
interface SchemaProp { id: string; name: string; type: string; required: boolean; }
interface ComponentSchema { id: string; name: string; description: string; properties: SchemaProp[]; }

const uid = () => Math.random().toString(36).slice(2, 9);

// ── Router / Store ───────────────────────────────────
const route      = useRoute();
const router     = useRouter();
const registry   = useRegistryStore();
const llmPrefs   = useLLMPreferencesStore();
const apiId    = route.params.id as string;
const version  = route.params.version as string;
const apiName  = ref('');

// ── Vue Flow ─────────────────────────────────────────
const { removeNodes, updateNode, getViewport, setViewport } = useVueFlow();
const fileInputRef = ref<HTMLInputElement | null>(null);
const nodeTypes = { resource: markRaw(ResourceNode) };
const defaultEdgeOptions = {
  type: 'smoothstep', animated: false,
  markerEnd: { type: MarkerType.ArrowClosed, color: '#0058bc' },
  style: { stroke: '#0058bc', strokeWidth: 2 },
};

const ROOT_NODE: Node = {
  id: 'root', type: 'resource', position: { x: 0, y: 0 },
  data: { path: '/root', methods: ['GET', 'POST'], operationSpecs: {}, description: 'Root resource', isRoot: true },
};
const nodes = ref<Node[]>([ROOT_NODE]);
const edges = ref<Edge[]>([]);

const snapToGrid = ref(false);

// ── Components catalog ───────────────────────────────
const components = ref<ComponentSchema[]>([]);
const showComponents = ref(false);
const collapsedSchemas = ref<Set<string>>(new Set());

function addSchema() {
  const schema = { id: uid(), name: 'NewSchema', description: '', properties: [] };
  components.value.push(schema);
  collapsedSchemas.value = new Set([...collapsedSchemas.value, schema.id]);
}
function removeSchema(id: string) {
  components.value = components.value.filter(s => s.id !== id);
  const next = new Set(collapsedSchemas.value); next.delete(id);
  collapsedSchemas.value = next;
}

function toggleSchema(id: string) {
  const next = new Set(collapsedSchemas.value);
  next.has(id) ? next.delete(id) : next.add(id);
  collapsedSchemas.value = next;
}

function collapseAllSchemas() {
  collapsedSchemas.value = new Set(components.value.map(s => s.id));
}
function addProp(schema: ComponentSchema) {
  schema.properties.push({ id: uid(), name: '', type: 'string', required: false });
}
function removeProp(schema: ComponentSchema, propId: string) {
  schema.properties = schema.properties.filter(p => p.id !== propId);
}

// ── Panel state ──────────────────────────────────────
type PanelView = 'node' | 'method' | 'edge';
const panelView  = ref<PanelView>('node');
const selectedNode = ref<Node | null>(null);
const selectedEdge = ref<Edge | null>(null);
const selectedMethod = ref<string | null>(null);

// Reactive operation spec form (flat, synced back to node on change)
const opSpec = ref<OperationSpec>({
  summary: '', description: '',
  parameters: [],
  requestBody: { enabled: false, contentType: 'application/json', schemaRef: '' },
  responses: [],
});

// Sync opSpec changes back to the node data
watch(opSpec, () => {
  if (!selectedNode.value || !selectedMethod.value) return;
  const specs = { ...(selectedNode.value.data.operationSpecs || {}), [selectedMethod.value]: { ...opSpec.value } };
  selectedNode.value = { ...selectedNode.value, data: { ...selectedNode.value.data, operationSpecs: specs } };
  updateNode(selectedNode.value.id, { data: { ...selectedNode.value.data } });
}, { deep: true });

const OPENAPI_TYPES = ['string', 'integer', 'number', 'boolean', 'array', 'object'] as const;

const HTTP_METHODS = [
  { verb: 'GET',    color: '#15803d' },
  { verb: 'POST',   color: '#1d4ed8' },
  { verb: 'PUT',    color: '#854d0e' },
  { verb: 'PATCH',  color: '#92400e' },
  { verb: 'DELETE', color: '#991b1b' },
];

function methodColor(verb: string) {
  return HTTP_METHODS.find(m => m.verb === verb)?.color ?? '#0058bc';
}

const canHaveBody = computed(() =>
  ['POST', 'PUT', 'PATCH'].includes(selectedMethod.value ?? '')
);

// ── Node click handlers ──────────────────────────────
function onNodeClick({ node }: NodeMouseEvent) {
  selectedNode.value = node;
  selectedEdge.value = null;
  panelView.value = 'node';
}
function onEdgeClick({ edge }: EdgeMouseEvent) {
  selectedEdge.value = edge;
  selectedNode.value = null;
  panelView.value = 'edge';
  const p = edge.data?.pathParam;
  edgeParam.value = { name: p?.name ?? '', type: p?.type ?? 'string', description: p?.description ?? '' };
}
function onPaneClick() {
  selectedNode.value = null;
  selectedEdge.value = null;
}

// ── Node data helpers ────────────────────────────────
function hasMethod(verb: string) {
  return (selectedNode.value?.data.methods as string[] | undefined)?.includes(verb) ?? false;
}

function updateNodeData() {
  if (!selectedNode.value) return;
  updateNode(selectedNode.value.id, { data: { ...selectedNode.value.data } });
}

function defaultOpSpec(verb: string): OperationSpec {
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(verb);
  return {
    summary: '', description: '',
    parameters: [],
    requestBody: { enabled: hasBody, contentType: 'application/json', schemaRef: '' },
    responses: [
      { id: uid(), statusCode: '200', description: 'Success', schemaRef: '' },
      ...(hasBody ? [{ id: uid(), statusCode: '400', description: 'Bad Request', schemaRef: '' }] : []),
      { id: uid(), statusCode: '500', description: 'Internal Server Error', schemaRef: '' },
    ],
  };
}

function toggleMethod(verb: string) {
  if (!selectedNode.value) return;
  const methods: string[] = [...(selectedNode.value.data.methods || [])];
  const specs = { ...(selectedNode.value.data.operationSpecs || {}) };
  const i = methods.indexOf(verb);
  if (i === -1) {
    methods.push(verb);
    if (!specs[verb]) specs[verb] = defaultOpSpec(verb);
  } else {
    methods.splice(i, 1);
  }
  selectedNode.value = { ...selectedNode.value, data: { ...selectedNode.value.data, methods, operationSpecs: specs } };
  updateNode(selectedNode.value.id, { data: { ...selectedNode.value.data } });
}

function openMethodDetail(verb: string) {
  if (!selectedNode.value) return;
  selectedMethod.value = verb;
  const raw = (selectedNode.value.data.operationSpecs as Record<string, OperationSpec> | undefined)?.[verb];
  opSpec.value = raw ? { ...raw, parameters: [...(raw.parameters || [])], responses: [...(raw.responses || [])] } : defaultOpSpec(verb);
  panelView.value = 'method';
}

function addQueryParam() {
  opSpec.value.parameters.push({ id: uid(), name: '', type: 'string', required: false });
}
function addResponse() {
  opSpec.value.responses.push({ id: uid(), statusCode: '', description: '', schemaRef: '' });
}

function deleteSelectedNode() {
  if (!selectedNode.value || selectedNode.value.data.isRoot) return;
  removeNodes([selectedNode.value.id]);
  selectedNode.value = null;
}

// ── Edge param ───────────────────────────────────────
const edgeParam = ref({ name: '', type: 'string', description: '' });
const edgeParamPreview = computed(() => {
  if (!edgeParam.value.name) return '# Set a parameter name above';
  const lines = [`name: ${edgeParam.value.name}`, `in: path`, `required: true`, `schema:`, `  type: ${edgeParam.value.type}`];
  if (edgeParam.value.description) lines.push(`description: ${edgeParam.value.description}`);
  return lines.join('\n');
});

function updateEdgeParam() {
  if (!selectedEdge.value) return;
  const { name, type, description } = edgeParam.value;
  edges.value = edges.value.map(e => e.id === selectedEdge.value!.id ? {
    ...e,
    label: name ? `:${name}` : undefined,
    labelStyle: { fill: '#7c3aed', fontWeight: 700, fontSize: 11, fontFamily: 'Inter, monospace' },
    labelBgStyle: { fill: '#f5f3ff', fillOpacity: 0.95 },
    labelBgPadding: [4, 6] as [number, number],
    labelBgBorderRadius: 4,
    data: { ...e.data, pathParam: { name, type, description } },
  } : e);
}
function clearEdgeParam() {
  if (!selectedEdge.value) return;
  edges.value = edges.value.map(e => e.id === selectedEdge.value!.id
    ? { ...e, label: undefined, data: { ...e.data, pathParam: null } } : e);
  edgeParam.value = { name: '', type: 'string', description: '' };
  selectedEdge.value = null;
}

// ── Save ─────────────────────────────────────────────
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle');
let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function saveFlow() {
  saveStatus.value = 'saving';
  try {
    const vp = getViewport();
    const payload = JSON.stringify({
      type: 'api-flow',
      nodes: nodes.value,
      edges: edges.value,
      components: components.value,
      viewport: { x: vp.x, y: vp.y, zoom: vp.zoom },
    });
    await registry.saveDefinition(apiId, version, payload);
    saveStatus.value = 'saved';
  } catch { saveStatus.value = 'error'; }
  finally {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveStatus.value = 'idle'; }, 3000);
  }
}

// ── Load ─────────────────────────────────────────────
onMounted(async () => {
  // Always fetch fresh to get the latest saved definition
  const api = await registry.fetchApiById(apiId) as any;
  if (api) apiName.value = api.name ?? '';
  const ver = api?.versions?.find((v: any) => v.version === version);
  const def = ver?.definition;
  if (def) {
    try {
      const parsed = typeof def === 'string' ? JSON.parse(def) : def;
      if (parsed?.type === 'api-flow' && Array.isArray(parsed.nodes)) {
        nodes.value = parsed.nodes;
        edges.value = parsed.edges ?? [];
        components.value = parsed.components ?? [];
        collapseAllSchemas();
        // Restore saved viewport or apply 75% default
        const vp = parsed.viewport;
        await nextTick();
        setViewport(vp ? { x: vp.x, y: vp.y, zoom: vp.zoom } : { x: 0, y: 0, zoom: 0.75 });
        return;
      }
    } catch { /* fall through */ }
  }
  nodes.value = [ROOT_NODE];
  edges.value = [];
  components.value = [];
  await nextTick();
  setViewport({ x: 0, y: 0, zoom: 0.75 });
});

// ── YAML export ───────────────────────────────────────
function exportYaml() {
  const pathMap: Record<string, string> = {};
  function buildFullPath(nodeId: string, visited = new Set<string>()): string {
    if (visited.has(nodeId)) return '';
    visited.add(nodeId);
    const node = nodes.value.find(n => n.id === nodeId);
    if (!node) return '';
    const inEdge = edges.value.find(e => e.target === nodeId);
    if (!inEdge) return node.data.path || '/';
    const parentPath = buildFullPath(inEdge.source, visited);
    const param = inEdge.data?.pathParam?.name ? `/{${inEdge.data.pathParam.name}}` : '';
    return `${parentPath}${param}${node.data.path !== '/' ? node.data.path : ''}`;
  }
  nodes.value.forEach(n => { pathMap[n.id] = buildFullPath(n.id); });

  const nodeParams: Record<string, any[]> = {};
  edges.value.forEach(e => {
    const p = e.data?.pathParam;
    if (!p?.name) return;
    if (!nodeParams[e.target]) nodeParams[e.target] = [];
    nodeParams[e.target].push({ name: p.name, in: 'path', required: true, schema: { type: p.type || 'string' }, ...(p.description ? { description: p.description } : {}) });
  });

  const paths: Record<string, any> = {};
  nodes.value.forEach(n => {
    const fullPath = pathMap[n.id] || '/';
    const pathItem: Record<string, any> = {};
    if (nodeParams[n.id]?.length) pathItem.parameters = nodeParams[n.id];
    const opSpecs = (n.data.operationSpecs || {}) as Record<string, OperationSpec>;
    (n.data.methods as string[] || []).forEach(verb => {
      const op = opSpecs[verb] || defaultOpSpec(verb);
      const operation: Record<string, any> = {
        summary: op.summary || `${verb} ${fullPath}`,
        operationId: `${verb.toLowerCase()}_${n.id.replace(/[^a-zA-Z0-9]/g, '_')}`,
        responses: Object.fromEntries(op.responses.map(r => [r.statusCode || '200', {
          description: r.description,
          ...(r.schemaRef ? { content: { 'application/json': { schema: { $ref: `#/components/schemas/${r.schemaRef}` } } } } : {}),
        }])),
      };
      if (op.description) operation.description = op.description;
      if (op.parameters.length) operation.parameters = op.parameters.map(p => ({ name: p.name, in: 'query', required: p.required, schema: { type: p.type } }));
      if (op.requestBody.enabled) operation.requestBody = {
        required: true,
        content: { [op.requestBody.contentType]: { schema: op.requestBody.schemaRef ? { $ref: `#/components/schemas/${op.requestBody.schemaRef}` } : { type: 'object' } } },
      };
      pathItem[verb.toLowerCase()] = operation;
    });
    if (Object.keys(pathItem).length) paths[fullPath] = pathItem;
  });

  const schemasObj: Record<string, any> = {};
  components.value.forEach(s => {
    schemasObj[s.name] = {
      type: 'object',
      ...(s.description ? { description: s.description } : {}),
      properties: Object.fromEntries(s.properties.map(p => [p.name, { type: p.type }])),
      required: s.properties.filter(p => p.required).map(p => p.name),
    };
  });

  const doc: any = { openapi: '3.1.0', info: { title: apiName.value || 'API', version }, paths };
  if (Object.keys(schemasObj).length) doc.components = { schemas: schemasObj };
  const yamlStr = yaml.dump(doc, { indent: 2, lineWidth: -1 });
  const blob = new Blob([yamlStr], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${(apiName.value || 'api').replace(/\s+/g, '-').toLowerCase()}-v${version}.yaml`;
  a.click(); URL.revokeObjectURL(url);
}

// ── Visual Design YAML export ─────────────────────────
function exportDesignYaml() {
  const apiSlug = (apiName.value || 'api').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const filename = `${apiSlug}-${version}-DESIGN.yaml`;

  const doc: any = {
    nexusDesign: '1.0',
    meta: { api: apiName.value || '', version, exportedAt: new Date().toISOString() },
    nodes: nodes.value.map(n => {
      const out: any = {
        id: n.id,
        position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
        path: n.data.path,
      };
      if (n.data.isRoot) out.isRoot = true;
      if (n.data.description) out.description = n.data.description;
      const methods = (n.data.methods as string[] | undefined) ?? [];
      if (methods.length) {
        out.methods = methods.map(verb => {
          const spec: OperationSpec = (n.data.operationSpecs as any)?.[verb] ?? defaultOpSpec(verb);
          const m: any = { verb };
          if (spec.summary)     m.summary     = spec.summary;
          if (spec.description) m.description = spec.description;
          if (spec.parameters.length) m.parameters = spec.parameters.map(p => ({ name: p.name, type: p.type, required: p.required }));
          if (spec.requestBody.enabled) m.requestBody = { contentType: spec.requestBody.contentType, ...(spec.requestBody.schemaRef ? { schemaRef: spec.requestBody.schemaRef } : {}) };
          if (spec.responses.length) m.responses = spec.responses.map(r => ({ statusCode: r.statusCode, description: r.description, ...(r.schemaRef ? { schemaRef: r.schemaRef } : {}) }));
          return m;
        });
      }
      return out;
    }),
    connections: edges.value.map(e => {
      const conn: any = { id: e.id, source: e.source, target: e.target };
      if (e.sourceHandle) conn.sourceHandle = e.sourceHandle;
      if (e.targetHandle) conn.targetHandle = e.targetHandle;
      const p = e.data?.pathParam;
      if (p?.name) conn.pathParam = { name: p.name, type: p.type ?? 'string', ...(p.description ? { description: p.description } : {}) };
      return conn;
    }),
  };

  if (components.value.length) {
    doc.components = components.value.map(s => ({
      name: s.name,
      ...(s.description ? { description: s.description } : {}),
      ...(s.properties.length ? { properties: s.properties.map(p => ({ name: p.name, type: p.type, required: p.required })) } : {}),
    }));
  }

  const blob = new Blob([yaml.dump(doc, { indent: 2, lineWidth: -1 })], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── YAML import ───────────────────────────────────────
function onFileImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const doc = yaml.load(e.target?.result as string) as any;
      if (doc?.nexusDesign) {
        importNexusDesign(doc);
      } else if (doc?.paths) {
        importOpenApiDoc(doc);
      }
    } catch { /* invalid yaml */ }
    if (fileInputRef.value) fileInputRef.value.value = '';
  };
  reader.readAsText(file);
}

function importNexusDesign(doc: any) {
  const newNodes: Node[] = (doc.nodes ?? []).map((n: any) => ({
    id: n.id,
    type: 'resource',
    position: { x: n.position?.x ?? 0, y: n.position?.y ?? 0 },
    data: {
      path: n.path ?? '/resource',
      isRoot: !!n.isRoot,
      description: n.description ?? '',
      methods: (n.methods ?? []).map((m: any) => m.verb),
      operationSpecs: Object.fromEntries((n.methods ?? []).map((m: any) => [m.verb, {
        summary: m.summary ?? '',
        description: m.description ?? '',
        parameters: (m.parameters ?? []).map((p: any) => ({ id: uid(), name: p.name, type: p.type ?? 'string', required: !!p.required })),
        requestBody: m.requestBody
          ? { enabled: true, contentType: m.requestBody.contentType ?? 'application/json', schemaRef: m.requestBody.schemaRef ?? '' }
          : { enabled: false, contentType: 'application/json', schemaRef: '' },
        responses: (m.responses ?? []).map((r: any) => ({ id: uid(), statusCode: r.statusCode, description: r.description ?? '', schemaRef: r.schemaRef ?? '' })),
      } satisfies OperationSpec])),
    },
  }));

  const newEdges: Edge[] = (doc.connections ?? []).map((c: any) => {
    const p = c.pathParam;
    return {
      id: c.id,
      source: c.source,
      target: c.target,
      sourceHandle: c.sourceHandle,
      targetHandle: c.targetHandle,
      type: 'smoothstep',
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#0058bc' },
      style: { stroke: '#0058bc', strokeWidth: 2 },
      ...(p?.name ? {
        label: `:${p.name}`,
        labelStyle: { fill: '#7c3aed', fontWeight: 700, fontSize: 11, fontFamily: 'Inter, monospace' },
        labelBgStyle: { fill: '#f5f3ff', fillOpacity: 0.95 },
        labelBgPadding: [4, 6] as [number, number],
        labelBgBorderRadius: 4,
        data: { pathParam: { name: p.name, type: p.type ?? 'string', description: p.description ?? '' } },
      } : {}),
    } as Edge;
  });

  nodes.value = newNodes;
  edges.value = newEdges;
  components.value = (doc.components ?? []).map((s: any) => ({
    id: uid(), name: s.name, description: s.description ?? '',
    properties: (s.properties ?? []).map((p: any) => ({ id: uid(), name: p.name, type: p.type ?? 'string', required: !!p.required })),
  }));
  collapseAllSchemas();
  selectedNode.value = null; selectedEdge.value = null;
}

function importOpenApiDoc(doc: any) {
  const newNodes: Node[] = []; const newEdges: Edge[] = [];
  const pathToId: Record<string, string> = {};
  Object.keys(doc.paths).sort((a, b) => a.split('/').length - b.split('/').length)
    .forEach((fullPath, i) => {
      const pathItem = doc.paths[fullPath];
      const id = i === 0 ? 'root' : `imported-${i}`;
      pathToId[fullPath] = id;
      const verbs = ['get','post','put','patch','delete'].filter(m => pathItem[m]).map(m => m.toUpperCase());
      const operationSpecs: Record<string, OperationSpec> = {};
      verbs.forEach(verb => {
        const op = pathItem[verb.toLowerCase()];
        operationSpecs[verb] = {
          summary: op.summary || '', description: op.description || '',
          parameters: (op.parameters || []).filter((p: any) => p.in === 'query').map((p: any) => ({ id: uid(), name: p.name, type: p.schema?.type || 'string', required: !!p.required })),
          requestBody: op.requestBody ? { enabled: true, contentType: Object.keys(op.requestBody.content || {})[0] || 'application/json', schemaRef: '' } : { enabled: false, contentType: 'application/json', schemaRef: '' },
          responses: Object.entries(op.responses || {}).map(([code, r]: [string, any]) => ({ id: uid(), statusCode: code, description: r.description || '', schemaRef: '' })),
        };
      });
      const segs = fullPath.split('/').filter(Boolean);
      const parentPath = segs.length <= 1 ? null : '/' + segs.slice(0, -1).join('/');
      const col = segs.length - 1; const row = newNodes.filter((n: any) => n._col === col).length;
      const node: any = { id, type: 'resource', position: { x: col * 340, y: row * 140 }, _col: col, data: { path: '/' + (segs[segs.length - 1] || ''), methods: verbs, operationSpecs, description: '', isRoot: i === 0 } };
      newNodes.push(node);
      if (parentPath && pathToId[parentPath]) {
        const param = (pathItem.parameters || []).filter((p: any) => p.in === 'path')[0];
        newEdges.push({ id: `e-${pathToId[parentPath]}-${id}`, source: pathToId[parentPath], target: id, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#0058bc' }, style: { stroke: '#0058bc', strokeWidth: 2 }, ...(param ? { label: `:${param.name}`, labelStyle: { fill: '#7c3aed', fontWeight: 700, fontSize: 11 }, labelBgStyle: { fill: '#f5f3ff', fillOpacity: 0.95 }, labelBgPadding: [4, 6] as [number, number], labelBgBorderRadius: 4, data: { pathParam: { name: param.name, type: param.schema?.type || 'string', description: param.description || '' } } } : {}) });
      }
    });
  nodes.value = newNodes; edges.value = newEdges;
  const schemas = doc.components?.schemas || {};
  components.value = Object.entries(schemas).map(([name, s]: [string, any]) => ({
    id: uid(), name, description: s.description || '',
    properties: Object.entries(s.properties || {}).map(([pname, p]: [string, any]) => ({ id: uid(), name: pname, type: p.type || 'string', required: (s.required || []).includes(pname) })),
  }));
  collapseAllSchemas();
  selectedNode.value = null; selectedEdge.value = null;
}

// ── AI Designer ──────────────────────────────────────
interface AiChatMsg { role: 'user' | 'assistant'; text: string; design?: any; }

const showAiPanel   = ref(false);
const aiMessages    = ref<AiChatMsg[]>([]);
const aiInput       = ref('');
const aiLoading     = ref(false);
const chatScrollRef = ref<HTMLElement | null>(null);

const AI_SYSTEM_PROMPT = `You are an AI API Designer for Nexus API Manager.
When the user requests an API design or modifications, respond with a brief explanation followed by a JSON code block.
The JSON must use EXACTLY this structure:

\`\`\`json
{
  "type": "api-flow",
  "nodes": [
    {
      "id": "root",
      "type": "resource",
      "position": { "x": 0, "y": 0 },
      "data": {
        "path": "/resource",
        "isRoot": true,
        "description": "",
        "methods": ["GET"],
        "operationSpecs": {
          "GET": {
            "summary": "", "description": "",
            "parameters": [{ "id": "p1", "name": "param", "type": "string", "required": false }],
            "requestBody": { "enabled": false, "contentType": "application/json", "schemaRef": "" },
            "responses": [{ "id": "r1", "statusCode": "200", "description": "Success", "schemaRef": "" }]
          }
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e-root-child",
      "source": "root", "target": "child",
      "sourceHandle": "bottom", "targetHandle": "top",
      "type": "smoothstep", "animated": false,
      "data": { "pathParam": { "name": "id", "type": "string", "description": "" } }
    }
  ],
  "components": [
    {
      "id": "s1", "name": "SchemaName", "description": "",
      "properties": [{ "id": "prop1", "name": "field", "type": "string", "required": false }]
    }
  ]
}
\`\`\`

Layout rules: root node at {x:0,y:0}; each child level adds 160 to y; siblings spaced 300px on x.
Use "bottom"→"top" handles for vertical trees. Always include operationSpecs for every method listed.
Omit edges/components arrays only if empty. All ids must be unique strings.`;

function buildSystemPrompt() {
  const state = JSON.stringify({ nodes: nodes.value, edges: edges.value, components: components.value });
  return `${AI_SYSTEM_PROMPT}\n\nCurrent canvas: ${state}`;
}

function parseAiContent(content: string): { text: string; design: any | null } {
  const match = content.match(/```json\s*([\s\S]*?)```/);
  if (match) {
    try {
      const design = JSON.parse(match[1]);
      if (design?.type === 'api-flow') {
        const text = content.replace(/```json[\s\S]*?```/, '').trim() || 'Design generated.';
        return { text, design };
      }
    } catch { /* not valid JSON */ }
  }
  return { text: content, design: null };
}

async function sendAiMessage() {
  const msg = aiInput.value.trim();
  if (!msg || aiLoading.value) return;
  aiInput.value = '';
  aiMessages.value.push({ role: 'user', text: msg });
  aiLoading.value = true;
  await scrollChat();

  try {
    const auth = (await import('../stores/auth')).useAuthStore();
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const history = aiMessages.value
      .slice(0, -1)                    // exclude just-added user msg (will be sent below)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

    const messages = [
      { role: 'system',    content: buildSystemPrompt() },
      ...history,
      { role: 'user',      content: msg },
    ];

    const res = await fetch(`${bffBase}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ provider: llmPrefs.provider, apiKey: llmPrefs.currentApiKey, model: llmPrefs.model, messages }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      aiMessages.value.push({ role: 'assistant', text: `Error: ${err.error}` });
    } else {
      const data = await res.json();
      const { text, design } = parseAiContent(data.content ?? '');
      aiMessages.value.push({ role: 'assistant', text, design: design ?? undefined });
    }
  } catch (e: any) {
    aiMessages.value.push({ role: 'assistant', text: `Error: ${e.message}` });
  } finally {
    aiLoading.value = false;
    await scrollChat();
  }
}

function applyAiDesign(design: any) {
  if (!design) return;
  nodes.value      = design.nodes      ?? [];
  edges.value      = design.edges      ?? [];
  components.value = design.components ?? [];
  collapseAllSchemas();
  selectedNode.value = null;
  selectedEdge.value = null;
}

async function scrollChat() {
  await nextTick();
  if (chatScrollRef.value) chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
}

function goBack() { router.push(`/projects/${apiId}`); }
</script>

<style scoped>
.flow-canvas { width: 100%; height: 100%; background: #f4f3f8; }

/* ── Toolbar ─────────────────── */
.toolbar-icon-btn { display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;color:#414755;transition:background 0.12s,color 0.12s; }
.toolbar-icon-btn:hover,.toolbar-icon-btn--active { background:#f4f3f8;color:#0058bc; }
.toolbar-divider { width:1px;height:20px;background:#e3e2e7; }

/* ── Left components panel ───── */
.components-panel { position:absolute;top:0;left:0;bottom:0;width:280px;background:#fff;border-right:1px solid #e3e2e7;display:flex;flex-direction:column;overflow-y:auto;z-index:20;box-shadow:4px 0 16px rgba(0,0,0,0.06); }
.panel-left-slide-enter-active,.panel-left-slide-leave-active { transition:transform 0.22s cubic-bezier(0.4,0,0.2,1); }
.panel-left-slide-enter-from,.panel-left-slide-leave-to { transform:translateX(-100%); }

/* ── Right properties panel ──── */
.properties-panel { position:absolute;top:0;right:0;bottom:0;width:300px;background:#fff;border-left:1px solid #e3e2e7;display:flex;flex-direction:column;overflow-y:auto;z-index:20;box-shadow:-4px 0 16px rgba(0,0,0,0.06); }
.panel-slide-enter-active,.panel-slide-leave-active { transition:transform 0.22s cubic-bezier(0.4,0,0.2,1); }
.panel-slide-enter-from,.panel-slide-leave-to { transform:translateX(100%); }

/* ── Shared panel ────────────── */
.panel-header { display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e3e2e7;flex-shrink:0; }
.panel-close { color:#a0a7b5;transition:color 0.12s;line-height:0; }
.panel-close:hover { color:#1a1b1f; }
.panel-section { padding:14px 16px;border-bottom:1px solid #f0eff5; }
.panel-section--danger { border-bottom:none; }
.panel-label { display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#a0a7b5;margin-bottom:8px; }
.panel-input { width:100%;padding:7px 10px;border:1px solid #e3e2e7;border-radius:8px;font-size:13px;font-family:'Inter',sans-serif;color:#1a1b1f;background:#faf9fe;outline:none;transition:border-color 0.15s; }
.panel-input:focus { border-color:#0058bc; }
.panel-textarea { width:100%;padding:7px 10px;border:1px solid #e3e2e7;border-radius:8px;font-size:13px;font-family:'Inter',sans-serif;color:#1a1b1f;background:#faf9fe;outline:none;resize:vertical;transition:border-color 0.15s; }
.panel-textarea:focus { border-color:#0058bc; }
.panel-hint { margin-top:5px;font-size:11px;color:#a0a7b5; }
.panel-hint code { font-family:monospace;background:#f4f3f8;padding:1px 4px;border-radius:4px; }

/* ── Schema card ─────────────── */
.schema-card { border-bottom:1px solid #f0eff5; }
.schema-card-header { display:flex;align-items:center;gap:6px;padding:10px 16px;user-select:none;transition:background 0.1s; }
.schema-card-header:hover { background:#faf9fe; }
.schema-chevron { transition:transform 0.18s cubic-bezier(0.4,0,0.2,1); }
.schema-chevron--open { transform:rotate(90deg); }
.schema-body { padding:0 16px 12px 16px; }
.schema-name-input { flex:1;padding:4px 8px;border:1px solid #e3e2e7;border-radius:6px;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;color:#1a1b1f;background:#faf9fe;outline:none;min-width:0; }
.schema-name-input:focus { border-color:#0058bc; }
.schema-prop-count { flex-shrink:0;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;background:#eff6ff;color:#0058bc;font-family:'Inter',sans-serif; }
.prop-row,.param-row { display:flex;align-items:center;gap:4px;margin-bottom:4px;flex-wrap:wrap; }
.response-row { display:flex;align-items:center;gap:4px;margin-bottom:8px;flex-wrap:wrap; }
.prop-input { flex:1;min-width:0;padding:4px 7px;border:1px solid #e3e2e7;border-radius:6px;font-size:12px;font-family:'Inter',monospace;color:#1a1b1f;background:#faf9fe;outline:none; }
.prop-input:focus { border-color:#0058bc; }
.prop-select { padding:4px 5px;border:1px solid #e3e2e7;border-radius:6px;font-size:12px;color:#1a1b1f;background:#faf9fe;outline:none;max-width:80px; }
.prop-req { cursor:pointer;line-height:0;flex-shrink:0; }
.status-input { width:44px;flex-shrink:0;padding:4px 6px;border:1px solid #e3e2e7;border-radius:6px;font-size:12px;font-family:monospace;color:#1a1b1f;background:#faf9fe;outline:none;text-align:center; }
.status-input:focus { border-color:#0058bc; }
.btn-add { display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;font-weight:600;color:#0058bc;padding:7px 12px;border-radius:10px;border:1.5px dashed #93c5fd;background:#eff6ff;cursor:pointer;transition:background 0.12s;width:100%; }
.btn-add:hover { background:#dbeafe; }
.btn-add-small { font-size:11px;font-weight:600;color:#0058bc;cursor:pointer;padding:2px 6px;border-radius:6px;border:1px dashed #93c5fd;background:#eff6ff;transition:background 0.12s; }
.btn-add-small:hover { background:#dbeafe; }

/* ── Methods list ────────────── */
.method-row { display:flex;align-items:center;gap:6px;margin-bottom:5px; }
.method-toggle { display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid #e3e2e7;color:#717786;transition:border-color 0.12s,background 0.12s;user-select:none;flex:1; }
.method-toggle--on { border-color:#0058bc;background:#eff6ff;color:#0058bc; }
.method-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0; }
.method-edit-btn { display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;color:#414755;border:1px solid #e3e2e7;background:#faf9fe;transition:background 0.12s,color 0.12s;cursor:pointer;flex-shrink:0; }
.method-edit-btn:hover { background:#eff6ff;color:#0058bc;border-color:#0058bc; }
.method-badge-lg { padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;font-family:'Inter',sans-serif; }

/* ── Toggle switch ───────────── */
.toggle-switch { cursor:pointer;line-height:0;flex-shrink:0; }
.toggle-track { display:inline-block;width:34px;height:18px;border-radius:9px;background:#d1d5db;transition:background 0.15s;position:relative; }
.toggle-track::after { content:'';position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.2); }
.toggle-track--on { background:#0058bc; }
.toggle-track--on::after { transform:translateX(16px); }

/* ── Preview code block ──────── */
.param-preview { background:#1a1b1f;border-radius:10px;padding:12px 14px; }
.param-code { font-family:'Fira Code','Cascadia Code',monospace;font-size:11px;color:#c9d1d9;margin:0;white-space:pre;line-height:1.6; }

/* ── Danger button ───────────── */
.btn-danger { display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#991b1b;padding:7px 12px;border-radius:10px;border:1.5px solid #fecaca;background:#fff;cursor:pointer;transition:background 0.12s;width:100%;justify-content:center; }
.btn-danger:hover { background:#fef2f2; }

/* ── AI toolbar button ───────── */
.ai-btn { color:#7c3aed !important; }
.ai-btn:hover,.ai-btn.toolbar-icon-btn--active { background:#f5f3ff !important;color:#7c3aed !important; }

/* ── AI panel ────────────────── */
.ai-panel {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 360px;
  background: #ffffff;
  border-top: 1px solid #e3e2e7;
  display: flex; flex-direction: column;
  z-index: 25;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
}
.panel-bottom-slide-enter-active,.panel-bottom-slide-leave-active { transition: transform 0.22s cubic-bezier(0.4,0,0.2,1); }
.panel-bottom-slide-enter-from,.panel-bottom-slide-leave-to { transform: translateY(100%); }

.ai-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #f0eff5;
  flex-shrink: 0;
}
.ai-model-badge {
  font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 10px;
  background: #f5f3ff; color: #7c3aed; font-family: 'Inter', sans-serif;
}

/* Not-configured empty state */
.ai-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px;
}
.ai-setup-btn {
  padding: 7px 18px; border-radius: 10px; font-size: 13px; font-weight: 700;
  background: #7c3aed; color: #fff; border: none; cursor: pointer; transition: opacity 0.15s;
}
.ai-setup-btn:hover { opacity: 0.85; }

/* Messages area */
.ai-messages {
  flex: 1; overflow-y: auto; padding: 12px 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.ai-welcome {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  opacity: 0.7;
}

.ai-msg-row { display: flex; flex-direction: column; gap: 4px; }
.ai-msg-row--user  { align-items: flex-end; }
.ai-msg-row--assistant { align-items: flex-start; }

.ai-bubble {
  max-width: 85%; padding: 8px 12px; border-radius: 12px;
  font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-word;
  font-family: 'Inter', sans-serif;
}
.ai-bubble--user      { background: #0058bc; color: #fff; border-radius: 12px 12px 2px 12px; }
.ai-bubble--assistant { background: #f4f3f8; color: #1a1b1f; border-radius: 12px 12px 12px 2px; }
.ai-bubble--loading   { padding: 12px 16px; display: flex; gap: 5px; align-items: center; }

/* Typing dots */
.ai-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #a0a7b5;
  animation: ai-bounce 1.2s infinite ease-in-out;
}
.ai-dot:nth-child(2) { animation-delay: 0.2s; }
.ai-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes ai-bounce {
  0%,80%,100% { transform: scale(0.7); opacity: 0.5; }
  40%          { transform: scale(1);   opacity: 1; }
}

/* Apply button */
.ai-apply-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 700;
  background: #7c3aed; color: #fff; border: none; cursor: pointer;
  transition: opacity 0.15s; align-self: flex-start; margin-top: 2px;
}
.ai-apply-btn:hover { opacity: 0.85; }

/* Input row */
.ai-input-row {
  display: flex; gap: 8px; padding: 10px 16px;
  border-top: 1px solid #f0eff5; flex-shrink: 0;
}
.ai-textarea {
  flex: 1; resize: none; padding: 8px 12px; border: 1px solid #e3e2e7;
  border-radius: 10px; font-size: 13px; font-family: 'Inter', sans-serif;
  color: #1a1b1f; background: #faf9fe; outline: none; line-height: 1.5;
  transition: border-color 0.15s;
}
.ai-textarea:focus { border-color: #7c3aed; }
.ai-send-btn {
  flex-shrink: 0; width: 38px; height: 38px; border-radius: 10px;
  background: #7c3aed; color: #fff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s; align-self: flex-end;
}
.ai-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ai-send-btn:not(:disabled):hover { opacity: 0.85; }
</style>
