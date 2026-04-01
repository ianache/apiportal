<template>
  <!-- Target handle — receives connection from the Protocol node -->
  <Handle id="in" type="target" :position="Position.Left" class="flow-handle flow-handle--in" />

  <div class="flow-node" :class="{ 'flow-node--selected': selected }">

    <!-- Node title bar -->
    <div class="flow-titlebar">
      <span class="material-symbols-outlined flow-titlebar__icon">account_tree</span>
      <span class="flow-titlebar__text">Integration Flow</span>
    </div>

    <!-- Three horizontal lanes -->
    <div class="lanes">

      <div v-for="lane in LANES" :key="lane.id" class="lane"
        :style="{ '--lane-color': lane.color }">

        <!-- Lane header -->
        <div class="lane-header">
          <span class="material-symbols-outlined lane-header__icon"
            style="font-variation-settings:'FILL' 1;">{{ lane.icon }}</span>
          <span class="lane-header__label">{{ lane.label }}</span>
        </div>

        <!-- Drop hint — always present so user knows where to drop -->
        <div class="lane-body">
          <div class="lane-hint">
            <span class="material-symbols-outlined" style="font-size:22px;color:#c7c6d1;">
              add_circle_outline
            </span>
            <span style="font-size:10px;color:#a0a7b5;margin-top:4px;font-family:'Inter',sans-serif;">
              Drop filters here
            </span>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Source handle per lane (bottom of each lane) -->
  <Handle
    v-for="(lane, i) in LANES" :key="lane.id"
    :id="`out-${lane.id}`"
    type="source"
    :position="Position.Bottom"
    class="flow-handle flow-handle--out"
    :style="{ left: `calc(${(i * 2 + 1)} * (100% / 6))`, background: lane.color }"
  />
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

defineProps<{
  id: string;
  data: Record<string, unknown>;
  selected: boolean;
}>();

const LANES = [
  { id: 'incoming',  label: 'Incoming',  icon: 'input',        color: '#0058bc' },
  { id: 'response',  label: 'Response',  icon: 'output',       color: '#047857' },
  { id: 'exception', label: 'Exception', icon: 'report',       color: '#991b1b' },
] as const;
</script>

<style scoped>
/* The vue-flow wrapper sets node dimensions via the `style` prop on the node object.
   These styles control the interior layout only. */

.flow-node {
  width: 100%;
  height: 100%;
  background: #ffffff;
  border: 2px solid #e3e2e7;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: border-color 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

.flow-node--selected {
  border-color: #0058bc;
  box-shadow: 0 0 0 3px rgba(0, 88, 188, 0.18), 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* Title bar */
.flow-titlebar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  background: #f4f3f8;
  border-bottom: 1px solid #e3e2e7;
  flex-shrink: 0;
}

.flow-titlebar__icon {
  font-size: 16px;
  color: #0058bc;
  font-variation-settings: 'FILL' 1;
}

.flow-titlebar__text {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #414755;
}

/* Lanes row */
.lanes {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* Individual lane */
.lane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e3e2e7;
}
.lane:last-child {
  border-right: none;
}

.lane-header {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  background: color-mix(in srgb, var(--lane-color) 10%, white);
  border-bottom: 1px solid color-mix(in srgb, var(--lane-color) 20%, white);
  flex-shrink: 0;
}

.lane-header__icon {
  font-size: 14px;
  color: var(--lane-color);
}

.lane-header__label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lane-color);
}

.lane-body {
  flex: 1;
  position: relative;
  /* Child filter nodes (via parentNode) float here */
}

.lane-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0.7;
}

/* Handles */
:deep(.flow-handle) {
  width: 11px !important;
  height: 11px !important;
  border: 2px solid #ffffff !important;
  border-radius: 50% !important;
  z-index: 10;
}

:deep(.flow-handle--in) {
  background: #0058bc !important;
}
</style>
