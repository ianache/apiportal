import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useDesignerPanelStore = defineStore('designerPanel', () => {
  const MIN_WIDTH = 280;
  const MAX_WIDTH = 700;
  const DEFAULT_WIDTH = 340;

  const panelWidth = ref(DEFAULT_WIDTH);
  const isOpen = ref(false);
  const selectedNodeId = ref<string | null>(null);

  const width = computed({
    get: () => panelWidth.value,
    set: (value: number) => {
      panelWidth.value = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
    }
  });

  function openPanel(nodeId?: string) {
    if (nodeId) selectedNodeId.value = nodeId;
    isOpen.value = true;
  }

  function closePanel() {
    isOpen.value = false;
    selectedNodeId.value = null;
  }

  function setWidth(newWidth: number) {
    panelWidth.value = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
  }

  return {
    MIN_WIDTH,
    MAX_WIDTH,
    DEFAULT_WIDTH,
    panelWidth,
    isOpen,
    selectedNodeId,
    width,
    openPanel,
    closePanel,
    setWidth
  };
});
