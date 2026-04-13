<template>
  <div class="tx-node flex flex-col min-w-[180px] bg-white rounded-xl border-2 transition-all shadow-sm"
    :class="{ 'selected border-blue-500 shadow-blue-100 ring-4 ring-blue-50': selected }">
    
    <!-- Header -->
    <div class="px-3 py-2 border-b flex items-center gap-2 rounded-t-xl" :style="{ background: data.bg + '15' }">
      <div class="w-6 h-6 rounded-lg flex items-center justify-center" :style="{ background: data.bg }">
        <span class="material-symbols-outlined text-white text-[14px]">{{ data.icon }}</span>
      </div>
      <span class="text-xs font-black text-slate-700 truncate">{{ data.label }}</span>
    </div>

    <!-- Content / Handles -->
    <div class="p-3 flex justify-between gap-4">
      <!-- Inputs (Left) -->
      <div class="flex flex-col gap-3 -ml-5">
        <div v-for="(input, index) in data.inputs" :key="input.id" 
          class="relative flex items-center group">
          <Handle
            type="target"
            :position="Position.Left"
            :id="input.id"
            class="handle-input !w-4 !h-4 !bg-white !border-2 !border-slate-300 hover:!border-blue-500 transition-colors"
          />
          <span class="ml-6 text-[9px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-500 transition-colors">
            {{ input.label }}
            <span v-if="getConnectedFieldName(input.id)" class="text-blue-600 ml-1 font-black">
              [{{ getConnectedFieldName(input.id) }}]
            </span>
          </span>
        </div>
      </div>

      <!-- Output (Right) -->
      <div class="flex flex-col justify-center -mr-5">
        <div class="relative flex items-center group">
          <span class="mr-6 text-[9px] font-bold uppercase tracking-wider text-slate-400">OUT</span>
          <Handle
            type="source"
            :position="Position.Right"
            id="output"
            class="handle-output !w-4 !h-4 !bg-white !border-2 !border-slate-300 hover:!border-emerald-500 transition-colors"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core';

const props = defineProps<{
  id: string;
  data: {
    label: string;
    icon: string;
    bg: string;
    inputs: Array<{ id: string; label: string; value?: string }>;
  };
  selected?: boolean;
}>();

const { getEdges, findNode } = useVueFlow();

// Dynamic discovery of connected field names from the Input Schema
const getConnectedFieldName = (handleId: string) => {
  const edge = getEdges.value.find(e => e.target === props.id && e.targetHandle === handleId);
  if (!edge) return null;
  
  const sourceNode = findNode(edge.source);
  if (sourceNode && sourceNode.type === 'input') {
    // Find the field name in the input schema node data
    const field = sourceNode.data.fields.find((f: any) => f.id === edge.sourceHandle);
    return field ? field.name : null;
  }
  return null;
};
</script>

<style scoped>
.tx-node {
  border-color: #e3e2e7;
}
.handle-input :deep(.vue-flow__handle),
.handle-output :deep(.vue-flow__handle) {
  background: white;
}

.vue-flow__handle {
  width: 12px;
  height: 12px;
  border: 2px solid #cbd5e1;
}

.vue-flow__handle:hover {
  border-color: #3b82f6;
}
</style>
