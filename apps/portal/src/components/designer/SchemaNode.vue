<template>
  <div class="schema-node bg-white border-r border-l flex flex-col"
    :style="{ width: '320px', height: '100%', borderColor: '#e3e2e7' }">
    
    <!-- section-header (Standardized Label) -->
    <div class="h-12 flex items-center justify-center border-b" 
      :style="{ background: type === 'input' ? '#f8f9fc' : '#f8f9fc', borderColor: '#e3e2e7' }">
      <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {{ isInput ? 'Input Structure' : 'Output Structure' }}
      </span>
    </div>

    <!-- Panel Header -->
    <div class="p-4 border-b flex items-center justify-between" style="background: #ffffff; border-color: #f0f0f5;">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
          :style="{ background: isInput ? '#0058bc' : '#10b981' }">
          <span class="material-symbols-outlined text-white text-xl">
            {{ isInput ? 'login' : 'logout' }}
          </span>
        </div>
        <div>
          <h2 class="text-xs font-black text-slate-700 uppercase tracking-tight leading-tight">
            {{ isInput ? 'Input Structure' : 'Output Structure' }}
          </h2>
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data Schema</p>
        </div>
      </div>

      <button @click="triggerUpload" 
        class="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors" 
        title="Upload JSON Schema">
        <span class="material-symbols-outlined text-[20px]">upload_file</span>
      </button>
      <input type="file" ref="fileInput" class="hidden" accept=".json" @change="onFileChange" />
    </div>

    <!-- Search/Filter -->
    <div class="p-3 bg-slate-50/50 border-b border-slate-100">
      <div class="relative">
        <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
        <input type="text" placeholder="Filter fields..." 
          class="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400 transition-all shadow-inner" />
      </div>
    </div>

    <!-- Fields List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
      <div v-for="field in data.fields" :key="field.id" 
        class="field-item relative flex items-center p-2 rounded-xl hover:bg-slate-50 group transition-all">
        
        <Handle v-if="isInput"
          type="source"
          :position="Position.Right"
          :id="field.id"
          class="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !-mr-1.5 shadow-sm"
        />

        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span class="material-symbols-outlined text-slate-300 text-sm group-hover:text-slate-400">terminal</span>
          <span class="text-xs font-bold text-slate-600 truncate">{{ field.name }}</span>
        </div>

        <Handle v-if="!isInput"
          type="target"
          :position="Position.Left"
          :id="field.id"
          class="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white !-ml-1.5 shadow-sm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';

const props = defineProps<{
  id: string;
  type: string;
  data: {
    side?: 'input' | 'output';
    fields: Array<{ id: string; name: string }>;
    onSchemaLoaded?: (schema: any) => void;
    height?: number;
  };
}>();

const isInput = computed(() => props.data.side === 'input' || props.type === 'input' || props.type === 'schemaInput');

const emit = defineEmits(['schema-loaded']);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerUpload = () => {
  fileInput.value?.click();
};

const onFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target?.result as string);
      if (props.data.onSchemaLoaded) {
        props.data.onSchemaLoaded(json);
      }
      emit('schema-loaded', { nodeId: props.id, schema: json });
    } catch (err) {
      console.error('Failed to parse JSON Schema', err);
    }
  };
  reader.readAsText(file);
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.field-item:hover :deep(.vue-flow__handle) {
  transform: scale(1.2);
}
</style>
