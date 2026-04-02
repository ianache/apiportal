<template>
  <div
    class="sf-node"
    :class="{ 'sf-node--selected': selected }"
    :style="{
      borderColor: typeColor,
      background: hexToRgba(typeColor, 0.04),
      boxShadow: selected
        ? `0 0 0 3px ${hexToRgba(typeColor, 0.18)}, 0 2px 12px rgba(0,0,0,0.08)`
        : '0 2px 12px rgba(0,0,0,0.08)',
    }"
  >
    <!-- Handles (ConnectionMode.Loose — one source handle per side) -->
    <Handle id="top"    type="source" :position="Position.Top"    class="sf-handle" :style="{ background: typeColor }" />
    <Handle id="right"  type="source" :position="Position.Right"  class="sf-handle" :style="{ background: typeColor }" />
    <Handle id="bottom" type="source" :position="Position.Bottom" class="sf-handle" :style="{ background: typeColor }" />
    <Handle id="left"   type="source" :position="Position.Left"   class="sf-handle" :style="{ background: typeColor }" />

    <!-- Header -->
    <div class="sf-header" :style="{ background: hexToRgba(typeColor, 0.1), borderBottomColor: hexToRgba(typeColor, 0.25) }">
      <span class="material-symbols-outlined sf-header__icon" :style="{ color: typeColor }">{{ typeIcon }}</span>
      <div class="sf-header__text">
        <p class="sf-header__name">{{ data.label }}</p>
        <span class="sf-header__badge" :style="{ color: typeColor, background: hexToRgba(typeColor, 0.15) }">
          {{ data.flowType }}
        </span>
      </div>
      <span class="sf-header__count" :style="{ color: typeColor }">
        {{ data.collapsedNodes?.length ?? 0 }} nodes
      </span>
    </div>

    <!-- Description -->
    <p v-if="data.description" class="sf-desc">{{ data.description }}</p>

    <!-- Collapsed node list — nodrag prevents Vue Flow from dragging the whole node -->
    <div
      v-if="data.collapsedNodes?.length"
      class="sf-chips nodrag"
      @dragover.prevent
    >
      <div
        v-for="(n, i) in data.collapsedNodes"
        :key="n.id"
        class="sf-chip"
        :class="{
          'sf-chip--dragging': dragIndex === i,
          'sf-chip--over-above': overIndex === i && dragIndex !== null && dragIndex > i,
          'sf-chip--over-below': overIndex === i && dragIndex !== null && dragIndex < i,
        }"
        draggable="true"
        @click.stop="onChipSelect(id, i)"
        @dragstart.stop="onChipDragStart(i, $event)"
        @dragover.stop.prevent="onChipDragOver(i)"
        @dragleave.stop="overIndex = null"
        @drop.stop.prevent="onChipDrop(i)"
        @dragend.stop="onChipDragEnd"
      >
        <!-- Drag handle -->
        <span
          class="sf-chip__drag material-symbols-outlined"
          title="Drag to reorder"
        >drag_indicator</span>

        <!-- Label -->
        <span class="sf-chip__label">{{ n.label || n.typeId }}</span>

        <!-- Remove button -->
        <button class="sf-chip__remove" title="Remove node" @click.stop="removeNode(i)">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>

    <div v-else-if="!data.collapsedNodes?.length" class="sf-empty">
      <span class="material-symbols-outlined" style="font-size:20px;color:#c7c6d1;">layers</span>
      <span>No nodes</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { Handle, Position, useVueFlow } from '@vue-flow/core';

const props = defineProps<{
  id: string;
  data: {
    label: string;
    description?: string;
    flowType: 'inflow' | 'outflow' | 'exception';
    color: string;
    collapsedNodes?: { id: string; typeId: string; label: string }[];
  };
  selected: boolean;
}>();

const { updateNode } = useVueFlow();

// Injected by IntegrationDesigner to open collapsed-node properties panel
const onChipSelect = inject<(subflowId: string, index: number) => void>('subflowChipClick', () => {});

// ── Type config ───────────────────────────────────────────
const TYPE_CONFIG = {
  inflow:    { color: '#0058bc', icon: 'input'  },
  outflow:   { color: '#047857', icon: 'output' },
  exception: { color: '#991b1b', icon: 'report' },
} as const;

const typeColor = computed(() => TYPE_CONFIG[props.data.flowType]?.color ?? props.data.color ?? '#414755');
const typeIcon  = computed(() => TYPE_CONFIG[props.data.flowType]?.icon  ?? 'layers');

// ── Drag-to-reorder state ─────────────────────────────────
const dragIndex = ref<number | null>(null);
const overIndex = ref<number | null>(null);

function onChipDragStart(i: number, e: DragEvent) {
  dragIndex.value = i;
  overIndex.value = null;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    // Required by Firefox to initiate drag
    e.dataTransfer.setData('text/plain', String(i));
  }
}

function onChipDragOver(i: number) {
  if (dragIndex.value === null || dragIndex.value === i) return;
  overIndex.value = i;
}

function onChipDrop(i: number) {
  const from = dragIndex.value;
  if (from === null || from === i) { onChipDragEnd(); return; }

  const list = [...(props.data.collapsedNodes ?? [])];
  const [moved] = list.splice(from, 1);
  list.splice(i, 0, moved);

  updateNode(props.id, { data: { ...props.data, collapsedNodes: list } });
  onChipDragEnd();
}

function onChipDragEnd() {
  dragIndex.value = null;
  overIndex.value = null;
}

// ── Remove node ───────────────────────────────────────────
function removeNode(i: number) {
  const list = (props.data.collapsedNodes ?? []).filter((_, idx) => idx !== i);
  updateNode(props.id, { data: { ...props.data, collapsedNodes: list } });
}

// ── Helpers ───────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)},${alpha})`;
}
</script>

<style scoped>
.sf-node {
  min-width: 240px;
  max-width: 340px;
  border: 2px dashed;
  border-radius: 16px;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
  cursor: pointer;
}
.sf-node--selected { border-style: solid; }

/* Header */
.sf-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid;
}
.sf-header__icon {
  font-size: 18px;
  font-variation-settings: 'FILL' 1;
  flex-shrink: 0;
}
.sf-header__text { flex: 1; min-width: 0; }
.sf-header__name {
  font-size: 12px;
  font-weight: 700;
  color: #1a1b1f;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sf-header__badge {
  display: inline-block;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 1px 6px;
  border-radius: 4px;
  margin-top: 2px;
}
.sf-header__count {
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

/* Description */
.sf-desc {
  font-size: 11px;
  color: #717786;
  margin: 0;
  padding: 8px 12px 4px;
  line-height: 1.4;
}

/* Chips list */
.sf-chips {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
}

.sf-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  border-radius: 7px;
  background: rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.07);
  transition: background 0.1s, border-color 0.1s, opacity 0.1s;
  cursor: default;
}
.sf-chip:hover { background: rgba(0,0,0,0.06); }

.sf-chip--dragging {
  opacity: 0.4;
}
.sf-chip--over-above {
  border-top: 2px solid #0058bc;
}
.sf-chip--over-below {
  border-bottom: 2px solid #0058bc;
}

/* Drag handle */
.sf-chip__drag {
  font-size: 14px;
  color: #c7c6d1;
  cursor: grab;
  flex-shrink: 0;
  user-select: none;
}
.sf-chip__drag:hover { color: #a0a7b5; }
.sf-chip__drag:active { cursor: grabbing; }

/* Label */
.sf-chip__label {
  flex: 1;
  font-size: 10px;
  font-weight: 600;
  color: #414755;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Remove button */
.sf-chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  color: #a0a7b5;
  flex-shrink: 0;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}
.sf-chip__remove:hover {
  background: #fee2e2;
  color: #991b1b;
}
.sf-chip__remove .material-symbols-outlined { font-size: 12px; }

/* Empty state */
.sf-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 12px;
  font-size: 10px;
  color: #a0a7b5;
  font-family: 'Inter', sans-serif;
}

/* Handles */
:deep(.sf-handle),
:deep(.vue-flow__handle) {
  width: 10px !important;
  height: 10px !important;
  border: 2px solid #ffffff !important;
  border-radius: 50% !important;
  z-index: 10;
}
</style>
