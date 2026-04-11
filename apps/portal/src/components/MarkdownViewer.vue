<template>
  <div class="md-viewer">
    <div class="md-viewer__header">
      <span class="md-viewer__title">{{ title }}</span>
      <div class="md-viewer__actions">
        <button @click="copyToClipboard" class="md-viewer__btn" title="Copy to clipboard">
          <span class="material-symbols-outlined">{{ copied ? 'check' : 'content_copy' }}</span>
        </button>
        <button @click="downloadMarkdown" class="md-viewer__btn" title="Download Markdown">
          <span class="material-symbols-outlined">download</span>
        </button>
      </div>
    </div>
    <div class="md-viewer__content markdown-body" v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const props = withDefaults(defineProps<{
  content: string;
  title?: string;
  filename?: string;
}>(), {
  title: 'Content',
  filename: 'document.md'
});

const copied = ref(false);

const renderedContent = computed(() => {
  if (!props.content) return '';
  const html = marked(props.content);
  return DOMPurify.sanitize(html as string);
});

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.content);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

function downloadMarkdown() {
  const blob = new Blob([props.content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = props.filename;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.md-viewer {
  border: 1px solid #e3e2e7;
  border-radius: 10px;
  overflow: hidden;
  background: #faf9fe;
}

.md-viewer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f1f1f1;
  border-bottom: 1px solid #e3e2e7;
}

.md-viewer__title {
  font-size: 12px;
  font-weight: 600;
  color: #414755;
  font-family: 'Inter', sans-serif;
}

.md-viewer__actions {
  display: flex;
  gap: 4px;
}

.md-viewer__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  color: #64748b;
  transition: all 0.15s;
  padding: 0;
}

.md-viewer__btn:hover {
  background: #e3e2e7;
  color: #1e293b;
}

.md-viewer__btn .material-symbols-outlined {
  font-size: 18px;
}

.md-viewer__content {
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
  color: #1a1b1f;
}

/* Markdown styles */
.md-viewer__content :deep(h1) {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e3e2e7;
}

.md-viewer__content :deep(h2) {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px;
}

.md-viewer__content :deep(h3) {
  font-size: 14px;
  font-weight: 600;
  margin: 12px 0 6px;
}

.md-viewer__content :deep(p) {
  margin: 0 0 12px;
}

.md-viewer__content :deep(ul),
.md-viewer__content :deep(ol) {
  margin: 0 0 12px;
  padding-left: 20px;
}

.md-viewer__content :deep(li) {
  margin-bottom: 4px;
}

.md-viewer__content :deep(code) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  background: #f1f1f1;
  padding: 2px 6px;
  border-radius: 4px;
}

.md-viewer__content :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0 0 12px;
}

.md-viewer__content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.md-viewer__content :deep(blockquote) {
  margin: 0 0 12px;
  padding: 8px 16px;
  border-left: 4px solid #3b82f6;
  background: #eff6ff;
  color: #1e40af;
}

.md-viewer__content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 12px;
  font-size: 12px;
}

.md-viewer__content :deep(th),
.md-viewer__content :deep(td) {
  border: 1px solid #e3e2e7;
  padding: 8px 12px;
  text-align: left;
}

.md-viewer__content :deep(th) {
  background: #f8fafc;
  font-weight: 600;
}

.md-viewer__content :deep(a) {
  color: #0058bc;
  text-decoration: none;
}

.md-viewer__content :deep(a:hover) {
  text-decoration: underline;
}

.md-viewer__content :deep(hr) {
  border: none;
  border-top: 1px solid #e3e2e7;
  margin: 16px 0;
}
</style>
