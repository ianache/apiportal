<template>
  <div class="filter-node" :class="{ 'filter-node--selected': selected }"
    :style="selected ? { borderColor: nodeType?.color ?? '#e3e2e7', boxShadow: `0 0 0 3px ${hexToRgba(nodeType?.color ?? '#0058bc', 0.18)}` } : {}"
    draggable="true"
    @dragstart="onDragStart"
  >

    <!-- Handles: one per direction (connectionMode Loose allows any-to-any) -->
    <Handle id="top"    type="source" :position="Position.Top"    class="filter-handle" :style="{ background: nodeType?.color ?? '#a0a7b5' }" />
    <Handle id="right"  type="source" :position="Position.Right"  class="filter-handle" :style="{ background: nodeType?.color ?? '#a0a7b5' }" />
    <Handle id="bottom" type="source" :position="Position.Bottom" class="filter-handle" :style="{ background: nodeType?.color ?? '#a0a7b5' }" />
    <Handle id="left"   type="source" :position="Position.Left"   class="filter-handle" :style="{ background: nodeType?.color ?? '#a0a7b5' }" />

    <!-- Icon -->
    <div class="filter-icon" :style="{ background: nodeType?.color ?? '#a0a7b5' }">
      <span class="material-symbols-outlined" style="font-size:18px;color:#ffffff;font-variation-settings:'FILL' 1;">
        {{ nodeType?.icon ?? 'settings' }}
      </span>
    </div>

    <!-- Content -->
    <div class="filter-content">
      <p class="filter-name">{{ data.label }}</p>
      <p class="filter-typeid">{{ data.typeId }}</p>
    </div>

    <!-- Completion indicator -->
    <div class="filter-status" :title="completionStatus.title">
      <span class="material-symbols-outlined filter-status__dot"
        :style="{ color: completionStatus.color }">
        {{ completionStatus.icon }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { findNodeType } from '../../stores/nodeTypes';

const props = defineProps<{
  id: string;
  data: {
    typeId: string;
    label: string;
    props: Record<string, any>;
  };
  selected: boolean;
}>();

const nodeType = computed(() => findNodeType(props.data.typeId));

const completionStatus = computed(() => {
  if (!nodeType.value) return { icon: 'radio_button_unchecked', color: '#c7c6d1', title: 'Unknown type' };
  const required = nodeType.value.properties.filter(p => p.required);
  const allFilled = required.every(p => {
    const v = props.data.props?.[p.key];
    return v !== undefined && v !== null && v !== '';
  });
  return allFilled
    ? { icon: 'check_circle', color: '#15803d', title: 'All required properties set' }
    : { icon: 'radio_button_unchecked', color: '#c05600', title: 'Missing required properties' };
});

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
}

function onDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('nodeId', props.id);
    e.dataTransfer.setData('nodeTypeId', props.data.typeId);
  }
}
</script>

<style scoped>
.filter-node {
  width: 160px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px 10px 10px;
  border-radius: 12px;
  background: #ffffff;
  border: 2px solid #e3e2e7;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  user-select: none;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
  position: relative;
}

.filter-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-content {
  flex: 1;
  min-width: 0;
}

.filter-name {
  font-size: 12px;
  font-weight: 700;
  color: #1a1b1f;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-typeid {
  font-size: 9px;
  font-weight: 600;
  color: #a0a7b5;
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Inter', monospace;
}

.filter-status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.filter-status__dot {
  font-size: 14px;
}

/* Handles */
:deep(.filter-handle),
:deep(.vue-flow__handle) {
  width: 10px !important;
  height: 10px !important;
  border: 2px solid #ffffff !important;
  border-radius: 50% !important;
  z-index: 10;
}
</style>
