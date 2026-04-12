<template>
  <div
    class="swci-node rounded-2xl border-2 transition-all duration-200"
    :class="selected ? 'selected-node' : 'border-white shadow-sm'"
    style="background: #ffffff; width: 180px;"
  >
    <div class="p-3 flex items-center gap-3">
      <!-- Icon -->
      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
           :style="{ background: getBgForType(data.type) }">
        <span class="material-symbols-outlined text-white" style="font-size: 20px;">{{ data.icon || getIconForType(data.type) }}</span>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-black text-slate-900 truncate pr-4">{{ data.name }}</p>
          <!-- Delete button (only if selected) -->
          <button 
            v-if="selected"
            @click.stop="onDelete"
            class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-50"
          >
            <span class="material-symbols-outlined" style="font-size: 14px;">close</span>
          </button>
        </div>
        <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{{ data.type }}</p>
      </div>
    </div>

    <!-- Connection Handles: Both source and target for all 4 positions -->
    <!-- We put source AFTER target in DOM so it's on top for dragging initiation -->
    
    <!-- Top -->
    <Handle type="target" :position="Position.Top" id="t-t" class="handle-custom omni-handle target-h" />
    <Handle type="source" :position="Position.Top" id="t-s" class="handle-custom omni-handle source-h" />
    
    <!-- Bottom -->
    <Handle type="target" :position="Position.Bottom" id="b-t" class="handle-custom omni-handle target-h" />
    <Handle type="source" :position="Position.Bottom" id="b-s" class="handle-custom omni-handle source-h" />
    
    <!-- Left -->
    <Handle type="target" :position="Position.Left" id="l-t" class="handle-custom omni-handle target-h" />
    <Handle type="source" :position="Position.Left" id="l-s" class="handle-custom omni-handle source-h" />
    
    <!-- Right -->
    <Handle type="target" :position="Position.Right" id="r-t" class="handle-custom omni-handle target-h" />
    <Handle type="source" :position="Position.Right" id="r-s" class="handle-custom omni-handle source-h" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core';

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false }
});

const { removeNodes } = useVueFlow();

const onDelete = () => {
  removeNodes([props.id]);
};

const getIconForType = (type: string) => {
  const icons: Record<string, string> = {
    API: 'api',
    DATABASE: 'database',
    MICROSERVICE: 'settings_input_component',
    FRONTEND: 'web',
    EXTERNAL_SERVICE: 'cloud',
    MESSAGE_BROKER: 'swap_horiz'
  };
  return icons[type] || 'settings_input_component';
};

const getBgForType = (type: string) => {
  const bgs: Record<string, string> = {
    API: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
    DATABASE: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    MICROSERVICE: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    FRONTEND: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    EXTERNAL_SERVICE: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    MESSAGE_BROKER: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  };
  return bgs[type] || '#94a3b8';
};
</script>

<style scoped>
.swci-node {
  position: relative;
}

.selected-node {
  border-color: #4338ca !important;
  box-shadow: 0 0 0 4px rgba(67, 56, 202, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.handle-custom {
  width: 10px !important;
  height: 10px !important;
  background: #cbd5e1 !important;
  border: 2px solid white !important;
  transition: all 0.2s;
  z-index: 10;
}

.handle-custom:hover {
  background: #4338ca !important;
  transform: scale(1.2);
  z-index: 20;
}

/* Ensure source handles are easy to grab to start connection */
.source-h {
  z-index: 15;
}

/* Target handles are underneath but still accessible for connection drops */
.target-h {
  z-index: 10;
}

.omni-handle {
  pointer-events: all !important;
}
</style>
