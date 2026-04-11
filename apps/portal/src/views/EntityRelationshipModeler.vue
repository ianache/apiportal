<template>
  <div class="er-modeler">

    <!-- ── Toolbar ─────────────────────────────────────── -->
    <header class="er-toolbar">
      <!-- Left -->
      <div class="flex items-center gap-3">
        <button @click="router.push('/domains')" class="toolbar-btn">
          <span class="material-symbols-outlined" style="font-size:18px;">arrow_back</span>
          <span>Domains</span>
        </button>
        <span class="toolbar-divider">|</span>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined" style="font-size:18px;color:#7c3aed;">table_chart</span>
          <span class="text-sm font-semibold">{{ domainTitle }}</span>
        </div>
      </div>

      <!-- Center Tools -->
      <div class="flex items-center gap-3">
        <!-- Add Table -->
        <button @click="addTable" class="toolbar-btn toolbar-btn--secondary" title="Add Table">
          <span class="material-symbols-outlined" style="font-size:18px;">add_box</span>
          <span>Table</span>
        </button>

        <div class="toolbar-separator"></div>

        <!-- AI Assist -->
        <button @click="showAIPanel = !showAIPanel" class="toolbar-btn toolbar-btn--ai" title="AI Assist">
          <span class="material-symbols-outlined" style="font-size:18px;">auto_awesome</span>
          <span>AI Assist</span>
        </button>

        <!-- Save Design -->
        <button @click="saveDesign" class="toolbar-btn toolbar-btn--save" title="Save Design">
          <span class="material-symbols-outlined" style="font-size:18px;">save</span>
          <span>Save</span>
        </button>
      </div>

      <!-- Right -->
      <div class="flex items-center gap-3">
        <span v-if="saveStatus" class="save-status" :class="saveStatus">
          {{ saveStatus === 'saving' ? 'Saving...' : 'Saved' }}
        </span>
        <span class="text-xs" style="color:#a0a7b5;">{{ tables.length }} tables</span>
      </div>
    </header>

    <!-- ── Main Area ───────────────────────────────────── -->
    <div class="er-main">

      <!-- Canvas -->
      <div ref="canvasRef" class="er-canvas" @click="onCanvasClick">
        <svg class="er-svg" :width="canvasWidth" :height="canvasHeight">
          <!-- Grid -->
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e3e2e7" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <!-- Relationships -->
          <g v-for="rel in relationships" :key="rel.id">
            <path
              :d="getRelationshipPath(rel)"
              fill="none"
              :stroke="selectedItem?.type === 'relationship' && selectedItem.id === rel.id ? '#dc2626' : '#0058bc'"
              stroke-width="2"
              marker-end="url(#arrowhead)"
              class="relationship-line"
              @click.stop="selectRelationship(rel)"
            />
            <!-- Source multiplicity -->
            <text
              :x="getMultiplicityPosition(rel, 'source').x"
              :y="getMultiplicityPosition(rel, 'source').y"
              class="multiplicity-label"
              text-anchor="middle"
              @click.stop="selectRelationship(rel)"
            >{{ rel.sourceMultiplicity || '1' }}</text>
            <!-- Target multiplicity -->
            <text
              :x="getMultiplicityPosition(rel, 'target').x"
              :y="getMultiplicityPosition(rel, 'target').y"
              class="multiplicity-label"
              text-anchor="middle"
              @click.stop="selectRelationship(rel)"
            >{{ rel.targetMultiplicity || '1' }}</text>
          </g>

          <!-- Arrow marker definition -->
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#0058bc" />
            </marker>
          </defs>
        </svg>

        <!-- Tables -->
        <div
          v-for="table in tables"
          :key="table.id"
          class="er-table"
          :class="{ 'er-table--selected': selectedItem?.type === 'table' && selectedItem.id === table.id, 'er-table--dragging': draggingTableId === table.id }"
          :style="{ left: table.x + 'px', top: table.y + 'px' }"
          @mousedown="startDragTable($event, table)"
          @click.stop="selectTable(table)"
        >
          <!-- Table Header -->
          <div class="er-table__header">
            <span class="er-table__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" stroke-width="2"/>
                <line x1="3" y1="9" x2="21" y2="9" stroke="white" stroke-width="2"/>
              </svg>
            </span>
            <span class="er-table__name">{{ table.name }}</span>
            <button class="er-table__close" @click.stop="deleteTable(table.id)">
              <span class="material-symbols-outlined" style="font-size:14px;">close</span>
            </button>
          </div>

          <!-- Columns -->
          <div class="er-table__columns">
            <div
              v-for="col in table.columns"
              :key="col.id"
              class="er-column"
              :class="{
                'er-column--pk': col.isPrimaryKey,
                'er-column--fk': col.isForeignKey,
                'er-column--selected': selectedItem?.type === 'column' && selectedItem.id === col.id
              }"
              @click.stop="selectColumn(table, col)"
              draggable="true"
              @dragstart="startDragColumn($event, table, col)"
            >
              <span class="er-column__key" v-if="col.isPrimaryKey">PK</span>
              <span class="er-column__key er-column__key--fk" v-else-if="col.isForeignKey">FK</span>
              <span class="er-column__key er-column__key--none" v-else></span>
              <span class="er-column__name">{{ col.name }}</span>
              <span class="er-column__type">{{ col.dataType }}</span>
            </div>
          </div>

          <!-- Drop zone for relationships -->
          <div
            class="er-table__drop-zone"
            :class="{ 'er-table__drop-zone--active': isValidDropTarget(table) }"
            @dragover.prevent="onDragOver($event, table)"
            @drop="onDropColumn($event, table)"
          >
            <span class="text-xs" style="color:#a0a7b5;">Drop to link</span>
          </div>
        </div>

        <!-- Dragging line preview -->
        <svg v-if="draggingColumn" class="er-drag-line">
          <line
            :x1="dragStartX"
            :y1="dragStartY"
            :x2="dragCurrentX"
            :y2="dragCurrentY"
            stroke="#7c3aed"
            stroke-width="2"
            stroke-dasharray="5,5"
          />
        </svg>
      </div>

      <!-- AI Assist Panel (Right) -->
      <aside v-if="showAIPanel" class="ai-panel">
        <div class="ai-panel__header">
          <span class="material-symbols-outlined" style="font-size:20px;color:#7c3aed;">auto_awesome</span>
          <span class="text-sm font-bold">AI Assist</span>
          <button @click="showAIPanel = false" class="ai-panel__close">
            <span class="material-symbols-outlined" style="font-size:18px;">close</span>
          </button>
        </div>

        <div class="ai-panel__content">
          <p class="text-xs" style="color:#717786;margin-bottom:12px;">
            Describe your database schema and I'll generate tables, columns, and relationships.
          </p>

          <textarea
            v-model="aiPrompt"
            class="ai-panel__textarea"
            placeholder="e.g., Create a schema for an e-commerce system with customers, orders, products, and order items..."
            rows="6"
          ></textarea>

          <button
            @click="generateWithAI"
            :disabled="!aiPrompt.trim() || aiLoading"
            class="ai-panel__btn ai-panel__btn--generate"
          >
            <span v-if="aiLoading" class="material-symbols-outlined animate-spin">progress_activity</span>
            <span v-else class="material-symbols-outlined">auto_awesome</span>
            {{ aiLoading ? 'Generating...' : 'Generate' }}
          </button>

          <!-- Generated Preview -->
          <div v-if="aiGeneratedSQL" class="ai-panel__preview">
            <div class="ai-panel__preview-header">
              <span class="text-xs font-bold">Generated Schema</span>
              <button @click="copyGeneratedSQL" class="ai-panel__copy">
                <span class="material-symbols-outlined" style="font-size:14px;">content_copy</span>
              </button>
            </div>
            <pre class="ai-panel__code">{{ aiGeneratedSQL }}</pre>

            <button @click="applyGeneratedSchema" class="ai-panel__btn ai-panel__btn--apply">
              <span class="material-symbols-outlined">update</span>
              Update Diagram
            </button>
          </div>
        </div>
      </aside>

      <!-- Properties Panel (Right) -->
      <aside v-if="selectedItem && !showAIPanel" class="properties-panel">
        <!-- Table Properties -->
        <template v-if="selectedItem.type === 'table'">
          <div class="panel-header">
            <span class="text-sm font-bold">Table Properties</span>
            <button @click="selectedItem = null" class="panel-close">
              <span class="material-symbols-outlined" style="font-size:18px;">close</span>
            </button>
          </div>

          <div class="panel-body">
            <div class="panel-section">
              <label class="panel-label">TABLE NAME</label>
              <input v-model="tableForm.name" @change="updateTable" class="panel-input" placeholder="table_name" />
            </div>

            <div class="panel-section">
              <label class="panel-label">COLUMNS</label>
              <button @click="addColumn" class="panel-btn panel-btn--add">
                <span class="material-symbols-outlined" style="font-size:14px;">add</span>
                Add Column
              </button>

              <div class="columns-list">
                <div v-for="col in tableForm.columns" :key="col.id" class="column-item">
                  <div class="column-item__header" @click="toggleColumnExpand(col.id)">
                    <span class="material-symbols-outlined" style="font-size:14px;color:#717786;">
                      {{ expandedColumns.has(col.id) ? 'expand_more' : 'chevron_right' }}
                    </span>
                    <span class="column-item__pk" :class="{ 'column-item__pk--active': col.isPrimaryKey }">PK</span>
                    <span class="column-item__name">{{ col.name }}</span>
                    <span class="column-item__type">{{ col.dataType }}</span>
                    <button @click.stop="deleteColumn(col.id)" class="column-item__delete">
                      <span class="material-symbols-outlined" style="font-size:14px;color:#991b1b;">delete</span>
                    </button>
                  </div>

                  <div v-if="expandedColumns.has(col.id)" class="column-item__form">
                    <div class="panel-field">
                      <label class="panel-label">COLUMN NAME</label>
                      <input v-model="col.name" @change="updateTable" class="panel-input" />
                    </div>
                    <div class="panel-field">
                      <label class="panel-label">DATA TYPE</label>
                      <select v-model="col.dataType" @change="updateTable" class="panel-select">
                        <option value="UUID">UUID</option>
                        <option value="VARCHAR(255)">VARCHAR(255)</option>
                        <option value="TEXT">TEXT</option>
                        <option value="INTEGER">INTEGER</option>
                        <option value="BIGINT">BIGINT</option>
                        <option value="DECIMAL">DECIMAL</option>
                        <option value="BOOLEAN">BOOLEAN</option>
                        <option value="DATE">DATE</option>
                        <option value="TIMESTAMP">TIMESTAMP</option>
                        <option value="JSONB">JSONB</option>
                      </select>
                    </div>
                    <div class="panel-field panel-field--row">
                      <label class="checkbox-label">
                        <input type="checkbox" v-model="col.isPrimaryKey" @change="updateTable" />
                        Primary Key
                      </label>
                      <label class="checkbox-label">
                        <input type="checkbox" v-model="col.isNullable" @change="updateTable" />
                        Nullable
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Relationship Properties -->
        <template v-else-if="selectedItem.type === 'relationship'">
          <div class="panel-header">
            <span class="text-sm font-bold">Relationship Properties</span>
            <button @click="selectedItem = null" class="panel-close">
              <span class="material-symbols-outlined" style="font-size:18px;">close</span>
            </button>
          </div>

          <div class="panel-body">
            <div class="panel-section">
              <label class="panel-label">RELATIONSHIP</label>
              <div class="relationship-info">
                <span>{{ getTableName(relForm.sourceTableId) }}</span>
                <span class="relationship-info__arrow">→</span>
                <span>{{ getTableName(relForm.targetTableId) }}</span>
              </div>
            </div>

            <div class="panel-section">
              <label class="panel-label">SOURCE COLUMN</label>
              <select v-model="relForm.sourceColumnId" @change="updateRelationship" class="panel-select">
                <option value="">Select column...</option>
                <option v-for="col in getTableColumns(relForm.sourceTableId)" :key="col.id" :value="col.id">
                  {{ col.name }}
                </option>
              </select>
            </div>

            <div class="panel-section">
              <label class="panel-label">TARGET COLUMN</label>
              <select v-model="relForm.targetColumnId" @change="updateRelationship" class="panel-select">
                <option value="">Select column...</option>
                <option v-for="col in getTableColumns(relForm.targetTableId)" :key="col.id" :value="col.id">
                  {{ col.name }}
                </option>
              </select>
            </div>

            <div class="panel-section panel-section--grid">
              <div>
                <label class="panel-label">SOURCE MULTIPLICITY</label>
                <select v-model="relForm.sourceMultiplicity" @change="updateRelationship" class="panel-select">
                  <option value="1">1 (One)</option>
                  <option value="0..1">0..1 (Zero or One)</option>
                  <option value="1..*">1..* (One or Many)</option>
                  <option value="0..*">0..* (Zero or Many)</option>
                </select>
              </div>
              <div>
                <label class="panel-label">TARGET MULTIPLICITY</label>
                <select v-model="relForm.targetMultiplicity" @change="updateRelationship" class="panel-select">
                  <option value="1">1 (One)</option>
                  <option value="0..1">0..1 (Zero or One)</option>
                  <option value="1..*">1..* (One or Many)</option>
                  <option value="0..*">0..* (Zero or Many)</option>
                </select>
              </div>
            </div>

            <div class="panel-section">
              <button @click="deleteRelationship" class="panel-btn panel-btn--danger">
                <span class="material-symbols-outlined" style="font-size:14px;">delete</span>
                Delete Relationship
              </button>
            </div>
          </div>
        </template>
      </aside>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDomainsStore } from '../stores/domains';
import { useLLMPreferencesStore } from '../stores/preferences';
import { useAuthStore } from '../stores/auth';

interface Column {
  id: string;
  name: string;
  dataType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  references?: { tableId: string; columnId: string };
}

interface Table {
  id: string;
  name: string;
  x: number;
  y: number;
  columns: Column[];
}

interface Relationship {
  id: string;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  sourceMultiplicity: string;
  targetMultiplicity: string;
}

const route = useRoute();
const router = useRouter();
const domainsStore = useDomainsStore();
const llmPrefs = useLLMPreferencesStore();
const auth = useAuthStore();

const domainId = computed(() => route.params.id as string);
const domainTitle = ref('');
const canvasRef = ref<HTMLElement | null>(null);
const canvasWidth = ref(2000);
const canvasHeight = ref(2000);

// State
const tables = ref<Table[]>([]);
const relationships = ref<Relationship[]>([]);
const selectedItem = ref<{ type: 'table'; id: string } | { type: 'column'; id: string; tableId: string } | { type: 'relationship'; id: string } | null>(null);
const showAIPanel = ref(false);
const aiPrompt = ref('');
const aiLoading = ref(false);
const aiGeneratedSQL = ref('');
const saveStatus = ref('');

// Drag state
const draggingTableId = ref<string | null>(null);
const dragTableStart = ref({ x: 0, y: 0, tableX: 0, tableY: 0 });
const draggingColumn = ref<{ table: Table; column: Column } | null>(null);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragCurrentX = ref(0);
const dragCurrentY = ref(0);

// Forms
const tableForm = reactive({
  id: '',
  name: '',
  columns: [] as Column[]
});

const relForm = reactive({
  id: '',
  sourceTableId: '',
  sourceColumnId: '',
  targetTableId: '',
  targetColumnId: '',
  sourceMultiplicity: '1',
  targetMultiplicity: '1'
});

const expandedColumns = ref<Set<string>>(new Set());

// Helpers
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function getTableById(id: string) {
  return tables.value.find(t => t.id === id);
}

function getTableName(tableId: string) {
  return getTableById(tableId)?.name || '';
}

function getTableColumns(tableId: string) {
  return getTableById(tableId)?.columns || [];
}

// Table operations
function addTable() {
  const newTable: Table = {
    id: uid(),
    name: 'new_table',
    x: 100 + tables.value.length * 50,
    y: 100 + tables.value.length * 30,
    columns: [
      { id: uid(), name: 'id', dataType: 'UUID', isPrimaryKey: true, isForeignKey: false, isNullable: false },
      { id: uid(), name: 'created_at', dataType: 'TIMESTAMP', isPrimaryKey: false, isForeignKey: false, isNullable: false },
      { id: uid(), name: 'updated_at', dataType: 'TIMESTAMP', isPrimaryKey: false, isForeignKey: false, isNullable: false }
    ]
  };
  tables.value.push(newTable);
  selectTable(newTable);
}

function selectTable(table: Table) {
  selectedItem.value = { type: 'table', id: table.id };
  tableForm.id = table.id;
  tableForm.name = table.name;
  tableForm.columns = [...table.columns];
}

function updateTable() {
  const table = getTableById(tableForm.id);
  if (table) {
    table.name = tableForm.name;
    table.columns = [...tableForm.columns];
  }
}

function deleteTable(tableId: string) {
  tables.value = tables.value.filter(t => t.id !== tableId);
  relationships.value = relationships.value.filter(r => r.sourceTableId !== tableId && r.targetTableId !== tableId);
  if (selectedItem.value?.type === 'table' && selectedItem.value.id === tableId) {
    selectedItem.value = null;
  }
}

// Column operations
function addColumn() {
  const newCol: Column = {
    id: uid(),
    name: 'new_column',
    dataType: 'VARCHAR(255)',
    isPrimaryKey: false,
    isForeignKey: false,
    isNullable: true
  };
  tableForm.columns.push(newCol);
  expandedColumns.value.add(newCol.id);
  updateTable();
}

function deleteColumn(colId: string) {
  tableForm.columns = tableForm.columns.filter(c => c.id !== colId);
  expandedColumns.value.delete(colId);
  // Remove any relationships involving this column
  relationships.value = relationships.value.filter(r => r.sourceColumnId !== colId && r.targetColumnId !== colId);
  updateTable();
}

function toggleColumnExpand(colId: string) {
  if (expandedColumns.value.has(colId)) {
    expandedColumns.value.delete(colId);
  } else {
    expandedColumns.value.add(colId);
  }
}

function selectColumn(table: Table, col: Column) {
  selectedItem.value = { type: 'column', id: col.id, tableId: table.id };
}

// Relationship operations
function selectRelationship(rel: Relationship) {
  selectedItem.value = { type: 'relationship', id: rel.id };
  relForm.id = rel.id;
  relForm.sourceTableId = rel.sourceTableId;
  relForm.sourceColumnId = rel.sourceColumnId;
  relForm.targetTableId = rel.targetTableId;
  relForm.targetColumnId = rel.targetColumnId;
  relForm.sourceMultiplicity = rel.sourceMultiplicity;
  relForm.targetMultiplicity = rel.targetMultiplicity;
}

function updateRelationship() {
  const rel = relationships.value.find(r => r.id === relForm.id);
  if (rel) {
    rel.sourceColumnId = relForm.sourceColumnId;
    rel.targetColumnId = relForm.targetColumnId;
    rel.sourceMultiplicity = relForm.sourceMultiplicity;
    rel.targetMultiplicity = relForm.targetMultiplicity;
  }
}

function deleteRelationship() {
  relationships.value = relationships.value.filter(r => r.id !== relForm.id);
  selectedItem.value = null;
}

// Canvas interactions
function onCanvasClick() {
  selectedItem.value = null;
}

function startDragTable(e: MouseEvent, table: Table) {
  draggingTableId.value = table.id;
  dragTableStart.value = {
    x: e.clientX,
    y: e.clientY,
    tableX: table.x,
    tableY: table.y
  };

  document.addEventListener('mousemove', onDragTable);
  document.addEventListener('mouseup', stopDragTable);
}

function onDragTable(e: MouseEvent) {
  if (!draggingTableId.value) return;
  const table = getTableById(draggingTableId.value);
  if (!table) return;

  const dx = e.clientX - dragTableStart.value.x;
  const dy = e.clientY - dragTableStart.value.y;

  table.x = dragTableStart.value.tableX + dx;
  table.y = dragTableStart.value.tableY + dy;
}

function stopDragTable() {
  draggingTableId.value = null;
  document.removeEventListener('mousemove', onDragTable);
  document.removeEventListener('mouseup', stopDragTable);
}

// Column drag for relationships
function startDragColumn(e: DragEvent, table: Table, col: Column) {
  if (!col.isPrimaryKey) {
    e.preventDefault();
    return;
  }
  draggingColumn.value = { table, column: col };
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  dragStartX.value = rect.left + rect.width / 2;
  dragStartY.value = rect.top + rect.height / 2;
  dragCurrentX.value = dragStartX.value;
  dragCurrentY.value = dragStartY.value;

  document.addEventListener('drag', onDragColumn);
}

function onDragColumn(e: DragEvent) {
  if (e.clientX && e.clientY) {
    dragCurrentX.value = e.clientX;
    dragCurrentY.value = e.clientY;
  }
}

function isValidDropTarget(table: Table): boolean {
  if (!draggingColumn.value) return false;
  if (draggingColumn.value.table.id === table.id) return false;
  return true;
}

function onDragOver(e: DragEvent, table: Table) {
  // Visual feedback handled by CSS
}

function onDropColumn(e: DragEvent, targetTable: Table) {
  e.preventDefault();
  if (!draggingColumn.value) return;

  const sourceTable = draggingColumn.value.table;
  const sourceCol = draggingColumn.value.column;

  // Create relationship
  const newRel: Relationship = {
    id: uid(),
    sourceTableId: sourceTable.id,
    sourceColumnId: sourceCol.id,
    targetTableId: targetTable.id,
    targetColumnId: '', // User must select target column
    sourceMultiplicity: '1',
    targetMultiplicity: '1..*'
  };

  relationships.value.push(newRel);
  selectRelationship(newRel);

  // Clean up
  draggingColumn.value = null;
  document.removeEventListener('drag', onDragColumn);
}

// SVG path calculations
function getRelationshipPath(rel: Relationship): string {
  const sourceTable = getTableById(rel.sourceTableId);
  const targetTable = getTableById(rel.targetTableId);
  if (!sourceTable || !targetTable) return '';

  const sx = sourceTable.x + 200; // Right side of table
  const sy = sourceTable.y + 40;   // Middle height
  const tx = targetTable.x;        // Left side of target
  const ty = targetTable.y + 40;  // Middle height

  // Simple curved path
  const midX = (sx + tx) / 2;
  return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
}

function getMultiplicityPosition(rel: Relationship, end: 'source' | 'target'): { x: number; y: number } {
  const sourceTable = getTableById(rel.sourceTableId);
  const targetTable = getTableById(rel.targetTableId);
  if (!sourceTable || !targetTable) return { x: 0, y: 0 };

  if (end === 'source') {
    return { x: sourceTable.x + 200, y: sourceTable.y + 35 };
  } else {
    return { x: targetTable.x, y: targetTable.y + 35 };
  }
}

// AI Generation
async function generateWithAI() {
  if (!aiPrompt.value.trim() || aiLoading.value) return;

  aiLoading.value = true;
  aiGeneratedSQL.value = '';

  try {
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const res = await fetch(`${bffBase}/ai/sql-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        prompt: aiPrompt.value,
        provider: llmPrefs.provider,
        apiKey: llmPrefs.currentApiKey,
        model: llmPrefs.model
      })
    });

    if (res.ok) {
      const data = await res.json();
      aiGeneratedSQL.value = data.sql || data.content || 'No SQL generated';
    } else {
      aiGeneratedSQL.value = 'Error generating SQL';
    }
  } catch (e) {
    aiGeneratedSQL.value = 'Error: ' + (e as Error).message;
  } finally {
    aiLoading.value = false;
  }
}

function copyGeneratedSQL() {
  navigator.clipboard.writeText(aiGeneratedSQL.value);
}

function applyGeneratedSchema() {
  // Parse generated SQL and create tables
  // This is a simplified parser - in production you'd want a proper SQL parser
  try {
    const tableMatches = aiGeneratedSQL.value.matchAll(/CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi);
    let baseX = 100;
    let baseY = 100;

    for (const match of tableMatches) {
      const tableName = match[1];
      const columnsStr = match[2];

      // Parse columns
      const columnLines = columnsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      const columns: Column[] = [];

      for (const line of columnLines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const colName = parts[0].replace(/['"`]/g, '');
          const dataType = parts[1].toUpperCase();
          const isPK = line.toLowerCase().includes('primary key');

          if (!['CONSTRAINT', 'FOREIGN', 'INDEX', 'UNIQUE', 'CHECK'].some(k => line.includes(k))) {
            columns.push({
              id: uid(),
              name: colName,
              dataType,
              isPrimaryKey: isPK,
              isForeignKey: line.toLowerCase().includes('references'),
              isNullable: !line.toLowerCase().includes('not null')
            });
          }
        }
      }

      if (columns.length > 0) {
        tables.value.push({
          id: uid(),
          name: tableName,
          x: baseX,
          y: baseY,
          columns
        });
        baseX += 250;
        if (baseX > 1000) {
          baseX = 100;
          baseY += 200;
        }
      }
    }

    showAIPanel.value = false;
    aiPrompt.value = '';
    aiGeneratedSQL.value = '';
  } catch (e) {
    console.error('Error parsing SQL:', e);
  }
}

// Save Design
async function saveDesign() {
  saveStatus.value = 'saving';

  try {
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const design = {
      domainId: domainId.value,
      tables: tables.value,
      relationships: relationships.value
    };

    await fetch(`${bffBase}/domains/${domainId.value}/er-model`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(design)
    });

    saveStatus.value = 'saved';
    setTimeout(() => { saveStatus.value = ''; }, 2000);
  } catch (e) {
    console.error('Error saving design:', e);
    saveStatus.value = '';
  }
}

// Load
onMounted(async () => {
  const domain = await domainsStore.fetchDomain(domainId.value);
  if (domain) {
    domainTitle.value = domain.title || domain.name;
  }

  // Try to load existing design
  try {
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${bffBase}/domains/${domainId.value}/er-model`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.tables) tables.value = data.tables;
      if (data.relationships) relationships.value = data.relationships;
    }
  } catch (e) {
    console.log('No existing design found');
  }
});
</script>

<style scoped>
.er-modeler {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f4f3f8;
  font-family: 'Inter', sans-serif;
}

/* Toolbar */
.er-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e3e2e7;
  height: 52px;
  flex-shrink: 0;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  background: #f4f3f8;
  color: #414755;
}

.toolbar-btn:hover {
  background: #e3e2e7;
}

.toolbar-btn--secondary {
  background: #f4f3f8;
  color: #1a1b1f;
}

.toolbar-btn--ai {
  background: linear-gradient(135deg, #7c3aed 0%, #0058bc 100%);
  color: #ffffff;
}

.toolbar-btn--ai:hover {
  opacity: 0.9;
}

.toolbar-btn--save {
  background: #0058bc;
  color: #ffffff;
}

.toolbar-btn--save:hover {
  background: #004494;
}

.toolbar-divider {
  color: #e3e2e7;
}

.toolbar-separator {
  width: 1px;
  height: 24px;
  background: #e3e2e7;
  margin: 0 4px;
}

.save-status {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
}

.save-status.saving {
  color: #a0a7b5;
  background: #f4f3f8;
}

.save-status.saved {
  color: #047857;
  background: #dcfce7;
}

/* Main Area */
.er-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Canvas */
.er-canvas {
  flex: 1;
  position: relative;
  overflow: auto;
  background: #ffffff;
}

.er-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.er-drag-line {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

/* Table */
.er-table {
  position: absolute;
  width: 200px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #e3e2e7;
  cursor: move;
  user-select: none;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.er-table--selected {
  border-color: #0058bc;
  box-shadow: 0 4px 12px rgba(0, 88, 188, 0.2);
}

.er-table--dragging {
  opacity: 0.8;
  cursor: grabbing;
}

.er-table__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #0058bc;
  border-radius: 6px 6px 0 0;
  color: #ffffff;
}

.er-table__icon {
  display: flex;
  align-items: center;
}

.er-table__name {
  flex: 1;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.er-table__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
}

.er-table__close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.er-table__columns {
  padding: 4px 0;
}

.er-table__drop-zone {
  padding: 6px;
  text-align: center;
  border-top: 1px dashed #e3e2e7;
  display: none;
}

.er-table__drop-zone--active {
  display: block;
  background: #eff6ff;
  border-color: #0058bc;
}

/* Column */
.er-column {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  transition: background 0.1s;
}

.er-column:hover {
  background: #f4f3f8;
}

.er-column--selected {
  background: #eff6ff;
}

.er-column__key {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 3px;
  background: #f59e0b;
  color: #ffffff;
  min-width: 20px;
  text-align: center;
}

.er-column__key--fk {
  background: #8b5cf6;
}

.er-column__key--none {
  background: transparent;
  color: transparent;
}

.er-column__name {
  flex: 1;
  font-size: 12px;
  color: #1a1b1f;
}

.er-column__type {
  font-size: 10px;
  color: #717786;
  font-family: 'Consolas', monospace;
}

/* Relationship lines */
.relationship-line {
  cursor: pointer;
  transition: stroke 0.2s;
}

.relationship-line:hover {
  stroke-width: 3;
}

.multiplicity-label {
  font-size: 12px;
  font-weight: 700;
  fill: #0058bc;
  cursor: pointer;
}

.multiplicity-label:hover {
  fill: #dc2626;
}

/* AI Panel */
.ai-panel {
  width: 320px;
  background: #ffffff;
  border-left: 1px solid #e3e2e7;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.ai-panel__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e3e2e7;
  background: linear-gradient(135deg, #7c3aed 0%, #0058bc 100%);
  color: #ffffff;
}

.ai-panel__close {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  border-radius: 6px;
}

.ai-panel__close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.ai-panel__content {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.ai-panel__textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e3e2e7;
  border-radius: 8px;
  font-size: 13px;
  resize: none;
  font-family: 'Inter', sans-serif;
  margin-bottom: 12px;
}

.ai-panel__textarea:focus {
  outline: none;
  border-color: #0058bc;
}

.ai-panel__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.ai-panel__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-panel__btn--generate {
  background: linear-gradient(135deg, #7c3aed 0%, #0058bc 100%);
  color: #ffffff;
}

.ai-panel__btn--apply {
  background: #059669;
  color: #ffffff;
  margin-top: 12px;
}

.ai-panel__preview {
  margin-top: 16px;
  border: 1px solid #e3e2e7;
  border-radius: 8px;
  overflow: hidden;
}

.ai-panel__preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f4f3f8;
  border-bottom: 1px solid #e3e2e7;
}

.ai-panel__copy {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #717786;
  cursor: pointer;
  border-radius: 4px;
}

.ai-panel__copy:hover {
  background: #e3e2e7;
  color: #1a1b1f;
}

.ai-panel__code {
  padding: 12px;
  font-size: 11px;
  font-family: 'Consolas', monospace;
  background: #1e293b;
  color: #e2e8f0;
  overflow-x: auto;
  white-space: pre;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

/* Properties Panel */
.properties-panel {
  width: 320px;
  background: #ffffff;
  border-left: 1px solid #e3e2e7;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e3e2e7;
  background: #f4f3f8;
}

.panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #717786;
  cursor: pointer;
  border-radius: 6px;
}

.panel-close:hover {
  background: #e3e2e7;
  color: #1a1b1f;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.panel-section {
  margin-bottom: 16px;
}

.panel-section--grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.panel-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #717786;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.panel-input, .panel-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e3e2e7;
  border-radius: 6px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  background: #ffffff;
  box-sizing: border-box;
}

.panel-input:focus, .panel-select:focus {
  outline: none;
  border-color: #0058bc;
}

.panel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.panel-btn--add {
  background: #eff6ff;
  color: #0058bc;
  margin-bottom: 12px;
}

.panel-btn--add:hover {
  background: #dbeafe;
}

.panel-btn--danger {
  background: #fee2e2;
  color: #991b1b;
}

.panel-btn--danger:hover {
  background: #fecaca;
}

/* Columns List */
.columns-list {
  border: 1px solid #e3e2e7;
  border-radius: 8px;
  overflow: hidden;
}

.column-item {
  border-bottom: 1px solid #e3e2e7;
}

.column-item:last-child {
  border-bottom: none;
}

.column-item__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  cursor: pointer;
  background: #ffffff;
  transition: background 0.1s;
}

.column-item__header:hover {
  background: #f4f3f8;
}

.column-item__pk {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 3px;
  background: #f59e0b;
  color: #ffffff;
}

.column-item__pk--active {
  background: #f59e0b;
}

.column-item__name {
  flex: 1;
  font-size: 12px;
  color: #1a1b1f;
}

.column-item__type {
  font-size: 10px;
  color: #717786;
  font-family: 'Consolas', monospace;
}

.column-item__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.1s;
}

.column-item__header:hover .column-item__delete {
  opacity: 1;
}

.column-item__form {
  padding: 10px;
  background: #faf9fe;
  border-top: 1px solid #e3e2e7;
}

.panel-field {
  margin-bottom: 10px;
}

.panel-field--row {
  display: flex;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #414755;
  cursor: pointer;
}

/* Relationship Info */
.relationship-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f4f3f8;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.relationship-info__arrow {
  color: #0058bc;
  font-size: 16px;
}
</style>
