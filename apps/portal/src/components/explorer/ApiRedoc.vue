<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';

const props = defineProps<{
  spec: any;
}>();

const showRedoc = ref(false);
const error = ref<string | null>(null);

const loadRedoc = (): Promise<void> => {
  return new Promise((resolve) => {
    if ((window as any).Redoc) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/redoc@2.5.2/bundles/redoc.styles.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/redoc@2.5.2/bundles/redoc.standalone.js';
    script.onload = () => resolve();
    script.onerror = () => {
      error.value = 'Failed to load Redoc';
      resolve();
    };
    document.head.appendChild(script);
  });
};

const initRedoc = async () => {
  if (!props.spec) return;
  showRedoc.value = true;
  await loadRedoc();
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 100));

  const container = document.getElementById('redoc-container');
  if (container && (window as any).Redoc) {
    try {
      (window as any).Redoc.init(props.spec, {
        scrollYOffset: 0,
        nativeScrollbars: true,
        theme: {
          colors: {
            primary: { main: '#0058bc' }
          }
        }
      }, container);
    } catch (err) {
      console.error('Redoc error:', err);
    }
  }
};

onMounted(initRedoc);
watch(() => props.spec, initRedoc);
</script>

<template>
  <div class="h-full flex flex-col">
    <div v-if="error" class="p-8 text-center text-red-600">{{ error }}</div>
    <div id="redoc-container" class="flex-1 overflow-y-auto"></div>
  </div>
</template>
