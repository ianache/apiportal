<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  language?: string;
  placeholder?: string;
  rows?: number;
}>();

const emit = defineEmits(['update:modelValue']);

const code = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const languageLabel = computed(() => {
  return props.language?.toUpperCase() || 'TEXT';
});
</script>

<template>
  <div class="code-editor-container">
    <div class="code-editor-header">
      <span class="code-editor-lang">{{ languageLabel }}</span>
      <span class="material-symbols-outlined" style="font-size: 14px; color: #a0a7b5;">code</span>
    </div>
    <textarea
      v-model="code"
      class="code-editor-textarea"
      :placeholder="placeholder"
      :rows="rows || 6"
      spellcheck="false"
    ></textarea>
  </div>
</template>

<style scoped>
.code-editor-container {
  display: flex;
  flex-direction: column;
  border: 1px solid #e3e2e7;
  border-radius: 12px;
  overflow: hidden;
  background: #1e1e1e;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

.code-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  background: #2d2d2d;
  border-bottom: 1px solid #3d3d3d;
}

.code-editor-lang {
  font-size: 9px;
  font-weight: 800;
  color: #a0a7b5;
  letter-spacing: 0.05em;
}

.code-editor-textarea {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: none;
  color: #d4d4d4;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.5;
  outline: none;
  resize: vertical;
}

.code-editor-textarea::placeholder {
  color: #555;
}
</style>
