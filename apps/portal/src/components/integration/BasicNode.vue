<template>
  <div class="basic-node" :class="{ 'basic-node--selected': selected, 'basic-node--typed': !!data.nodeTypeId }">

    <!-- Handles — center of each side, both source and target -->
    <Handle id="top-s"    type="source" :position="Position.Top"    class="basic-handle" />
    <Handle id="top-t"    type="target" :position="Position.Top"    class="basic-handle" />
    <Handle id="right-s"  type="source" :position="Position.Right"  class="basic-handle" />
    <Handle id="right-t"  type="target" :position="Position.Right"  class="basic-handle" />
    <Handle id="bottom-s" type="source" :position="Position.Bottom" class="basic-handle" />
    <Handle id="bottom-t" type="target" :position="Position.Bottom" class="basic-handle" />
    <Handle id="left-s"   type="source" :position="Position.Left"   class="basic-handle" />
    <Handle id="left-t"   type="target" :position="Position.Left"   class="basic-handle" />

    <!-- Node body -->
    <div v-if="data.nodeTypeId" class="basic-body">
      <div class="basic-icon">
        <span class="material-symbols-outlined" style="font-size:18px;color:#0058bc;font-variation-settings:'FILL' 1;">
          widgets
        </span>
      </div>
      <div class="basic-info">
        <p class="basic-name">{{ data.label || data.nodeTypeId }}</p>
        <p class="basic-type">{{ data.nodeTypeId }}</p>
      </div>
      <span class="basic-status"
        :style="{ color: data.configured ? '#15803d' : '#c05600' }"
        :title="data.configured ? 'All required properties set' : 'Missing required properties'">
        <span class="material-symbols-outlined" style="font-size:13px;">
          {{ data.configured ? 'check_circle' : 'radio_button_unchecked' }}
        </span>
      </span>
    </div>

    <div v-else class="basic-empty">
      <span class="material-symbols-outlined" style="font-size:20px;color:#c7c6d1;">widgets</span>
      <p class="basic-empty__label">Select type…</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

defineProps<{
  id: string;
  data: {
    nodeTypeId: string | null;
    label: string;
    props: Record<string, unknown>;
    configured: boolean;
  };
  selected: boolean;
}>();
</script>

<style scoped>
.basic-node {
  width: 170px;
  background: #ffffff;
  border: 2px solid #e3e2e7;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: 'Inter', sans-serif;
  user-select: none;
}

.basic-node--selected {
  border-color: #0058bc;
  box-shadow: 0 0 0 3px rgba(0, 88, 188, 0.18), 0 2px 8px rgba(0, 0, 0, 0.07);
}

.basic-node--typed {
  border-color: #c7c6d1;
}

.basic-node--typed.basic-node--selected {
  border-color: #0058bc;
}

/* Typed body */
.basic-body {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
}

.basic-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.basic-info {
  flex: 1;
  min-width: 0;
}

.basic-name {
  font-size: 12px;
  font-weight: 700;
  color: #1a1b1f;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.basic-type {
  font-size: 9px;
  font-weight: 600;
  color: #a0a7b5;
  margin: 2px 0 0;
  font-family: 'Inter', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.basic-status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Untyped placeholder */
.basic-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px 12px;
  gap: 4px;
}

.basic-empty__label {
  font-size: 11px;
  color: #a0a7b5;
  font-style: italic;
  margin: 0;
}

/* Handles — offset source/target pairs so they don't fully overlap */
:deep(.basic-handle) {
  width: 10px !important;
  height: 10px !important;
  background: #0058bc !important;
  border: 2px solid #ffffff !important;
  border-radius: 50% !important;
  z-index: 10;
}
</style>
