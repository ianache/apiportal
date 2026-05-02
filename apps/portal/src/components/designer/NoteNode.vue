<template>
  <div 
    ref="noteRef"
    class="note-node rounded-lg shadow-md border-2 overflow-hidden h-full w-full relative"
    :class="{ 'ring-2 ring-amber-400': selected, 'resizing': isResizing }"
    :style="{ 
      backgroundColor: data.color || '#fef3c7',
      borderColor: selected ? '#f59e0b' : 'transparent',
      cursor: cursorStyle
    }"
    @mousemove="onMouseMove"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
  >
    <!-- Resize Handles Visual Indicators -->
    <div v-if="selected" class="resize-indicator resize-n" :class="{ 'active': resizeDirection === 'n' }"></div>
    <div v-if="selected" class="resize-indicator resize-s" :class="{ 'active': resizeDirection === 's' }"></div>
    <div v-if="selected" class="resize-indicator resize-e" :class="{ 'active': resizeDirection === 'e' }"></div>
    <div v-if="selected" class="resize-indicator resize-w" :class="{ 'active': resizeDirection === 'w' }"></div>
    <div v-if="selected" class="resize-indicator resize-ne" :class="{ 'active': resizeDirection === 'ne' }"></div>
    <div v-if="selected" class="resize-indicator resize-nw" :class="{ 'active': resizeDirection === 'nw' }"></div>
    <div v-if="selected" class="resize-indicator resize-se" :class="{ 'active': resizeDirection === 'se' }"></div>
    <div v-if="selected" class="resize-indicator resize-sw" :class="{ 'active': resizeDirection === 'sw' }"></div>

    <!-- Note Header -->
    <div class="flex items-center justify-between px-2 py-1 border-b border-black/10 bg-black/5 handle">
      <span class="material-symbols-outlined text-xs text-black/40">sticky_note</span>
    </div>
    
    <!-- Note Content -->
    <div class="p-3 overflow-auto" style="height: calc(100% - 28px);">
      <div
        v-html="renderedContent"
        class="note-markdown"
        :style="{ fontSize: `${data.fontSize || 14}px` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useVueFlow, type NodeProps } from '@vue-flow/core';

marked.setOptions({
  breaks: true,
  gfm: true
});

const props = defineProps<NodeProps>();
const { updateNode } = useVueFlow();

const noteRef = ref<HTMLElement | null>(null);
const isResizing = ref(false);
const resizeDirection = ref<string | null>(null);
const startPos = ref({ x: 0, y: 0 });
const startSize = ref({ width: 0, height: 0 });
const cursorStyle = ref('default');

const RESIZE_THRESHOLD = 8;

const renderedContent = computed(() => {
  try {
    const html = marked.parse(props.data?.content || '') as string;
    return DOMPurify.sanitize(html);
  } catch (e) {
    return props.data?.content || '';
  }
});

const getResizeDirection = (e: MouseEvent): string | null => {
  if (!noteRef.value) return null;
  
  const rect = noteRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const width = rect.width;
  const height = rect.height;
  
  const onLeft = x < RESIZE_THRESHOLD;
  const onRight = x > width - RESIZE_THRESHOLD;
  const onTop = y < RESIZE_THRESHOLD;
  const onBottom = y > height - RESIZE_THRESHOLD;
  
  if (onTop && onLeft) return 'nw';
  if (onTop && onRight) return 'ne';
  if (onBottom && onLeft) return 'sw';
  if (onBottom && onRight) return 'se';
  if (onTop) return 'n';
  if (onBottom) return 's';
  if (onLeft) return 'w';
  if (onRight) return 'e';
  
  return null;
};

const getCursorForDirection = (direction: string | null): string => {
  switch (direction) {
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'nw':
    case 'se':
      return 'nwse-resize';
    default:
      return 'default';
  }
};

const onMouseMove = (e: MouseEvent) => {
  if (!isResizing.value && props.selected) {
    const direction = getResizeDirection(e);
    resizeDirection.value = direction;
    cursorStyle.value = getCursorForDirection(direction);
  }
};

const onMouseDown = (e: MouseEvent) => {
  const direction = getResizeDirection(e);
  if (direction && props.selected) {
    e.preventDefault();
    e.stopPropagation();
    
    isResizing.value = true;
    resizeDirection.value = direction;
    startPos.value = { x: e.clientX, y: e.clientY };
    
    if (noteRef.value) {
      startSize.value = {
        width: noteRef.value.offsetWidth,
        height: noteRef.value.offsetHeight
      };
    }
    
    // Add global mouse events
    document.addEventListener('mousemove', onGlobalMouseMove);
    document.addEventListener('mouseup', onGlobalMouseUp);
  }
};

const onGlobalMouseMove = (e: MouseEvent) => {
  if (!isResizing.value || !resizeDirection.value) return;

  const dx = e.clientX - startPos.value.x;
  const dy = e.clientY - startPos.value.y;

  let newWidth = startSize.value.width;
  let newHeight = startSize.value.height;

  if (resizeDirection.value.includes('e')) {
    newWidth = Math.max(150, startSize.value.width + dx);
  }
  if (resizeDirection.value.includes('w')) {
    newWidth = Math.max(150, startSize.value.width - dx);
  }
  if (resizeDirection.value.includes('s')) {
    newHeight = Math.max(100, startSize.value.height + dy);
  }
  if (resizeDirection.value.includes('n')) {
    newHeight = Math.max(100, startSize.value.height - dy);
  }

  // Update node directly using VueFlow's updateNode
  updateNode(props.id, {
    style: {
      ...props.style,
      width: `${newWidth}px`,
      height: `${newHeight}px`
    }
  });
};

const onGlobalMouseUp = () => {
  isResizing.value = false;
  resizeDirection.value = null;
  cursorStyle.value = 'default';
  
  document.removeEventListener('mousemove', onGlobalMouseMove);
  document.removeEventListener('mouseup', onGlobalMouseUp);
};

const onMouseUp = () => {
  // Handled by global mouse up
};

const onMouseLeave = () => {
  if (!isResizing.value) {
    resizeDirection.value = null;
    cursorStyle.value = 'default';
  }
};
</script>

<style scoped>
.note-node {
  box-sizing: border-box;
  user-select: none;
}

.note-node.resizing {
  user-select: none;
}

.resize-indicator {
  position: absolute;
  background-color: #f59e0b;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 10;
}

.resize-indicator.active {
  opacity: 1;
}

/* North */
.resize-n {
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 4px;
  cursor: ns-resize;
}

/* South */
.resize-s {
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 4px;
  cursor: ns-resize;
}

/* East */
.resize-e {
  right: -2px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  cursor: ew-resize;
}

/* West */
.resize-w {
  left: -2px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  cursor: ew-resize;
}

/* Corners */
.resize-ne {
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  cursor: nesw-resize;
}

.resize-nw {
  top: -2px;
  left: -2px;
  width: 8px;
  height: 8px;
  cursor: nwse-resize;
}

.resize-se {
  bottom: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  cursor: nwse-resize;
}

.resize-sw {
  bottom: -2px;
  left: -2px;
  width: 8px;
  height: 8px;
  cursor: nesw-resize;
}

:deep(.note-markdown) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.5;
  color: inherit;
}

:deep(.note-markdown h1) {
  font-size: 1.4em;
  font-weight: 700;
  margin: 0 0 0.4em;
  line-height: 1.2;
}

:deep(.note-markdown h2) {
  font-size: 1.2em;
  font-weight: 700;
  margin: 0.6em 0 0.3em;
  line-height: 1.2;
}

:deep(.note-markdown h3) {
  font-size: 1.05em;
  font-weight: 600;
  margin: 0.5em 0 0.25em;
}

:deep(.note-markdown p) {
  margin: 0 0 0.5em;
}

:deep(.note-markdown p:last-child) {
  margin-bottom: 0;
}

:deep(.note-markdown strong) {
  font-weight: 700;
}

:deep(.note-markdown em) {
  font-style: italic;
}

:deep(.note-markdown ul),
:deep(.note-markdown ol) {
  padding-left: 1.3em;
  margin: 0.3em 0 0.5em;
}

:deep(.note-markdown ul) {
  list-style-type: disc;
}

:deep(.note-markdown ol) {
  list-style-type: decimal;
}

:deep(.note-markdown li) {
  margin-bottom: 0.2em;
}

:deep(.note-markdown code) {
  font-family: monospace;
  font-size: 0.88em;
  background: rgba(0,0,0,0.08);
  border-radius: 3px;
  padding: 0.1em 0.35em;
}

:deep(.note-markdown pre) {
  background: rgba(0,0,0,0.08);
  border-radius: 6px;
  padding: 0.5em 0.75em;
  overflow-x: auto;
  margin: 0.4em 0;
}

:deep(.note-markdown pre code) {
  background: none;
  padding: 0;
  font-size: 0.85em;
}

:deep(.note-markdown blockquote) {
  border-left: 3px solid rgba(0,0,0,0.2);
  margin: 0.4em 0;
  padding-left: 0.75em;
  opacity: 0.75;
}

:deep(.note-markdown hr) {
  border: none;
  border-top: 1px solid rgba(0,0,0,0.15);
  margin: 0.5em 0;
}

:deep(.note-markdown a) {
  color: #4338ca;
  text-decoration: underline;
}

:deep(.note-markdown table) {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.9em;
  margin: 0.4em 0;
}

:deep(.note-markdown th),
:deep(.note-markdown td) {
  border: 1px solid rgba(0,0,0,0.15);
  padding: 0.25em 0.5em;
}

:deep(.note-markdown th) {
  font-weight: 600;
  background: rgba(0,0,0,0.05);
}
</style>
