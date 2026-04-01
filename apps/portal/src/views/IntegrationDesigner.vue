<template>
  <div class="fixed inset-0 flex flex-col" style="font-family: 'Inter', sans-serif; background: #faf9fe;">

    <!-- ── Toolbar ─────────────────────────────────────── -->
    <header class="flex items-center justify-between px-4 flex-shrink-0 z-20"
      style="height:48px;background:#ffffff;border-bottom:1px solid #e3e2e7;">

      <!-- Left -->
      <div class="flex items-center gap-3">
        <button @click="router.push('/integrations')"
          class="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60"
          style="color:#414755;">
          <span class="material-symbols-outlined" style="font-size:18px;">arrow_back</span>Integrations
        </button>
        <span style="color:#e3e2e7;">|</span>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined" style="font-size:18px;color:#0058bc;">hub</span>
          <span class="text-sm font-semibold" style="color:#1a1b1f;">
            {{ integration?.name ?? 'Integration' }}
          </span>
          <span v-if="domainLabel"
            class="px-2 py-0.5 rounded-full text-xs font-bold uppercase"
            style="background:#eff6ff;color:#0058bc;">{{ domainLabel }}</span>
        </div>
      </div>

      <!-- Right -->
      <div class="flex items-center gap-3">
        <span v-if="saveStatus === 'saving'" class="flex items-center gap-1 text-xs font-medium" style="color:#a0a7b5;">
          <span class="material-symbols-outlined" style="font-size:14px;">progress_activity</span>Saving…
        </span>
        <span v-else-if="saveStatus === 'saved'" class="flex items-center gap-1 text-xs font-medium" style="color:#047857;">
          <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span>Saved
        </span>
        <button @click="saveFlow" :disabled="saveStatus === 'saving'"
          class="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
          style="background:#0058bc;color:#ffffff;">
          <span class="material-symbols-outlined" style="font-size:16px;">save</span>Save
        </button>
      </div>
    </header>

    <!-- ── Canvas area ─────────────────────────────────── -->
    <div ref="canvasRef" class="flex-1 relative overflow-hidden"
      @dragover.prevent
      @drop="onDrop">

      <!-- Vue Flow canvas -->
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :node-types="nodeTypes"
        :default-edge-options="defaultEdgeOptions"
        :connect-on-click="false"
        :connection-mode="ConnectionMode.Loose"
        :delete-key-code="['Delete', 'Backspace']"
        fit-view-on-init
        class="flow-canvas"
        @node-click="onNodeClick"
        @pane-click="onPaneClick"
        @nodes-change="onNodesChange"
        @connect="onConnect">
        <Background :gap="24" :size="1.5" pattern-color="#d4d2db" variant="dots" />
      </VueFlow>

      <!-- ── LEFT: Floating Node Palette ────────────────── -->
      <div class="palette-wrapper" :class="{ 'palette-wrapper--open': paletteOpen }">
        <!-- Toggle button -->
        <button class="palette-toggle" @click="paletteOpen = !paletteOpen"
          :title="paletteOpen ? 'Close palette' : 'Open node palette'">
          <span class="material-symbols-outlined" style="font-size:20px;">
            {{ paletteOpen ? 'close' : 'drag_indicator' }}
          </span>
        </button>

        <!-- Palette card -->
        <Transition name="palette-slide">
          <div v-if="paletteOpen" class="palette-card">
            <div class="palette-header">
              <span class="material-symbols-outlined" style="font-size:16px;color:#0058bc;">widgets</span>
              <span style="font-size:12px;font-weight:700;color:#1a1b1f;">Node Types</span>
            </div>

            <div v-for="cat in CATEGORIES" :key="cat" class="palette-category">
              <p class="palette-cat-label" :style="{ color: CATEGORY_COLORS[cat] }">{{ cat }}</p>
              <div
                v-for="type in typesByCategory(cat)" :key="type.id"
                class="palette-item"
                :style="{ borderLeftColor: type.color }"
                draggable="true"
                @dragstart="onDragStart($event, type.id)">
                <div class="palette-item__icon" :style="{ background: type.color }">
                  <span class="material-symbols-outlined" style="font-size:14px;color:#fff;font-variation-settings:'FILL' 1;">
                    {{ type.icon }}
                  </span>
                </div>
                <div class="palette-item__text">
                  <p class="palette-item__name">{{ type.name }}</p>
                  <p class="palette-item__desc">{{ type.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- ── RIGHT: Properties Panel ─────────────────────── -->
      <Transition name="panel-slide">
        <aside v-if="selectedNode" class="props-panel" @click.stop>

          <!-- Panel header -->
          <div class="props-header">
            <div class="flex items-center gap-2 min-w-0">
              <div v-if="selectedNodeType"
                class="props-header__icon"
                :style="{ background: selectedNodeType.color }">
                <span class="material-symbols-outlined" style="font-size:16px;color:#fff;font-variation-settings:'FILL' 1;">
                  {{ selectedNodeType.icon }}
                </span>
              </div>
              <div class="min-w-0">
                <p class="props-header__name">{{ selectedNodeType?.name ?? 'Node' }}</p>
                <p class="props-header__id">{{ selectedNode.data.typeId }}</p>
              </div>
            </div>
            <button @click="selectedNode = null" class="props-close">
              <span class="material-symbols-outlined" style="font-size:18px;">close</span>
            </button>
          </div>

          <!-- Protocol type selector (only for protocol nodes) -->
          <div v-if="selectedNode.type === 'protocol'" class="props-section">
            <label class="props-label">Protocol Type</label>
            <select class="props-input" :value="selectedNode.data.typeId" @change="changeProtocolType">
              <option v-for="t in protocolTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>

          <!-- Catalog Node — name & description -->
          <div v-if="selectedNode.data.typeId === 'catalog-node@v1'" class="props-section">
            <p class="props-section-title">General</p>
            <div class="props-field">
              <label class="props-label">Name <span style="color:#991b1b;">*</span></label>
              <input type="text" class="props-input"
                placeholder="Node name…"
                :value="selectedNode.data.label ?? ''"
                @input="updateNodeData('label', ($event.target as HTMLInputElement).value)" />
            </div>
            <div class="props-field">
              <label class="props-label">Description</label>
              <textarea class="props-input props-textarea" rows="2"
                placeholder="Optional description…"
                :value="selectedNode.data.description ?? ''"
                @input="updateNodeData('description', ($event.target as HTMLTextAreaElement).value)" />
            </div>
          </div>

          <!-- Catalog Node configuration -->
          <div v-if="selectedNode.data.typeId === 'catalog-node@v1'" class="props-section">
            <p class="props-section-title">Configuration</p>

            <!-- Step 1: Node Type selector -->
            <div class="props-field">
              <label class="props-label">
                Node Type <span style="color:#991b1b;">*</span>
              </label>
              <select class="props-input"
                :value="selectedNode.data.props?.catalogTypeId ?? ''"
                @change="onCatalogTypeChange">
                <option value="" disabled>— Select a node type —</option>
                <option v-for="entry in catalogStore.entries" :key="entry.id" :value="entry.id">
                  {{ entry.name }}
                </option>
              </select>
              <p v-if="catalogStore.loading" style="font-size:10px;color:#a0a7b5;margin:4px 0 0;">Loading catalog…</p>
              <p v-else-if="!catalogStore.entries.length" style="font-size:10px;color:#a0a7b5;margin:4px 0 0;">No catalog node types defined yet.</p>
            </div>

            <!-- Step 2: dynamic properties of the selected catalog type -->
            <template v-if="selectedCatalogEntry && selectedCatalogEntry.properties.length">
              <div class="props-section-divider" />
              <p class="props-section-title" style="margin-top:12px;">{{ selectedCatalogEntry.name }} Properties</p>
              <div v-for="prop in selectedCatalogEntry.properties" :key="prop.name" class="props-field">
                <label class="props-label">
                  {{ prop.name }}
                  <span v-if="prop.required" style="color:#991b1b;">*</span>
                </label>

                <input v-if="prop.type === 'string'" type="text"
                  class="props-input"
                  :value="selectedNode.data.props?.[prop.name] ?? ''"
                  @input="updateProp(prop.name, ($event.target as HTMLInputElement).value)" />

                <input v-else-if="prop.type === 'number'" type="number"
                  class="props-input"
                  :value="selectedNode.data.props?.[prop.name] ?? ''"
                  @input="updateProp(prop.name, Number(($event.target as HTMLInputElement).value))" />

                <label v-else-if="prop.type === 'boolean'" class="props-checkbox-label">
                  <input type="checkbox"
                    :checked="selectedNode.data.props?.[prop.name] ?? false"
                    @change="updateProp(prop.name, ($event.target as HTMLInputElement).checked)" />
                  {{ prop.name }}
                </label>

                <select v-else-if="prop.type === 'select'" class="props-input"
                  :value="selectedNode.data.props?.[prop.name] ?? ''"
                  @change="updateProp(prop.name, ($event.target as HTMLSelectElement).value)">
                  <option value="" disabled>— Select —</option>
                  <option v-for="opt in prop.options" :key="opt" :value="opt">{{ opt }}</option>
                </select>

                <textarea v-else-if="prop.type === 'textarea'"
                  class="props-input props-textarea"
                  rows="4"
                  :value="selectedNode.data.props?.[prop.name] ?? ''"
                  @input="updateProp(prop.name, ($event.target as HTMLTextAreaElement).value)" />
              </div>
            </template>
          </div>

          <!-- Properties form (static node types) -->
          <div v-else-if="selectedNodeType && selectedNodeType.properties.length" class="props-section">
            <p class="props-section-title">Properties</p>
            <div v-for="prop in selectedNodeType.properties" :key="prop.key" class="props-field">
              <label class="props-label">
                {{ prop.label }}
                <span v-if="prop.required" style="color:#991b1b;">*</span>
              </label>

              <!-- string -->
              <input v-if="prop.type === 'string'" type="text"
                class="props-input"
                :placeholder="prop.defaultValue ?? ''"
                :value="selectedNode.data.props?.[prop.key] ?? prop.defaultValue ?? ''"
                @input="updateProp(prop.key, ($event.target as HTMLInputElement).value)" />

              <!-- number -->
              <input v-else-if="prop.type === 'number'" type="number"
                class="props-input"
                :placeholder="String(prop.defaultValue ?? '')"
                :value="selectedNode.data.props?.[prop.key] ?? prop.defaultValue ?? ''"
                @input="updateProp(prop.key, Number(($event.target as HTMLInputElement).value))" />

              <!-- boolean -->
              <label v-else-if="prop.type === 'boolean'" class="props-checkbox-label">
                <input type="checkbox"
                  :checked="selectedNode.data.props?.[prop.key] ?? prop.defaultValue ?? false"
                  @change="updateProp(prop.key, ($event.target as HTMLInputElement).checked)" />
                {{ prop.label }}
              </label>

              <!-- select -->
              <select v-else-if="prop.type === 'select'" class="props-input"
                :value="selectedNode.data.props?.[prop.key] ?? prop.defaultValue ?? ''"
                @change="updateProp(prop.key, ($event.target as HTMLSelectElement).value)">
                <option v-for="opt in prop.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>

              <!-- textarea -->
              <textarea v-else-if="prop.type === 'textarea'"
                class="props-input props-textarea"
                rows="4"
                :placeholder="prop.defaultValue ?? ''"
                :value="selectedNode.data.props?.[prop.key] ?? prop.defaultValue ?? ''"
                @input="updateProp(prop.key, ($event.target as HTMLTextAreaElement).value)" />
            </div>
          </div>

          <div v-else-if="selectedNodeType" class="props-empty">
            No configurable properties for this node type.
          </div>
        </aside>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VueFlow, useVueFlow, MarkerType, ConnectionMode } from '@vue-flow/core';
import type { Node, Edge, Connection, NodeMouseEvent, NodeChange } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import ProtocolNode from '../components/integration/ProtocolNode.vue';
import FlowNode from '../components/integration/FlowNode.vue';
import FilterNode from '../components/integration/FilterNode.vue';
import { NODE_TYPE_CATALOG, CATEGORIES, CATEGORY_COLORS, findNodeType } from '../stores/nodeTypes';
import { useIntegrationsStore } from '../stores/integrations';
import { useDomainsStore } from '../stores/domains';
import { useNodeTypeCatalogStore } from '../stores/nodeTypeCatalog';

// ── Router / route ────────────────────────────────────────
const route  = useRoute();
const router = useRouter();

// ── Stores ────────────────────────────────────────────────
const integrationsStore  = useIntegrationsStore();
const domainsStore       = useDomainsStore();
const catalogStore       = useNodeTypeCatalogStore();

const integrationId = computed(() => route.params.id as string);
const integration   = computed(() => integrationsStore.integrations.find(i => i.id === integrationId.value));
const domainLabel   = computed(() => {
  const domId = integration.value?.domainId;
  return domId ? domainsStore.byId(domId)?.title ?? '' : '';
});

// ── Node types registered with Vue Flow ───────────────────
const nodeTypes = {
  protocol: markRaw(ProtocolNode),
  flow:     markRaw(FlowNode),
  filter:   markRaw(FilterNode),
};

// ── Flow state ────────────────────────────────────────────
const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { stroke: '#0058bc', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#0058bc' },
};

// ── Vue Flow composable ───────────────────────────────────
const { addNodes, addEdges, updateNode, project } = useVueFlow();

// ── Canvas ref ────────────────────────────────────────────
const canvasRef = ref<HTMLElement | null>(null);

// ── Palette ───────────────────────────────────────────────
const paletteOpen = ref(true);

function typesByCategory(cat: string) {
  return NODE_TYPE_CATALOG.filter(t => t.category === cat);
}

const protocolTypes = computed(() => NODE_TYPE_CATALOG.filter(t => t.category === 'Protocol'));

function onDragStart(event: DragEvent, typeId: string) {
  event.dataTransfer?.setData('nodeTypeId', typeId);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
}

// ── Drop handler ──────────────────────────────────────────
// Flow node dimensions must match the style set in loadOrInitFlow()
const FLOW_NODE_W = 1050;
const FLOW_NODE_H = 300;

function onDrop(event: DragEvent) {
  const typeId = event.dataTransfer?.getData('nodeTypeId');
  if (!typeId) return;

  const bounds = canvasRef.value!.getBoundingClientRect();
  const dropPos = project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
  const nt = findNodeType(typeId);

  // Check whether the drop landed inside the flow node
  const flowNode = nodes.value.find(n => n.type === 'flow');
  if (flowNode) {
    const fx = flowNode.position.x;
    const fy = flowNode.position.y;
    if (
      dropPos.x >= fx && dropPos.x <= fx + FLOW_NODE_W &&
      dropPos.y >= fy && dropPos.y <= fy + FLOW_NODE_H
    ) {
      // Position relative to the flow node's top-left
      const relX = dropPos.x - fx - 80; // center on cursor (FilterNode ~160px wide)
      const relY = dropPos.y - fy - 20; // center on cursor

      addNodes([{
        id: `filter-${Date.now()}`,
        type: 'filter',
        position: { x: Math.max(4, relX), y: Math.max(40, relY) },
        parentNode: flowNode.id,
        extent: 'parent',
        data: { typeId, label: nt?.name ?? typeId, props: {} },
      }]);
      return;
    }
  }

  // Dropped outside the flow node — standalone filter on canvas
  addNodes([{
    id: `filter-${Date.now()}`,
    type: 'filter',
    position: dropPos,
    data: { typeId, label: nt?.name ?? typeId, props: {} },
  }]);
}

// ── Selection ─────────────────────────────────────────────
const selectedNode = ref<Node | null>(null);

const selectedNodeType = computed(() => {
  if (!selectedNode.value) return null;
  return findNodeType(selectedNode.value.data.typeId);
});

const selectedCatalogEntry = computed(() => {
  if (!selectedNode.value) return null;
  const catalogTypeId = selectedNode.value.data.props?.catalogTypeId;
  if (!catalogTypeId) return null;
  return catalogStore.byId(catalogTypeId) ?? null;
});

function onNodeClick(event: NodeMouseEvent) {
  selectedNode.value = event.node;
}

function onPaneClick() {
  selectedNode.value = null;
}

function onNodesChange(changes: NodeChange[]) {
  // Clear the properties panel if the selected node was removed
  if (selectedNode.value) {
    const removed = changes.some(
      c => c.type === 'remove' && c.id === selectedNode.value?.id
    );
    if (removed) selectedNode.value = null;
  }
}

// ── Connect handler ───────────────────────────────────────
// ConnectionMode.Loose lets any handle connect to any other handle.
// In this mode, drag direction always determines source → target,
// so no swap logic is needed.
function onConnect(connection: Connection) {
  addEdges([{
    id: `e-${connection.source}-${connection.sourceHandle ?? 'src'}-${connection.target}-${connection.targetHandle ?? 'tgt'}-${Date.now()}`,
    source: connection.source,
    sourceHandle: connection.sourceHandle ?? undefined,
    target: connection.target,
    targetHandle: connection.targetHandle ?? undefined,
    type: 'smoothstep',
    style: { stroke: '#0058bc', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#0058bc' },
  }]);
}

// ── Property update ───────────────────────────────────────
function updateProp(key: string, value: any) {
  if (!selectedNode.value) return;
  const node = selectedNode.value;
  const updatedProps = { ...node.data.props, [key]: value };

  let configured = false;
  if (node.data.typeId === 'catalog-node@v1') {
    const catalogTypeId = updatedProps.catalogTypeId;
    if (catalogTypeId) {
      const entry = catalogStore.byId(catalogTypeId);
      configured = entry
        ? entry.properties.filter(p => p.required).every(p => {
            const v = updatedProps[p.name];
            return v !== undefined && v !== null && v !== '';
          })
        : false;
    }
  } else {
    const nt = findNodeType(node.data.typeId);
    configured = nt
      ? nt.properties.filter(p => p.required).every(p => {
          const v = updatedProps[p.key];
          return v !== undefined && v !== null && v !== '';
        })
      : false;
  }

  const newData = { ...node.data, props: updatedProps, configured };
  updateNode(node.id, { data: newData });
  // Keep selectedNode reactive
  selectedNode.value = { ...node, data: newData };
}

// ── Update top-level node data (label, description, …) ───
function updateNodeData(key: string, value: any) {
  if (!selectedNode.value) return;
  const node = selectedNode.value;
  const newData = { ...node.data, [key]: value };
  updateNode(node.id, { data: newData });
  selectedNode.value = { ...node, data: newData };
}

// ── Catalog type change (resets property values) ──────────
function onCatalogTypeChange(event: Event) {
  if (!selectedNode.value) return;
  const catalogTypeId = (event.target as HTMLSelectElement).value;
  const newData = {
    ...selectedNode.value.data,
    props: { catalogTypeId },
    configured: false,
  };
  updateNode(selectedNode.value.id, { data: newData });
  selectedNode.value = { ...selectedNode.value, data: newData };
}

// ── Protocol type selector ────────────────────────────────
function changeProtocolType(event: Event) {
  if (!selectedNode.value) return;
  const typeId = (event.target as HTMLSelectElement).value;
  const nt = findNodeType(typeId);
  const newData = {
    ...selectedNode.value.data,
    typeId,
    label: nt?.name ?? typeId,
    props: {},
    configured: false,
  };
  updateNode(selectedNode.value.id, { data: newData });
  selectedNode.value = { ...selectedNode.value, data: newData };
}

// ── Save ──────────────────────────────────────────────────
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle');

function saveFlow() {
  saveStatus.value = 'saving';
  try {
    const key = `integration-flow:${integrationId.value}`;
    const payload = { type: 'integration-flow', nodes: nodes.value, edges: edges.value };
    localStorage.setItem(key, JSON.stringify(payload));
    saveStatus.value = 'saved';
    setTimeout(() => { saveStatus.value = 'idle'; }, 2000);
  } catch {
    saveStatus.value = 'error';
    setTimeout(() => { saveStatus.value = 'idle'; }, 3000);
  }
}

// ── Load saved flow or create defaults ────────────────────
function loadOrInitFlow() {
  const key = `integration-flow:${integrationId.value}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      nodes.value = parsed.nodes ?? [];
      edges.value = parsed.edges ?? [];
      return;
    } catch { /* fall through to defaults */ }
  }

  // Default initial layout
  nodes.value = [
    {
      id: 'protocol-1',
      type: 'protocol',
      position: { x: 420, y: 60 },
      data: { typeId: 'http-listener@v1', label: 'HTTP Listener', props: {}, configured: false },
    },
    {
      id: 'flow-1',
      type: 'flow',
      position: { x: 80, y: 220 },
      style: { width: `${FLOW_NODE_W}px`, height: `${FLOW_NODE_H}px` },
      data: {},
    },
  ];

  edges.value = [
    {
      id: 'e-protocol-flow',
      source: 'protocol-1',
      target: 'flow-1',
      sourceHandle: 'bottom',
      targetHandle: 'in',
      type: 'smoothstep',
      style: { stroke: '#0058bc', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#0058bc' },
    },
  ];
}

// ── Mount ─────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([integrationsStore.fetch(), domainsStore.fetch(), catalogStore.fetch()]);
  loadOrInitFlow();
});
</script>

<style scoped>
.flow-canvas {
  width: 100%;
  height: 100%;
  background: #faf9fe;
}

/* ── Palette ── */
.palette-wrapper {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 30;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.palette-toggle {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e3e2e7;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #414755;
  flex-shrink: 0;
  transition: background 0.12s;
}
.palette-toggle:hover { background: #f4f3f8; }

.palette-card {
  width: 220px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #e3e2e7;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  padding: 12px;
  scrollbar-width: thin;
}

.palette-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e3e2e7;
}

.palette-category {
  margin-bottom: 10px;
}

.palette-cat-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0 0 5px 2px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 10px;
  border-left: 3px solid transparent;
  cursor: grab;
  transition: background 0.1s;
  margin-bottom: 2px;
}
.palette-item:hover { background: #f4f3f8; }
.palette-item:active { cursor: grabbing; }

.palette-item__icon {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.palette-item__text { flex: 1; min-width: 0; }

.palette-item__name {
  font-size: 11px;
  font-weight: 700;
  color: #1a1b1f;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.palette-item__desc {
  font-size: 9px;
  color: #a0a7b5;
  margin: 1px 0 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Palette transition */
.palette-slide-enter-active,
.palette-slide-leave-active { transition: opacity 0.15s, transform 0.15s; }
.palette-slide-enter-from,
.palette-slide-leave-to { opacity: 0; transform: translateX(-8px); }

/* ── Properties Panel ── */
.props-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  background: #ffffff;
  border-left: 1px solid #e3e2e7;
  box-shadow: -4px 0 20px rgba(0,0,0,0.08);
  overflow-y: auto;
  z-index: 30;
  scrollbar-width: thin;
}

.props-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e3e2e7;
  gap: 8px;
}

.props-header__icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.props-header__name {
  font-size: 13px;
  font-weight: 700;
  color: #1a1b1f;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.props-header__id {
  font-size: 10px;
  color: #a0a7b5;
  margin: 1px 0 0;
  font-family: 'Inter', monospace;
}

.props-close {
  padding: 4px;
  border-radius: 8px;
  color: #717786;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.1s;
}
.props-close:hover { background: #f4f3f8; }

.props-section {
  padding: 14px 16px;
  border-bottom: 1px solid #f4f3f8;
}

.props-section-title {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #a0a7b5;
  margin: 0 0 10px;
}

.props-field {
  margin-bottom: 12px;
}
.props-field:last-child { margin-bottom: 0; }

.props-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #414755;
  margin-bottom: 5px;
}

.props-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e3e2e7;
  border-radius: 10px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  color: #1a1b1f;
  background: #f4f3f8;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.props-input:focus { border-color: #0058bc; background: #fff; }

.props-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: 'Inter', monospace;
  font-size: 11px;
}

.props-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #1a1b1f;
  cursor: pointer;
}

.props-empty {
  padding: 20px 16px;
  font-size: 12px;
  color: #a0a7b5;
  text-align: center;
}

.props-section-divider {
  border: none;
  border-top: 1px solid #e3e2e7;
  margin: 4px 0 0;
}

/* Properties panel slide-in transition */
.panel-slide-enter-active,
.panel-slide-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.panel-slide-enter-from,
.panel-slide-leave-to { transform: translateX(100%); opacity: 0; }
</style>
