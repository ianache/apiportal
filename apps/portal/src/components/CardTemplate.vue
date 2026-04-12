<template>
  <div
    class="group rounded-[24px] border transition-all duration-300 hover:shadow-xl overflow-hidden flex flex-col h-full"
    style="background: #ffffff; border-color: #f0f0f5; box-shadow: 0 4px 20px rgba(0,0,0,0.04);"
  >
    <!-- Header Section -->
    <div class="p-6 pb-4">
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-4">
          <!-- Icon Slot -->
          <div class="flex-shrink-0">
            <slot name="icon">
              <div class="w-12 h-14 rounded-2xl flex items-center justify-center shadow-inner" 
                   style="background: linear-gradient(135deg, #4c6ef5 0%, #364fc7 100%);">
                <span class="material-symbols-outlined text-white text-2xl">category</span>
              </div>
            </slot>
          </div>
          
          <!-- Titles -->
          <div class="flex flex-col">
            <slot name="header-text">
              <h3 class="text-lg font-extrabold leading-tight" style="color: #1a1b1f;">Analytics Engine</h3>
              <p class="text-[10px] font-bold uppercase tracking-wider mt-1" style="color: #a0a7b5;">REAL-TIME DATA PROCESSING</p>
            </slot>
          </div>
        </div>

        <!-- Top Right Actions -->
        <div class="flex items-center gap-1 -mt-1">
          <slot name="header-actions">
            <button class="p-1.5 rounded-full hover:bg-slate-50 transition-colors" style="color: #717786;">
              <span class="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button class="p-1.5 rounded-full hover:bg-slate-50 transition-colors" style="color: #717786;">
              <span class="material-symbols-outlined text-[20px]">favorite</span>
            </button>
            <button class="p-1.5 rounded-full hover:bg-slate-50 transition-colors" style="color: #717786;">
              <span class="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          </slot>
        </div>
      </div>
    </div>

    <!-- Body Section (Metrics/Content) -->
    <div class="px-6 flex-grow">
      <slot name="body">
        <div class="space-y-4 py-2">
          <!-- Placeholder content for demo -->
          <div class="flex flex-col">
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Requests</span>
            <div class="flex items-end gap-2">
              <span class="text-3xl font-black text-slate-900">1.2M</span>
              <span class="text-[11px] font-bold text-emerald-500 flex items-center mb-1">
                <span class="material-symbols-outlined text-[14px]">trending_up</span> 12%
              </span>
            </div>
          </div>
          
          <div class="flex justify-between items-center text-sm font-medium">
            <span class="text-slate-500">Avg. Latency</span>
            <span class="text-slate-900 font-bold">45ms</span>
          </div>
          <div class="flex justify-between items-center text-sm font-medium">
            <span class="text-slate-500">Throughput</span>
            <span class="text-slate-900 font-bold">8.4k req/s</span>
          </div>
        </div>
      </slot>
    </div>

    <!-- Info/Status Banner -->
    <div class="mt-6 px-6 py-3 flex items-center justify-between" style="background: #f8f9fc;">
      <slot name="info">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span class="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">OPERATIONAL</span>
        </div>
        <span class="text-[10px] italic text-slate-400">Last sync: 2 mins ago</span>
      </slot>
    </div>

    <!-- Footer Actions -->
    <div class="p-6 flex items-center gap-3">
      <slot name="actions">
        <button class="flex-1 py-3 px-4 rounded-2xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center" 
                style="background: #0069e4; color: #ffffff; box-shadow: 0 4px 12px rgba(0,105,228,0.2);">
          New Product
        </button>
        <button class="flex-1 py-3 px-4 rounded-2xl text-sm font-bold border transition-all active:scale-95 flex items-center justify-center" 
                style="background: #f1f3f7; color: #0069e4; border-color: transparent;">
          Configure
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CardTemplate refined based on Modern API Portal Design
 * Sections: Icon, Header-Text, Header-Actions, Body, Info (Status Banner), Footer Actions
 */
</script>

<style scoped>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
}
</style>
