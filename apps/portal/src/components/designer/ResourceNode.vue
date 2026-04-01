<template>
  <div
    class="resource-node"
    :class="{ 'resource-node--selected': selected, 'resource-node--root': data.isRoot }"
  >
    <!-- Vue Flow connection handles (transparent — used for dropped connections) -->
    <Handle id="top"    type="source" :position="Position.Top"    :connectable="true" class="vf-handle" />
    <Handle id="right"  type="source" :position="Position.Right"  :connectable="true" class="vf-handle" />
    <Handle id="bottom" type="source" :position="Position.Bottom" :connectable="true" class="vf-handle" />
    <Handle id="left"   type="source" :position="Position.Left"   :connectable="true" class="vf-handle" />

    <!-- Node body -->
    <div class="node-body">
      <div class="node-icon-wrap">
        <span class="material-symbols-outlined" style="font-size: 18px; color: #ffffff;">
          {{ data.isRoot ? 'hub' : 'folder_open' }}
        </span>
      </div>
      <div class="node-content">
        <p class="node-path">{{ data.path || '/resource' }}</p>
        <div v-if="data.methods?.length" class="node-methods">
          <span
            v-for="m in data.methods"
            :key="m"
            class="method-badge"
            :class="`method-badge--${m.toLowerCase()}`"
          >{{ m }}</span>
        </div>
      </div>
    </div>

    <!-- Add-child buttons (one per border, centered) -->
    <button
      v-for="dir in directions"
      :key="dir"
      class="add-btn"
      :class="`add-btn--${dir}`"
      :title="`Add resource (${dir})`"
      @mousedown.stop
      @click.stop="addChildNode(dir)"
    >+</button>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow, MarkerType } from '@vue-flow/core';

interface ResourceData {
  path: string;
  methods: string[];
  description: string;
  isRoot?: boolean;
}

const props = defineProps<{
  id: string;
  data: ResourceData;
  selected: boolean;
}>();

const directions = ['top', 'right', 'bottom', 'left'] as const;
type Direction = typeof directions[number];

const { addNodes, addEdges, findNode } = useVueFlow();

const NODE_W = 192;
const NODE_H = 72;
const H_GAP  = 180;
const V_GAP  = 110;

const opposite: Record<Direction, Direction> = {
  top: 'bottom', right: 'left', bottom: 'top', left: 'right',
};

function addChildNode(dir: Direction) {
  const parent = findNode(props.id);
  if (!parent) return;

  const offsets: Record<Direction, { dx: number; dy: number }> = {
    top:    { dx: 0,              dy: -(NODE_H + V_GAP) },
    right:  { dx: NODE_W + H_GAP, dy: 0                 },
    bottom: { dx: 0,              dy:  NODE_H + V_GAP   },
    left:   { dx: -(NODE_W + H_GAP), dy: 0              },
  };

  const newId = `res-${Date.now()}`;
  const { dx, dy } = offsets[dir];

  addNodes([{
    id: newId,
    type: 'resource',
    position: { x: parent.position.x + dx, y: parent.position.y + dy },
    data: { path: '/new-resource', methods: ['GET'], description: '' },
  }]);

  addEdges([{
    id: `e-${props.id}-${dir}-${newId}`,
    source: props.id,
    target: newId,
    sourceHandle: dir,
    targetHandle: opposite[dir],
    type: 'smoothstep',
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#0058bc' },
    style: { stroke: '#0058bc', strokeWidth: 2 },
  }]);
}
</script>

<style scoped>
/* ── Node wrapper ──────────────────────────────────── */
.resource-node {
  position: relative;
  width: 192px;
  cursor: pointer;
  user-select: none;
}

/* ── Node body card ────────────────────────────────── */
.node-body {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #ffffff;
  border: 2px solid #e3e2e7;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  transition: border-color 0.15s, box-shadow 0.15s;
  min-height: 56px;
}

.resource-node--selected .node-body {
  border-color: #0058bc;
  box-shadow: 0 0 0 3px rgba(0,88,188,0.15), 0 2px 8px rgba(0,0,0,0.07);
}

.resource-node--root .node-body {
  background: #0058bc;
  border-color: #0058bc;
}

.resource-node--root .node-path {
  color: #ffffff !important;
  font-weight: 700;
}

/* ── Icon ──────────────────────────────────────────── */
.node-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
  background: #0058bc;
}

.resource-node--root .node-icon-wrap {
  background: rgba(255,255,255,0.2);
}

/* ── Content ───────────────────────────────────────── */
.node-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-path {
  font-size: 13px;
  font-weight: 600;
  color: #1a1b1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Inter', sans-serif;
}

.node-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.method-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-family: 'Inter', sans-serif;
}
.method-badge--get    { background: #dcfce7; color: #15803d; }
.method-badge--post   { background: #dbeafe; color: #1d4ed8; }
.method-badge--put    { background: #fef9c3; color: #854d0e; }
.method-badge--patch  { background: #fef3c7; color: #92400e; }
.method-badge--delete { background: #fee2e2; color: #991b1b; }

/* ── Vue Flow handles (transparent, for drag-connect) ─ */
:deep(.vf-handle),
:deep(.vue-flow__handle) {
  width: 10px !important;
  height: 10px !important;
  background: transparent !important;
  border: none !important;
  border-radius: 50% !important;
  z-index: 10;
}

/* ── Add-child "+" buttons ─────────────────────────── */
.add-btn {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #0058bc;
  color: #ffffff;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  cursor: pointer;
  transition: transform 0.12s, background 0.12s;
  z-index: 20;
  padding: 0;
  font-family: monospace;
}
.add-btn:hover {
  background: #004399;
  transform: scale(1.2);
}

.add-btn--top    { top: -9px;  left: 50%;  transform: translateX(-50%); }
.add-btn--top:hover { transform: translateX(-50%) scale(1.2); }

.add-btn--right  { right: -9px; top: 50%;  transform: translateY(-50%); }
.add-btn--right:hover { transform: translateY(-50%) scale(1.2); }

.add-btn--bottom { bottom: -9px; left: 50%; transform: translateX(-50%); }
.add-btn--bottom:hover { transform: translateX(-50%) scale(1.2); }

.add-btn--left   { left: -9px; top: 50%;  transform: translateY(-50%); }
.add-btn--left:hover { transform: translateY(-50%) scale(1.2); }
</style>
