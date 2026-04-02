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
        <button @click="exportFlow"
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
          style="background:#f4f3f8;color:#414755;">
          <span class="material-symbols-outlined" style="font-size:16px;">download</span>Export
        </button>
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
        :selection-on-drag="true"
        :pan-on-drag="[2]"
        :multi-selection-key-code="'Control'"
        :delete-key-code="['Delete', 'Backspace']"
        fit-view-on-init
        class="flow-canvas"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
        @pane-click="onPaneClick"
        @nodes-change="onNodesChange"
        @connect="onConnect">
        <Background :gap="24" :size="1.5" pattern-color="#d4d2db" variant="dots" />
      </VueFlow>

      <!-- ── Selection action bar ───────────────────────── -->
      <Transition name="action-bar">
        <div v-if="multiSelected.length >= 1" class="selection-bar">
          <span class="material-symbols-outlined" style="font-size:15px;color:#414755;">select_all</span>
          <span class="selection-bar__count">{{ multiSelected.length }} node{{ multiSelected.length > 1 ? 's' : '' }} selected</span>
          <button class="selection-bar__btn" @click="showSubflowModal = true">
            <span class="material-symbols-outlined" style="font-size:14px;">layers</span>
            Group as Subflow
          </button>
        </div>
      </Transition>

      <!-- ── Subflow creation modal ─────────────────────── -->
      <Transition name="modal-fade">
        <div v-if="showSubflowModal" class="modal-backdrop" @click.self="showSubflowModal = false">
          <div class="modal-card" @click.stop>

            <div class="modal-header">
              <span class="material-symbols-outlined" style="font-size:20px;color:#0058bc;font-variation-settings:'FILL' 1;">layers</span>
              <span class="modal-title">Create Subflow</span>
              <button class="modal-close" @click="showSubflowModal = false">
                <span class="material-symbols-outlined" style="font-size:18px;">close</span>
              </button>
            </div>

            <div class="modal-body">
              <div class="props-field">
                <label class="props-label">Name <span style="color:#991b1b;">*</span></label>
                <input v-model="subflowForm.name" type="text" class="props-input" placeholder="Subflow name…" />
              </div>
              <div class="props-field">
                <label class="props-label">Description</label>
                <textarea v-model="subflowForm.description" class="props-input props-textarea" rows="3" placeholder="Optional description…" />
              </div>
              <div class="props-field">
                <label class="props-label">Type <span style="color:#991b1b;">*</span></label>
                <div class="sf-type-grid">
                  <label
                    v-for="t in SF_TYPES" :key="t.value"
                    class="sf-type-opt"
                    :style="subflowForm.type === t.value
                      ? { borderColor: t.color, background: t.bg }
                      : {}"
                  >
                    <input type="radio" v-model="subflowForm.type" :value="t.value" style="display:none" />
                    <span class="material-symbols-outlined"
                      :style="{ color: subflowForm.type === t.value ? t.color : '#a0a7b5', fontSize: '20px', fontVariationSettings: '\'FILL\' 1' }">
                      {{ t.icon }}
                    </span>
                    <span class="sf-type-opt__label"
                      :style="{ color: subflowForm.type === t.value ? t.color : '#414755', fontWeight: subflowForm.type === t.value ? '700' : '500' }">
                      {{ t.label }}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" @click="showSubflowModal = false">Cancel</button>
              <button class="btn-primary" :disabled="!subflowForm.name.trim()" @click="confirmCreateSubflow">
                <span class="material-symbols-outlined" style="font-size:14px;">layers</span>
                Create Subflow
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ── LEFT: Node Types Sidebar ───────────────────────── -->
      <aside class="node-types-sidebar" :class="{ 'node-types-sidebar--open': paletteOpen }">
        <div class="sidebar-header">
          <button class="sidebar-toggle" @click="paletteOpen = !paletteOpen">
            <span class="material-symbols-outlined" style="font-size:18px;">{{ paletteOpen ? 'chevron_left' : 'chevron_right' }}</span>
          </button>
          <span v-if="paletteOpen" class="material-symbols-outlined" style="font-size:16px;color:#0058bc;">widgets</span>
          <span v-if="paletteOpen" style="font-size:12px;font-weight:700;color:#1a1b1f;">Node Types</span>
        </div>
        
        <div v-show="paletteOpen" class="sidebar-content">
          <div v-for="cat in CATEGORIES" :key="cat" class="sidebar-category">
            <div class="sidebar-cat-header" @click="toggleCategory(cat)">
              <span class="material-symbols-outlined sidebar-cat-toggle" :class="{ 'sidebar-cat-toggle--collapsed': isCategoryCollapsed(cat) }">
                expand_more
              </span>
              <p class="sidebar-cat-label" :style="{ color: CATEGORY_COLORS[cat] }">{{ cat }}</p>
            </div>
            <Transition name="sidebar-category">
              <div v-if="!isCategoryCollapsed(cat)" class="sidebar-cat-items">
                <div
                  v-for="type in typesByCategory(cat)" :key="type.id"
                  class="sidebar-item"
                  :style="{ borderLeftColor: type.color }"
                  draggable="true"
                  @dragstart="onDragStart($event, type.id)">
                  <div class="sidebar-item__icon" :style="{ background: type.color }">
                    <span class="material-symbols-outlined" style="font-size:14px;color:#fff;font-variation-settings:'FILL' 1;">
                      {{ type.icon }}
                    </span>
                  </div>
                  <div class="sidebar-item__text">
                    <p class="sidebar-item__name">{{ type.name }}</p>
                    <p class="sidebar-item__desc">{{ type.description }}</p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </aside>

      <!-- ── RIGHT: Properties Panel ─────────────────────── -->
      <Transition name="panel-slide">
        <aside v-if="selectedNode || selectedCollapsedNode" class="props-panel" @click.stop>

          <!-- Panel header — collapsed node -->
          <div v-if="selectedCollapsedNode" class="props-header">
            <button class="props-back" @click="selectedCollapsedNode = null" title="Back to SubFlow">
              <span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span>
            </button>
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div v-if="collapsedNodeType" class="props-header__icon" :style="{ background: collapsedNodeType.color }">
                <span class="material-symbols-outlined" style="font-size:16px;color:#fff;font-variation-settings:'FILL' 1;">
                  {{ collapsedNodeType.icon }}
                </span>
              </div>
              <div class="min-w-0">
                <p class="props-header__name">{{ collapsedNodeType?.name ?? selectedCollapsedNode.node.label }}</p>
                <p class="props-header__id">{{ selectedCollapsedNode.node.typeId }}</p>
              </div>
            </div>
            <button @click="selectedCollapsedNode = null" class="props-close">
              <span class="material-symbols-outlined" style="font-size:18px;">close</span>
            </button>
          </div>

          <!-- Panel header — normal node -->
          <div v-else-if="selectedNode" class="props-header">
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

          <!-- ── Collapsed node panel ─────────────────────── -->
          <template v-if="selectedCollapsedNode">
            <div class="props-section">
              <p class="props-section-title">General</p>
              <div class="props-field">
                <label class="props-label">Name</label>
                <input type="text" class="props-input"
                  :value="selectedCollapsedNode.node.label"
                  @input="updateCollapsedNodeData('label', ($event.target as HTMLInputElement).value)" />
              </div>
            </div>
            <div v-if="collapsedNodeType && collapsedNodeType.properties.length" class="props-section">
              <p class="props-section-title">Properties</p>
              <div v-for="prop in collapsedNodeType.properties" :key="prop.key" class="props-field">
                <label class="props-label">{{ prop.label }}<span v-if="prop.required" style="color:#991b1b;"> *</span></label>
                <input v-if="prop.type === 'string'" type="text" class="props-input"
                  :placeholder="prop.defaultValue ?? ''"
                  :value="selectedCollapsedNode.node.props?.[prop.key] ?? prop.defaultValue ?? ''"
                  @input="updateCollapsedNodeProp(prop.key, ($event.target as HTMLInputElement).value)" />
                <input v-else-if="prop.type === 'number'" type="number" class="props-input"
                  :value="selectedCollapsedNode.node.props?.[prop.key] ?? prop.defaultValue ?? ''"
                  @input="updateCollapsedNodeProp(prop.key, Number(($event.target as HTMLInputElement).value))" />
                <label v-else-if="prop.type === 'boolean'" class="props-checkbox-label">
                  <input type="checkbox"
                    :checked="selectedCollapsedNode.node.props?.[prop.key] ?? prop.defaultValue ?? false"
                    @change="updateCollapsedNodeProp(prop.key, ($event.target as HTMLInputElement).checked)" />
                  {{ prop.label }}
                </label>
                <select v-else-if="prop.type === 'select'" class="props-input"
                  :value="selectedCollapsedNode.node.props?.[prop.key] ?? prop.defaultValue ?? ''"
                  @change="updateCollapsedNodeProp(prop.key, ($event.target as HTMLSelectElement).value)">
                  <option v-for="opt in prop.options" :key="opt" :value="opt">{{ opt }}</option>
                </select>
                <textarea v-else-if="prop.type === 'textarea'" class="props-input props-textarea" rows="4"
                  :value="selectedCollapsedNode.node.props?.[prop.key] ?? prop.defaultValue ?? ''"
                  @input="updateCollapsedNodeProp(prop.key, ($event.target as HTMLTextAreaElement).value)" />
              </div>
            </div>
            <div v-else-if="collapsedNodeType" class="props-empty">No configurable properties.</div>
          </template>

          <!-- ── Normal node panels ───────────────────────── -->
          <!-- SubFlow properties -->
          <div v-if="selectedNode && selectedNode.type === 'subflow'" class="props-section">
            <p class="props-section-title">Subflow</p>
            <div class="props-field">
              <label class="props-label">Name <span style="color:#991b1b;">*</span></label>
              <input type="text" class="props-input"
                :value="selectedNode.data.label ?? ''"
                @input="updateNodeData('label', ($event.target as HTMLInputElement).value)" />
            </div>
            <div class="props-field">
              <label class="props-label">Description</label>
              <textarea class="props-input props-textarea" rows="2"
                :value="selectedNode.data.description ?? ''"
                @input="updateNodeData('description', ($event.target as HTMLTextAreaElement).value)" />
            </div>
            <div class="props-field">
              <label class="props-label">Type <span style="color:#991b1b;">*</span></label>
              <div class="sf-type-grid">
                <label
                  v-for="t in SF_TYPES" :key="t.value"
                  class="sf-type-opt"
                  :style="selectedNode.data.flowType === t.value
                    ? { borderColor: t.color, background: t.bg }
                    : {}">
                  <input type="radio"
                    :checked="selectedNode.data.flowType === t.value"
                    @change="updateNodeData('flowType', t.value); updateNodeData('color', t.color)"
                    style="display:none" />
                  <span class="material-symbols-outlined"
                    :style="{ color: selectedNode.data.flowType === t.value ? t.color : '#a0a7b5', fontSize: '18px', fontVariationSettings: '\'FILL\' 1' }">
                    {{ t.icon }}
                  </span>
                  <span class="sf-type-opt__label"
                    :style="{ color: selectedNode.data.flowType === t.value ? t.color : '#414755', fontWeight: selectedNode.data.flowType === t.value ? '700' : '500' }">
                    {{ t.label }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- Protocol type selector (only for protocol nodes) -->
          <div v-if="selectedNode && selectedNode.type === 'protocol'" class="props-section">
            <label class="props-label">Protocol Type</label>
            <select class="props-input" :value="selectedNode.data.typeId" @change="changeProtocolType">
              <option v-for="t in protocolTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>

          <!-- Catalog Node — name & description -->
          <div v-if="selectedNode && selectedNode.data.typeId === 'catalog-node@v1'" class="props-section">
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
          <div v-if="selectedNode && selectedNode.data.typeId === 'catalog-node@v1'" class="props-section">
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
          <div v-else-if="selectedNode && selectedNodeType && selectedNodeType.properties.length" class="props-section">
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

          <div v-else-if="selectedNode && selectedNodeType && selectedNode.type !== 'subflow'" class="props-empty">
            No configurable properties for this node type.
          </div>
        </aside>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw, reactive, computed, watch, provide, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VueFlow, useVueFlow, MarkerType, ConnectionMode } from '@vue-flow/core';
import type { Node, Edge, Connection, NodeMouseEvent, NodeChange, EdgeMouseEvent } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import ProtocolNode from '../components/integration/ProtocolNode.vue';
import FlowNode from '../components/integration/FlowNode.vue';
import FilterNode from '../components/integration/FilterNode.vue';
import SubFlowNode from '../components/integration/SubFlowNode.vue';
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
  subflow:  markRaw(SubFlowNode),
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
const collapsedCategories = ref<Set<string>>(new Set(['Protocol', 'Transform', 'Routing', 'Connector', 'Control']));

function typesByCategory(cat: string) {
  return NODE_TYPE_CATALOG.filter(t => t.category === cat);
}

function toggleCategory(cat: string) {
  if (collapsedCategories.value.has(cat)) {
    collapsedCategories.value.delete(cat);
  } else {
    collapsedCategories.value.add(cat);
  }
}

function isCategoryCollapsed(cat: string) {
  return collapsedCategories.value.has(cat);
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

  // Subflow node dropped from palette — create a blank subflow
  if (typeId === 'subflow-node@v1') {
    addNodes([{
      id: `subflow-${Date.now()}`,
      type: 'subflow',
      position: dropPos,
      data: {
        label:          'Sub Flow',
        description:    '',
        flowType:       'inflow',
        color:          '#0058bc',
        collapsedNodes: [],
      },
    }]);
    return;
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

// ── Collapsed node selection (chip inside SubFlowNode) ────
interface CollapsedNodeRef {
  subflowId: string;
  index:     number;
  node:      { id: string; type: string; typeId: string; label: string; description?: string; props: Record<string, any> };
}
const selectedCollapsedNode = ref<CollapsedNodeRef | null>(null);

const collapsedNodeType = computed(() =>
  selectedCollapsedNode.value ? findNodeType(selectedCollapsedNode.value.node.typeId) : null
);

provide('subflowChipClick', (subflowId: string, index: number) => {
  const sfNode = nodes.value.find(n => n.id === subflowId);
  if (!sfNode) return;
  const node = sfNode.data.collapsedNodes?.[index];
  if (!node) return;
  selectedNode.value = null;
  selectedCollapsedNode.value = { subflowId, index, node };
});

provide('addNodeToSubflow', (subflowId: string, typeId: string) => {
  const nt = findNodeType(typeId);
  const sfNode = nodes.value.find(n => n.id === subflowId);
  if (!sfNode) return;

  const newNode = {
    id: `filter-${Date.now()}`,
    type: 'filter',
    typeId,
    label: nt?.name ?? typeId,
    props: {},
  };

  const list = [...(sfNode.data.collapsedNodes ?? []), newNode];
  updateNode(subflowId, { data: { ...sfNode.data, collapsedNodes: list } });
});

provide('moveNodeToSubflow', (subflowId: string, nodeId: string, typeId: string) => {
  const sfNode = nodes.value.find(n => n.id === subflowId);
  const node = nodes.value.find(n => n.id === nodeId);
  if (!sfNode || !node) return;

  const newNode = {
    id: node.id,
    type: 'filter',
    typeId: node.data.typeId,
    label: node.data.label,
    description: node.data.description,
    props: { ...node.data.props },
  };

  const list = [...(sfNode.data.collapsedNodes ?? []), newNode];
  updateNode(subflowId, { data: { ...sfNode.data, collapsedNodes: list } });

  nodes.value = nodes.value.filter(n => n.id !== nodeId);
  edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId);
});

const selectedCatalogEntry = computed(() => {
  if (!selectedNode.value) return null;
  const catalogTypeId = selectedNode.value.data.props?.catalogTypeId;
  if (!catalogTypeId) return null;
  return catalogStore.byId(catalogTypeId) ?? null;
});

// ── Multi-selection state ─────────────────────────────────
const multiSelected = computed(() => nodes.value.filter(n => n.selected));

// Hide props panel when rubber-band selects 2+ nodes
watch(multiSelected, (sel) => {
  if (sel.length > 1) selectedNode.value = null;
});

function onNodeClick(event: NodeMouseEvent) {
  selectedCollapsedNode.value = null;
  if (event.event.ctrlKey || event.event.metaKey) {
    selectedNode.value = null;
    return;
  }
  selectedNode.value = event.node;
}

function onEdgeClick(event: EdgeMouseEvent) {
  const edge = event.edge;
  edge.style = { ...edge.style, strokeDasharray: '5,5', strokeWidth: 3 };
  tempSelectedEdge.value = edge;
  document.addEventListener('mouseup', onEdgeMouseUp, { once: true });
}

function onEdgeMouseUp() {
  if (tempSelectedEdge.value) {
    const edge = edges.value.find(e => e.id === tempSelectedEdge.value?.id);
    if (edge) {
      edge.style = { stroke: '#0058bc', strokeWidth: 2, strokeDasharray: undefined };
    }
    tempSelectedEdge.value = null;
  }
}

const tempSelectedEdge = ref<Edge | null>(null);

function onPaneClick() {
  selectedNode.value = null;
  selectedCollapsedNode.value = null;
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

// ── Subflow grouping ──────────────────────────────────────
const SF_TYPES = [
  { value: 'inflow',    label: 'Inflow',    icon: 'input',  color: '#0058bc', bg: '#eff6ff' },
  { value: 'outflow',   label: 'Outflow',   icon: 'output', color: '#047857', bg: '#f0fdf4' },
  { value: 'exception', label: 'Exception', icon: 'report', color: '#991b1b', bg: '#fef2f2' },
] as const;

const SF_COLOR: Record<string, string> = { inflow: '#0058bc', outflow: '#047857', exception: '#991b1b' };

const showSubflowModal = ref(false);
const subflowForm = reactive({ name: '', description: '', type: 'inflow' as 'inflow' | 'outflow' | 'exception' });

function confirmCreateSubflow() {
  if (!subflowForm.name.trim()) return;

  const selNodes = nodes.value.filter(n => n.selected);
  if (!selNodes.length) return;

  const selIds = new Set(selNodes.map(n => n.id));

  // Bounding box of selected nodes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of selNodes) {
    const w = typeof n.style?.width  === 'string' ? parseInt(n.style.width  as string) : (n.style?.width  as number | undefined ?? 160);
    const h = typeof n.style?.height === 'string' ? parseInt(n.style.height as string) : (n.style?.height as number | undefined ?? 56);
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  }

  // Edges that cross the selection boundary (one end inside, one outside)
  const externalEdges = edges.value.filter(e => {
    const si = selIds.has(e.source);
    const ti = selIds.has(e.target);
    return si !== ti;
  });

  // Remove selected nodes and all their connected edges
  nodes.value = nodes.value.filter(n => !selIds.has(n.id));
  edges.value = edges.value.filter(e => !selIds.has(e.source) && !selIds.has(e.target));

  const sfId = `subflow-${Date.now()}`;
  const PAD  = 32;

  // Add subflow node positioned at the bounding box
  nodes.value = [
    ...nodes.value,
    {
      id:   sfId,
      type: 'subflow',
      position: { x: minX - PAD, y: minY - PAD },
      data: {
        label:       subflowForm.name.trim(),
        description: subflowForm.description.trim() || undefined,
        flowType:    subflowForm.type,
        color:       SF_COLOR[subflowForm.type],
        collapsedNodes: selNodes.map(n => ({
          id:          n.id,
          type:        n.type ?? 'filter',
          typeId:      n.data?.typeId      ?? n.type ?? '',
          label:       n.data?.label       ?? '',
          description: n.data?.description ?? '',
          props:       { ...(n.data?.props ?? {}) },
        })),
      },
    } as any,
  ];

  // Reconnect external edges to the subflow node
  if (externalEdges.length) {
    edges.value = [
      ...edges.value,
      ...externalEdges.map(e => ({
        ...e,
        id:           `${e.id}-sf`,
        source:       selIds.has(e.source) ? sfId : e.source,
        sourceHandle: selIds.has(e.source) ? 'right' : (e.sourceHandle ?? undefined),
        target:       selIds.has(e.target) ? sfId : e.target,
        targetHandle: selIds.has(e.target) ? 'left'  : (e.targetHandle ?? undefined),
      })),
    ];
  }

  // Reset form
  showSubflowModal.value = false;
  subflowForm.name        = '';
  subflowForm.description = '';
  subflowForm.type        = 'inflow';
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

// ── Collapsed node prop/data update ──────────────────────
function updateCollapsedNodeProp(key: string, value: any) {
  if (!selectedCollapsedNode.value) return;
  const { subflowId, index } = selectedCollapsedNode.value;
  const sfNode = nodes.value.find(n => n.id === subflowId);
  if (!sfNode) return;
  const list = [...(sfNode.data.collapsedNodes ?? [])];
  list[index] = { ...list[index], props: { ...list[index].props, [key]: value } };
  updateNode(subflowId, { data: { ...sfNode.data, collapsedNodes: list } });
  selectedCollapsedNode.value = { ...selectedCollapsedNode.value, node: list[index] };
}

function updateCollapsedNodeData(key: string, value: any) {
  if (!selectedCollapsedNode.value) return;
  const { subflowId, index } = selectedCollapsedNode.value;
  const sfNode = nodes.value.find(n => n.id === subflowId);
  if (!sfNode) return;
  const list = [...(sfNode.data.collapsedNodes ?? [])];
  list[index] = { ...list[index], [key]: value };
  updateNode(subflowId, { data: { ...sfNode.data, collapsedNodes: list } });
  selectedCollapsedNode.value = { ...selectedCollapsedNode.value, node: list[index] };
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

function exportFlow() {
  const name = integration.value?.name ?? 'unknown';
  const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const filename = `integrationflow-design-${safeName}.json`;
  
  const payload = {
    type: 'integration-flow',
    integrationId: integrationId.value,
    integrationName: name,
    exportedAt: new Date().toISOString(),
    nodes: nodes.value,
    edges: edges.value,
  };
  
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

.palette-export {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #0058bc;
  border: 1px solid #0058bc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ffffff;
  flex-shrink: 0;
  transition: background 0.12s, opacity 0.12s;
}
.palette-export:hover { background: #004699; }

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
  margin-bottom: 8px;
}

.palette-cat-header {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 0;
  user-select: none;
}
.palette-cat-header:hover .palette-cat-label { opacity: 0.8; }

.palette-cat-toggle {
  font-size: 16px;
  color: #717786;
  transition: transform 0.15s;
  flex-shrink: 0;
}
.palette-cat-toggle--collapsed { transform: rotate(-90deg); }

.palette-cat-items {
  overflow: hidden;
}

.palette-category-enter-active,
.palette-category-leave-active {
  transition: opacity 0.15s, max-height 0.2s ease;
}
.palette-category-enter-from,
.palette-category-leave-to {
  opacity: 0;
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

/* ── Node Types Sidebar ── */
.node-types-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 44px;
  background: #ffffff;
  border-right: 1px solid #e3e2e7;
  box-shadow: 4px 0 20px rgba(0,0,0,0.08);
  z-index: 30;
  display: flex;
  flex-direction: column;
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.node-types-sidebar--open {
  width: 240px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-bottom: 1px solid #e3e2e7;
  flex-shrink: 0;
}

.sidebar-toggle {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #f4f3f8;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #414755;
  transition: background 0.12s;
  flex-shrink: 0;
}
.sidebar-toggle:hover { background: #e3e2e7; }

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  scrollbar-width: thin;
}

.sidebar-category {
  margin-bottom: 8px;
}

.sidebar-cat-header {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 6px 4px;
  user-select: none;
  border-radius: 8px;
}
.sidebar-cat-header:hover { background: #f4f3f8; }

.sidebar-cat-toggle {
  font-size: 16px;
  color: #717786;
  transition: transform 0.15s;
  flex-shrink: 0;
}
.sidebar-cat-toggle--collapsed { transform: rotate(-90deg); }

.sidebar-cat-items {
  overflow: hidden;
}

.sidebar-category-enter-active,
.sidebar-category-leave-active {
  transition: opacity 0.15s, max-height 0.2s ease;
}
.sidebar-category-enter-from,
.sidebar-category-leave-to {
  opacity: 0;
}

.sidebar-cat-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 10px;
  border-left: 3px solid transparent;
  cursor: grab;
  transition: background 0.1s;
  margin-bottom: 2px;
}
.sidebar-item:hover { background: #f4f3f8; }
.sidebar-item:active { cursor: grabbing; }

.sidebar-item__icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-item__text { flex: 1; min-width: 0; }

.sidebar-item__name {
  font-size: 11px;
  font-weight: 700;
  color: #1a1b1f;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-item__desc {
  font-size: 9px;
  color: #a0a7b5;
  margin: 1px 0 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

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

.props-back {
  padding: 4px;
  border-radius: 8px;
  color: #717786;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.1s;
}
.props-back:hover { background: #f4f3f8; }

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

/* ── Selection action bar ── */
.selection-bar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #ffffff;
  border: 1px solid #e3e2e7;
  border-radius: 999px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  white-space: nowrap;
}

.selection-bar__count {
  font-size: 12px;
  font-weight: 600;
  color: #414755;
}

.selection-bar__btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 999px;
  background: #0058bc;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.12s;
}
.selection-bar__btn:hover { opacity: 0.85; }

.action-bar-enter-active, .action-bar-leave-active { transition: opacity 0.15s, transform 0.15s; }
.action-bar-enter-from, .action-bar-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }

/* ── Modal ── */
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-card {
  width: 420px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #e3e2e7;
}

.modal-title {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: #1a1b1f;
}

.modal-close {
  padding: 4px;
  border-radius: 8px;
  color: #717786;
  cursor: pointer;
  transition: background 0.1s;
}
.modal-close:hover { background: #f4f3f8; }

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e3e2e7;
}

.btn-secondary {
  padding: 7px 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #414755;
  background: #f4f3f8;
  cursor: pointer;
  transition: background 0.1s;
}
.btn-secondary:hover { background: #e3e2e7; }

.btn-primary {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  background: #0058bc;
  cursor: pointer;
  transition: opacity 0.1s;
}
.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

/* Subflow type selector */
.sf-type-grid {
  display: flex;
  gap: 8px;
}

.sf-type-opt {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border: 2px solid #e3e2e7;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}
.sf-type-opt:hover { background: #f4f3f8; }

.sf-type-opt__label {
  font-size: 11px;
  text-align: center;
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
