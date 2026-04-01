<template>
  <div class="subflow-node" :class="{ 'subflow-node--selected': selected }"
    :style="{
      borderColor: data.color,
      background: hexToRgba(data.color, 0.05),
    }">

    <!-- Target handle (left) -->
    <Handle id="left"  type="target" :position="Position.Left"  class="lane-handle" :style="{ background: data.color }" />
    <!-- Source handle (right) -->
    <Handle id="right" type="source" :position="Position.Right" class="lane-handle" :style="{ background: data.color }" />

    <!-- Lane label -->
    <div class="subflow-label" :style="{ color: data.color }">
      <span class="material-symbols-outlined subflow-label__icon" :style="{ color: data.color }">layers</span>
      {{ data.label }}
    </div>

    <!-- Drop zone placeholder -->
    <div v-if="data.isEmpty !== false" class="subflow-placeholder">
      <span class="material-symbols-outlined" style="font-size:28px;color:#c7c6d1;">add_circle_outline</span>
      <p style="font-size:11px;color:#a0a7b5;margin:4px 0 0;font-family:'Inter',sans-serif;">Drop nodes here</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

const props = defineProps<{
  id: string;
  data: {
    label: string;
    color: string;
    isEmpty?: boolean;
  };
  selected: boolean;
}>();

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
}
</script>

<style scoped>
.subflow-node {
  width: 400px;
  height: 300px;
  border: 2px dashed;
  border-radius: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

.subflow-node--selected {
  box-shadow: 0 0 0 3px rgba(0,0,0,0.08);
}

.subflow-label {
  position: absolute;
  top: 12px;
  left: 16px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 5px;
}

.subflow-label__icon {
  font-size: 14px;
  font-variation-settings: 'FILL' 1;
}

.subflow-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  margin-top: 16px;
}

/* Handles */
:deep(.lane-handle),
:deep(.vue-flow__handle) {
  width: 12px !important;
  height: 12px !important;
  border: 2px solid #ffffff !important;
  border-radius: 50% !important;
  z-index: 10;
}
</style>
