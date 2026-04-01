<template>
  <div class="protocol-node" :class="{ 'protocol-node--selected': selected }">
    <!-- Target handles -->
    <Handle id="top"    type="target" :position="Position.Top"    class="proto-handle" />
    <Handle id="left"   type="target" :position="Position.Left"   class="proto-handle" />
    <!-- Source handles -->
    <Handle id="bottom" type="source" :position="Position.Bottom" class="proto-handle" />
    <Handle id="right"  type="source" :position="Position.Right"  class="proto-handle" />

    <!-- Blue header band -->
    <div class="proto-header">
      <span class="material-symbols-outlined proto-header__icon">
        {{ nodeType?.icon ?? 'hub' }}
      </span>
      <span class="proto-header__label">Protocol</span>
    </div>

    <!-- Body -->
    <div class="proto-body">
      <p class="proto-name">{{ data.label }}</p>
      <div class="proto-meta">
        <span class="proto-badge">{{ data.typeId }}</span>
        <span class="proto-status" :class="data.configured ? 'proto-status--ok' : 'proto-status--warn'"
          :title="data.configured ? 'Configured' : 'Not configured'">
          <span class="material-symbols-outlined" style="font-size:13px;">
            {{ data.configured ? 'check_circle' : 'radio_button_unchecked' }}
          </span>
        </span>
      </div>
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
    configured: boolean;
  };
  selected: boolean;
}>();

const nodeType = computed(() => findNodeType(props.data.typeId));
</script>

<style scoped>
.protocol-node {
  width: 200px;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  border: 2px solid #e3e2e7;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  user-select: none;
  font-family: 'Inter', sans-serif;
}

.protocol-node--selected {
  border-color: #0058bc;
  box-shadow: 0 0 0 3px rgba(0,88,188,0.18), 0 2px 10px rgba(0,0,0,0.08);
}

/* Header */
.proto-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #0058bc;
}

.proto-header__icon {
  font-size: 20px;
  color: #ffffff;
  font-variation-settings: 'FILL' 1;
}

.proto-header__label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.75);
}

/* Body */
.proto-body {
  padding: 8px 12px 10px;
}

.proto-name {
  font-size: 13px;
  font-weight: 700;
  color: #1a1b1f;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.proto-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.proto-badge {
  font-size: 10px;
  font-weight: 600;
  color: #0058bc;
  background: #eff6ff;
  padding: 1px 6px;
  border-radius: 6px;
  font-family: 'Inter', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
}

.proto-status {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.proto-status--ok  { color: #15803d; }
.proto-status--warn { color: #c05600; }

/* Handles */
:deep(.proto-handle),
:deep(.vue-flow__handle) {
  width: 10px !important;
  height: 10px !important;
  background: #0058bc !important;
  border: 2px solid #ffffff !important;
  border-radius: 50% !important;
  z-index: 10;
}
</style>
