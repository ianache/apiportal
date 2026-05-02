<template>
  <div
    class="absolute z-50 select-none"
    :class="{ 'cursor-grabbing': isDragging }"
    :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
  >
    <div
      class="bg-white/96 backdrop-blur-sm rounded-2xl flex flex-col overflow-hidden"
      style="box-shadow: 0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07); border: 1px solid rgba(226,232,240,0.9);"
    >
      <!-- Drag Handle -->
      <div
        class="flex items-center justify-center py-2 cursor-grab border-b border-slate-100 hover:bg-slate-50 transition-colors"
        @mousedown.stop="startDrag"
        title="Mover toolbar"
      >
        <div class="grid gap-[3px]" style="grid-template-columns: repeat(3, 4px);">
          <div v-for="i in 9" :key="i" class="w-1 h-1 rounded-full bg-slate-300" />
        </div>
      </div>

      <!-- Controls -->
      <div class="flex flex-col p-1.5 gap-0.5">

        <!-- Zoom In -->
        <button
          @click.stop="emit('zoom-in')"
          class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90"
          title="Zoom In"
        >
          <span class="material-symbols-outlined" style="font-size:20px;">add</span>
        </button>

        <!-- Zoom Out -->
        <button
          @click.stop="emit('zoom-out')"
          class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90"
          title="Zoom Out"
        >
          <span class="material-symbols-outlined" style="font-size:20px;">remove</span>
        </button>

        <!-- Fit View -->
        <button
          @click.stop="emit('fit-view')"
          class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90"
          title="Fit View"
        >
          <span class="material-symbols-outlined" style="font-size:18px;">fit_screen</span>
        </button>

        <div class="h-px bg-slate-100 mx-1 my-0.5" />

        <!-- Snap to Grid -->
        <button
          @click.stop="emit('update:snapToGrid', !snapToGrid)"
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
          :class="snapToGrid ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'"
          title="Snap a la grilla"
        >
          <span
            class="material-symbols-outlined"
            style="font-size:18px;"
            :style="{ fontVariationSettings: snapToGrid ? `'FILL' 1` : `'FILL' 0` }"
          >grid_4x4</span>
        </button>

        <!-- Lock -->
        <button
          v-if="showLock"
          @click.stop="emit('update:isLocked', !isLocked)"
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
          :class="isLocked ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'"
          :title="isLocked ? 'Desbloquear diagrama' : 'Bloquear diagrama'"
        >
          <span
            class="material-symbols-outlined"
            style="font-size:18px;"
            :style="{ fontVariationSettings: isLocked ? `'FILL' 1` : `'FILL' 0` }"
          >{{ isLocked ? 'lock' : 'lock_open' }}</span>
        </button>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
  snapToGrid: boolean;
  isLocked?: boolean;
  canvasRef?: HTMLElement | null;
  showLock?: boolean;
}>(), {
  isLocked: false,
  showLock: true,
});

const emit = defineEmits<{
  'update:snapToGrid': [value: boolean];
  'update:isLocked': [value: boolean];
  'zoom-in': [];
  'zoom-out': [];
  'fit-view': [];
}>();

// ── Draggable ─────────────────────────────────────────────
const pos = ref({ x: 16, y: 80 });
const isDragging = ref(false);
const offset = ref({ x: 0, y: 0 });

onMounted(() => {
  if (props.canvasRef) {
    const { width, height } = props.canvasRef.getBoundingClientRect();
    pos.value = { x: width - 64, y: Math.max(80, height - 340) };
  }
});

const startDrag = (e: MouseEvent) => {
  e.preventDefault();
  isDragging.value = true;
  const rect = props.canvasRef?.getBoundingClientRect();
  offset.value = {
    x: e.clientX - (rect?.left ?? 0) - pos.value.x,
    y: e.clientY - (rect?.top ?? 0) - pos.value.y,
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
};

const onMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const rect = props.canvasRef?.getBoundingClientRect();
  pos.value = {
    x: e.clientX - (rect?.left ?? 0) - offset.value.x,
    y: e.clientY - (rect?.top ?? 0) - offset.value.y,
  };
};

const onUp = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onMove);
  document.removeEventListener('mouseup', onUp);
};

onUnmounted(() => {
  document.removeEventListener('mousemove', onMove);
  document.removeEventListener('mouseup', onUp);
});
</script>
