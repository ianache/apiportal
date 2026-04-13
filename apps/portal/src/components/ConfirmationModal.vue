<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
  >
    <div
      class="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200"
    >
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-amber-500 text-2xl">warning</span>
        </div>
        <h2 class="text-2xl font-black text-slate-900 leading-tight">{{ title }}</h2>
      </div>
      
      <p class="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
        {{ message }}
      </p>

      <div class="flex gap-3">
        <button
          @click="$emit('reject')"
          class="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all active:scale-95 border-2 border-transparent hover:bg-red-50"
          style="background: #fee2e2; color: #dc2626;"
        >
          {{ rejectText }}
        </button>
        <button
          @click="$emit('confirm')"
          class="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-100"
          style="background: #10b981; color: #ffffff;"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, default: 'Are you sure you want to proceed?' },
  confirmText: { type: String, default: 'Confirm' },
  rejectText: { type: String, default: 'Cancel' }
});

defineEmits(['confirm', 'reject']);
</script>
