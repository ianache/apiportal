<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';

const props = defineProps<{
  spec: any;
}>();

const error = ref<string | null>(null);

const loadSwaggerUI = (): Promise<void> => {
  return new Promise((resolve) => {
    if ((window as any).SwaggerUIBundle) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js';
    script.onload = () => resolve();
    script.onerror = () => {
      error.value = 'Failed to load Swagger UI';
      resolve();
    };
    document.head.appendChild(script);
  });
};

const initSwagger = async () => {
  if (!props.spec) return;
  await loadSwaggerUI();
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 100));

  if ((window as any).SwaggerUIBundle) {
    (window as any).SwaggerUIBundle({
      spec: props.spec,
      dom_id: '#swagger-container',
      presets: [
        (window as any).SwaggerUIBundle.presets.apis,
        (window as any).SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      layout: "BaseLayout",
      deepLinking: true,
      displayRequestDuration: true,
    });
  }
};

onMounted(initSwagger);
watch(() => props.spec, initSwagger);
</script>

<template>
  <div class="h-full flex flex-col bg-white">
    <div v-if="error" class="p-8 text-center text-red-600">{{ error }}</div>
    <div id="swagger-container" class="flex-1 overflow-y-auto"></div>
  </div>
</template>

<style>
/* Patch Swagger UI to look more like our theme */
.swagger-ui .topbar { display: none; }
.swagger-ui .info { margin: 20px 0; }
.swagger-ui .info .title { font-family: 'Inter', sans-serif; color: #1a1b1f; }
.swagger-ui .btn.execute { background-color: #0058bc; }
</style>
