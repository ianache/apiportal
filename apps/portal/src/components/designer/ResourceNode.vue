<template>
  <div
    class="resource-node"
    :class="{
      'resource-node--selected': selected,
      'resource-node--root': data.isRoot,
      'resource-node--locked': data.isRoot,
      'resource-node--collapsed': data.collapsed
    }"
  >
    <!-- Left blue border extension (visual effect) -->
    <div class="blue-border-left"></div>

    <!-- Right blue border extension (visual effect) -->
    <div class="blue-border-right"></div>

    <!-- Vue Flow connection handles -->
    <template v-if="data.isRoot">
      <Handle id="right" type="source" :position="Position.Right" :connectable="true" class="vf-handle" />
    </template>
    <template v-else>
      <Handle id="left" type="target" :position="Position.Left" :connectable="true" class="vf-handle vf-handle--left" />
      <Handle id="right" type="source" :position="Position.Right" :connectable="true" class="vf-handle" />
    </template>
    <Handle id="top" type="target" :position="Position.Top" :connectable="true" class="vf-handle vf-handle--hidden" />
    <Handle id="bottom" type="source" :position="Position.Bottom" :connectable="true" class="vf-handle vf-handle--hidden" />

    <!-- White card body -->
    <div class="node-body">
      <!-- Icon -->
      <div class="node-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path v-if="data.isRoot" d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path v-else d="M22 19C22 20.1 21.1 21 20 21H4C2.9 21 2 20.1 2 19V5C2 3.9 2.9 3 4 3H9L11 5H20C21.1 5 22 5.9 22 7V19Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- Content -->
      <div class="node-content">
        <span class="node-path">{{ data.path || '/resource' }}</span>
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

    <!-- Collapse/Expand button - left of right connection handle -->
    <button
      v-if="data.hasChildren"
      class="control-btn control-btn--collapse"
      :class="{ 'control-btn--active': data.collapsed }"
      :title="data.collapsed ? 'Expand children' : 'Collapse children'"
      @mousedown.stop
      @click.stop="toggleCollapse"
    >
      <span>{{ data.collapsed ? '›' : '‹' }}</span>
    </button>

    <!-- Add child button -->
    <button
      type="button"
      class="control-btn control-btn--add"
      :class="{ 'control-btn--add-root': data.isRoot }"
      title="Add child resource"
      @mousedown.stop
      @click.stop="handleAddChild"
    >
      <span>+</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core';

interface ResourceData {
  path: string;
  methods: string[];
  description: string;
  isRoot?: boolean;
  hasChildren?: boolean;
  collapsed?: boolean;
  operationName?: string;
  security?: string;
}

const props = defineProps<{
  id: string;
  data: ResourceData;
  selected: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete-children', nodeId: string): void;
  (e: 'toggle-collapse', nodeId: string, collapsed: boolean): void;
  (e: 'node-reparent', nodeId: string, newParentId: string): void;
}>();

const directions = ['top', 'right', 'bottom', 'left'] as const;
type Direction = typeof directions[number];

const { addNodes, addEdges, findNode, removeNodes, removeEdges } = useVueFlow();

const NODE_W = 200;
const NODE_H = 72;
const H_GAP  = 180;
const V_GAP  = 110;

const opposite: Record<Direction, Direction> = {
  top: 'bottom', right: 'left', bottom: 'top', left: 'right',
};

function handleAddChild() {
  const parent = findNode(props.id);
  let position = { x: 0, y: 0 };
  if (parent) {
    position = { x: parent.position.x + NODE_W + H_GAP, y: parent.position.y };
  }
  window.dispatchEvent(new CustomEvent('add-child-node', {
    detail: {
      parentId: props.id,
      direction: 'right',
      position: position
    }
  }));
}

function addChildNode(dir: Direction) {
  const parent = findNode(props.id);
  let position = { x: 0, y: 0 };
  if (parent) {
    const offsets: Record<Direction, { dx: number; dy: number }> = {
      top:    { dx: 0,              dy: -(NODE_H + V_GAP) },
      right:  { dx: NODE_W + H_GAP, dy: 0                 },
      bottom: { dx: 0,              dy:  NODE_H + V_GAP   },
      left:   { dx: -(NODE_W + H_GAP), dy: 0              },
    };
    const { dx, dy } = offsets[dir];
    position = { x: parent.position.x + dx, y: parent.position.y + dy };
  }

  window.dispatchEvent(new CustomEvent('add-child-node', {
    detail: {
      parentId: props.id,
      direction: dir,
      position: position
    }
  }));
}

function removeAllChildren() {
  window.dispatchEvent(new CustomEvent('delete-node-children', { detail: { nodeId: props.id } }));
}

function toggleCollapse() {
  const newCollapsed = !props.data.collapsed;
  window.dispatchEvent(new CustomEvent('toggle-node-collapse', { detail: { nodeId: props.id, collapsed: newCollapsed } }));
}
</script>

<style scoped>
/* ── Node wrapper ──────────────────────────────────── */
.resource-node {
  position: relative;
  width: 200px;
  height: 72px;
  cursor: pointer;
  user-select: none;
}

/* ── Blue border extensions (left and right) ──────── */
.blue-border-left,
.blue-border-right {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 48px;
  background: #3b82f6;
  border-radius: 6px;
  z-index: 0;
}

.blue-border-left {
  left: -6px;
  border-radius: 6px 0 0 6px;
}

.blue-border-right {
  right: -6px;
  border-radius: 0 6px 6px 0;
}

/* ── White card body ──────────────────────────────── */
.node-body {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  padding: 0 20px 0 14px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -2px rgba(0, 0, 0, 0.1),
    0 0 0 3px #3b82f6;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.resource-node:hover .node-body {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.1),
    0 0 0 3px #3b82f6;
}

.resource-node--selected .node-body {
  box-shadow:
    0 0 0 4px rgba(59, 130, 246, 0.3),
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

.resource-node--root .node-body {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -2px rgba(0, 0, 0, 0.1),
    0 0 0 3px #2563eb;
}

/* ── Icon ──────────────────────────────────────────── */
.node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #3b82f6;
  border-radius: 8px;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.resource-node--root .node-icon {
  background: rgba(255, 255, 255, 0.2);
}

.resource-node:hover .node-icon {
  background: #2563eb;
}

.resource-node--root:hover .node-icon {
  background: rgba(255, 255, 255, 0.3);
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
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  letter-spacing: -0.01em;
}

.resource-node--root .node-path {
  color: #ffffff;
}

/* ── Method badges ─────────────────────────────────── */
.node-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.method-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.method-badge--get {
  background: #dcfce7;
  color: #166534;
}

.method-badge--post {
  background: #dbeafe;
  color: #1e40af;
}

.method-badge--put {
  background: #fef3c7;
  color: #92400e;
}

.method-badge--patch {
  background: #fef3c7;
  color: #78350f;
}

.method-badge--delete {
  background: #fee2e2;
  color: #991b1b;
}

/* ── Vue Flow handles ──────────────────────────────── */
:deep(.vf-handle),
:deep(.vue-flow__handle) {
  width: 12px !important;
  height: 12px !important;
  background: #ffffff !important;
  border: 2px solid #3b82f6 !important;
  border-radius: 50% !important;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

:deep(.vf-handle--left) {
  left: -6px !important;
}

:deep(.vue-flow__handle:hover),
:deep(.vf-handle:hover) {
  background: #3b82f6 !important;
  transform: scale(1.2);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
}

:deep(.vf-handle--hidden),
:deep(.vue-flow__handle--hidden) {
  display: none !important;
}

/* ── Control buttons ──────────────────────────────── */
.control-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 30;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  transition: all 0.15s ease;
}

.control-btn:hover {
  background: #3b82f6;
  color: #ffffff;
  box-shadow:
    0 4px 6px -1px rgba(59, 130, 246, 0.4),
    0 2px 4px -2px rgba(59, 130, 246, 0.3);
  transform: translateY(-50%) scale(1.1);
}

.control-btn:active {
  transform: translateY(-50%) scale(0.95);
}

/* Collapse button - positioned inside white card, left of right edge */
.control-btn--collapse {
  right: 28px;
  width: 22px;
  height: 22px;
  font-size: 14px;
}

.control-btn--collapse:hover {
  right: 28px;
}

/* Add button - positioned at right edge, embedded in blue border */
.control-btn--add {
  right: -5px;
  width: 26px;
  height: 26px;
  font-size: 18px;
  border: 2px solid #ffffff;
}

.control-btn--add-root {
  right: -5px;
  width: 26px;
  height: 26px;
  font-size: 18px;
  border: 2px solid #ffffff;
}

/* Active state for collapse (when children are collapsed) */
.control-btn--active {
  background: #3b82f6;
  color: #ffffff;
}

.control-btn--active:hover {
  background: #2563eb;
}

/* ── Collapsed state indicator ─────────────────────── */
.resource-node--collapsed .node-body {
  background: #f8fafc;
}
</style>
