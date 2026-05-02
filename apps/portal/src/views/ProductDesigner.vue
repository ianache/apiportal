<template>
  <div class="fixed inset-0 flex flex-col" style="font-family: 'Inter', sans-serif; background: #faf9fe;">

    <!-- ── Toolbar ─────────────────────────────────────── -->
    <header class="flex items-center justify-between px-4 flex-shrink-0 z-20"
      style="height:56px;background:#ffffff;border-bottom:1px solid #e3e2e7;">

      <!-- Left -->
      <div class="flex items-center gap-3">
        <button @click="handleBack"
          class="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60"
          style="color:#414755;">
          <span class="material-symbols-outlined" style="font-size:18px;">arrow_back</span>Back
        </button>
        <span style="color:#e3e2e7;">|</span>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined" style="font-size:20px;color:#4338ca;">package_2</span>
          <span class="text-sm font-bold" style="color:#1a1b1f;">
            {{ product?.name ?? 'Product' }} Designer
          </span>
          <span v-if="isDirty" class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-700 uppercase tracking-widest">Unsaved Changes</span>
        </div>
      </div>

      <!-- Right -->
      <div class="flex items-center gap-3">
        <span v-if="saveStatus === 'saving'" class="flex items-center gap-1 text-xs font-medium" style="color:#a0a7b5;">
          <span class="material-symbols-outlined animate-spin" style="font-size:14px;">progress_activity</span>Saving…
        </span>
        <span v-else-if="saveStatus === 'saved'" class="flex items-center gap-1 text-xs font-medium" style="color:#047857;">
          <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span>Saved
        </span>

        <!-- Zoom level -->
        <span
          class="text-xs font-black tabular-nums px-2.5 py-1 rounded-lg"
          style="color:#64748b;background:#f1f5f9;min-width:3.5rem;display:inline-block;text-align:center;letter-spacing:0.02em;"
        >{{ Math.round(currentZoom * 100) }}%</span>

        <!-- Export PNG -->
        <button
          @click="exportToPng"
          :disabled="isExporting"
          class="flex items-center justify-center w-9 h-9 rounded-xl border transition-all active:scale-95 hover:bg-slate-50 disabled:opacity-40"
          style="border-color:#e3e2e7;color:#414755;"
          title="Exportar diagrama a PNG"
        >
          <span v-if="!isExporting" class="material-symbols-outlined" style="font-size:18px;">image</span>
          <span v-else class="material-symbols-outlined animate-spin" style="font-size:16px;">progress_activity</span>
        </button>

        <!-- Separator -->
        <div class="self-stretch w-px rounded-full my-2" style="background:#e3e2e7;"></div>

        <button @click="openNewDiagramModal"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 hover:opacity-90"
          style="background:#e0e7ff;color:#4338ca;border:1px solid #4338ca;">
          <span class="material-symbols-outlined" style="font-size:18px;">add_chart</span>Add Diagram
        </button>

        <button @click="onSave" :disabled="saveStatus === 'saving'"
          class="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
          style="background:#4338ca;color:#ffffff;box-shadow: 0 4px 12px rgba(67, 56, 202, 0.25);">
          <span class="material-symbols-outlined" style="font-size:18px;">save</span>Save Diagram
        </button>
      </div>
    </header>

    <!-- ── Diagram Tabs ─────────────────────────────────── -->
    <div v-if="diagrams.length > 0" class="flex items-center px-4 gap-1 flex-shrink-0 z-20 border-b"
      style="height:40px;background:#f8f8fb;border-color:#e3e2e7;">
      <div 
        v-for="diagram in diagrams" 
        :key="diagram.id"
        @click="loadDiagram(diagram.id)"
        class="flex items-center gap-2 px-4 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer transition-all border-t border-l border-r"
        :class="activeDiagramId === diagram.id 
          ? 'bg-white text-indigo-600 border-slate-200' 
          : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700'"
        :style="activeDiagramId === diagram.id ? 'border-bottom:1px solid white;margin-bottom:-1px;' : ''"
      >
        <span class="material-symbols-outlined" style="font-size:14px;">{{ diagram.name === 'Main' ? 'home' : 'dashboard' }}</span>
        <span>{{ diagram.name }}</span>
        <button 
          v-if="diagram.name !== 'Main'"
          @click.stop="confirmDeleteDiagram(diagram.id)"
          class="ml-1 p-0.5 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
          title="Delete diagram"
        >
          <span class="material-symbols-outlined" style="font-size:14px;">close</span>
        </button>
        <span 
          v-else 
          class="ml-1 p-0.5 text-slate-300 cursor-not-allowed"
          title="Main diagram cannot be deleted"
        >
          <span class="material-symbols-outlined" style="font-size:14px;">lock</span>
        </span>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      
      <!-- ── Left Panel: SWCI Library ─────────────────── -->
      <aside class="w-64 border-r bg-white flex flex-col z-10" style="border-color:#e3e2e7;">
        <div class="p-4 border-bottom">
          <h2 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">SWCI Components</h2>
          
          <div class="flex gap-2 mb-4">
            <button 
              @click="openCreateSWCI"
              class="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all text-xs font-bold uppercase"
            >
              <span class="material-symbols-outlined" style="font-size:16px;">add</span>
              New CI
            </button>
            <button 
              @click="addNote"
              class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 border-dashed border-amber-200 text-amber-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-all text-xs font-bold uppercase active:scale-95"
              title="Add Note"
            >
              <span class="material-symbols-outlined" style="font-size:16px;">sticky_note</span>
              Note
            </button>
          </div>

          <div class="relative mb-4">
            <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" style="font-size:16px;">search</span>
            <input 
              v-model="swciSearch" 
              type="text" 
              placeholder="Filter components..." 
              class="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs outline-none focus:border-indigo-300 transition-colors"
            />
          </div>
        </div>

        <!-- Grouped SWCI Components -->
        <div class="flex-1 overflow-y-auto p-3 space-y-4">
          <div v-for="group in groupedSWCIs" :key="group.typeName" class="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm">
            <button 
              @click="toggleGroup(group.typeName)"
              class="w-full flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-indigo-500" style="font-size:18px;">{{ group.icon || 'folder' }}</span>
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-700">{{ group.typeName }}</span>
              </div>
              <span class="material-symbols-outlined text-slate-400 transition-transform" :class="expandedGroups[group.typeName] ? 'rotate-180' : ''">expand_more</span>
            </button>

            <div v-show="expandedGroups[group.typeName]" class="p-2 space-y-2 border-t border-slate-50 animate-in slide-in-from-top-1 duration-200">
              <div
                v-for="item in group.items"
                :key="item.id"
                class="p-2.5 rounded-lg border border-transparent bg-slate-50/30 cursor-grab active:cursor-grabbing hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                draggable="true"
                @dragstart="onDragStart($event, item)"
              >
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-indigo-400" style="font-size:16px;">{{ item.type?.icon || 'settings_input_component' }}</span>
                  <p class="text-xs font-bold text-slate-600 truncate">{{ item.name }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="groupedSWCIs.length === 0" class="text-center py-10">
            <p class="text-xs text-slate-400 italic">No components found</p>
          </div>
        </div>
      </aside>

      <!-- ── Canvas area ─────────────────────────────────── -->
      <main ref="canvasRef" class="flex-1 relative overflow-hidden bg-slate-50" @drop="onDrop" @dragover.prevent>
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          :default-edge-options="defaultEdgeOptions"
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @pane-click="onPaneClick"
          @connect="onConnect"
          @nodes-change="onNodesChange"
          @edges-change="onEdgesChange"
          @viewport-change="onViewportChange"
          :delete-key-code="['Delete', 'Backspace']"
          :connection-mode="ConnectionMode.Loose"
          :snap-to-grid="snapToGrid"
          :snap-grid="[20, 20]"
          :nodes-draggable="!isLocked"
          :nodes-connectable="!isLocked"
          :elements-selectable="!isLocked"
        >
          <Background :gap="24" :size="1.5" pattern-color="#d4d2db" variant="dots" />
        </VueFlow>

        <!-- ── Diagram Toolbar ────────────────────────────── -->
        <DiagramToolbar
          :canvas-ref="canvasRef"
          v-model:snap-to-grid="snapToGrid"
          v-model:is-locked="isLocked"
          @zoom-in="vueFlow.zoomIn()"
          @zoom-out="vueFlow.zoomOut()"
          @fit-view="vueFlow.fitView()"
        />
      </main>

      <!-- ── Right Panel: Properties ──────────────────── -->
      <aside v-if="selectedElement" class="w-80 border-l bg-white flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-200" style="border-color:#e3e2e7;">
        <div class="p-5 border-b flex items-center justify-between">
          <h2 class="text-sm font-black uppercase tracking-widest text-slate-900">Properties</h2>
          <button @click="selectedElement = null" class="material-symbols-outlined text-slate-400 hover:text-slate-600">close</button>
        </div>

        <div class="p-6 space-y-6 overflow-y-auto">
          <!-- Node Properties -->
          <template v-if="selectedElement?.type === 'swci'">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Component Name</label>
              <input 
                v-model="editForm.name" 
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
              />
            </div>

            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Component Type</label>
              <select 
                v-model="editForm.typeId"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
              >
                <option v-for="t in productStore.configItemTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            
            <div v-if="isApiType" class="pt-4 border-t">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Linked API</label>
              <select 
                v-model="editForm.selectedApiId"
                @change="onApiChange"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all mb-3"
              >
                <option value="">None</option>
                <option v-for="api in registryStore.apis" :key="api.id" :value="api.id">{{ api.name }}</option>
              </select>
              
              <template v-if="editForm.selectedApiId">
                <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Version</label>
                <select 
                  v-model="editForm.apiVersionId"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option v-for="v in selectedApiVersions" :key="v.id" :value="v.id">{{ v.version }}</option>
                </select>
              </template>
            </div>

            <div v-if="selectedTypeSpecs.length > 0" class="space-y-4 pt-4 border-t">
              <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-900">Type Specifications</h3>
              <div v-for="spec in selectedTypeSpecs" :key="spec.id">
                <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  {{ spec.name }} <span v-if="spec.required" class="text-red-500">*</span>
                </label>
                <div v-if="spec.dataType === 'boolean'" class="flex items-center">
                  <input type="checkbox" v-model="editForm.properties[spec.id]" class="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500" />
                </div>
                <input v-else-if="spec.dataType === 'integer'" 
                  type="number" 
                  v-model.number="editForm.properties[spec.id]" 
                  class="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100" 
                />
                <input v-else 
                  type="text" 
                  v-model="editForm.properties[spec.id]" 
                  class="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100" 
                />
              </div>
            </div>

            <div class="pt-6 border-t">
              <button 
                @click="updateSWCI"
                class="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all"
              >Update SWCI Info</button>
            </div>
          </template>

          <!-- Edge Properties -->
          <template v-else-if="selectedElement?.source">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Dependency Type</label>
              <select 
                v-model="selectedElement.data.type"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all appearance-none"
              >
                <option value="REST_CALL">REST Call</option>
                <option value="GRPC">gRPC</option>
                <option value="PUBSUB">Pub/Sub</option>
                <option value="JDBC">JDBC Connection</option>
                <option value="SOAP">SOAP Call</option>
              </select>
            </div>
          </template>

          <!-- Note Properties -->
          <template v-else-if="selectedElement?.type === 'note'">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Background Color</label>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="color in ['#fef3c7', '#dbeafe', '#fce7f3', '#d1fae5', '#f3f4f6', '#fee2e2']"
                  :key="color"
                  @click="selectedElement.data.color = color; updateNoteNode()"
                  class="w-8 h-8 rounded-lg border-2 transition-all"
                  :class="{ 'border-slate-900': selectedElement.data.color === color, 'border-transparent': selectedElement.data.color !== color }"
                  :style="{ backgroundColor: color }"
                />
              </div>
            </div>

            <div class="pt-4 border-t space-y-3">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Size</label>
              <div class="flex gap-3">
                <div class="flex-1">
                  <label class="block text-[10px] text-slate-400 mb-1">Width</label>
                  <input 
                    type="number" 
                    v-model.number="selectedElement.style.width" 
                    @input="updateNoteNode"
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-amber-100"
                    min="150"
                    max="800"
                  />
                </div>
                <div class="flex-1">
                  <label class="block text-[10px] text-slate-400 mb-1">Height</label>
                  <input 
                    type="number" 
                    v-model.number="selectedElement.style.height" 
                    @input="updateNoteNode"
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-amber-100"
                    min="100"
                    max="600"
                  />
                </div>
              </div>
            </div>

            <div class="pt-4 border-t">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Font Size</label>
              <div class="flex items-center gap-3">
                <input
                  type="range"
                  v-model.number="selectedElement.data.fontSize"
                  @input="updateNoteNode"
                  min="10"
                  max="24"
                  step="1"
                  class="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span class="text-sm font-bold text-slate-600 w-12 text-center">{{ selectedElement.data.fontSize || 14 }}px</span>
              </div>
            </div>

            <div class="pt-4 border-t">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Note Content (Markdown)</label>
              <textarea 
                v-model="selectedElement.data.content" 
                @input="updateNoteNode"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-300 transition-all resize-none"
                rows="10"
                placeholder="# Title&#10;&#10;- Item 1&#10;- Item 2&#10;&#10;**Bold text**"
              />
              <p class="text-[10px] text-slate-400 mt-1">Supports Markdown formatting</p>
            </div>

            <div class="pt-4">
              <button 
                @click="deleteNode(selectedElement.id); selectedElement = null"
                class="w-full py-3 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
              >
                <span class="material-symbols-outlined text-sm">delete</span>
                Delete Note
              </button>
            </div>
          </template>
        </div>
      </aside>
    </div>

    <!-- ── Modals ─────────────────────────── -->
    <!-- Create SWCI Modal -->
    <div v-if="showCreateSWCI" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 class="text-2xl font-black text-slate-900 mb-2">New SWCI</h2>
        <p class="text-sm text-slate-500 mb-6">Create a shared component for the organization.</p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Name</label>
            <input v-model="newSWCI.name" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Type</label>
            <select v-model="newSWCI.typeId" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all">
              <option v-for="t in productStore.configItemTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button @click="showCreateSWCI = false" class="flex-1 py-3 font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
          <button @click="handleCreateSWCI" :disabled="!newSWCI.name || !newSWCI.typeId" class="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 transition-all">Create Component</button>
        </div>
      </div>
    </div>

    <!-- Reusable Confirmation Modal for Exit -->
    <ConfirmationModal
      :show="showExitModal"
      title="Unsaved Changes"
      message="You have unsaved changes in your diagram. Do you want to save them before leaving?"
      confirmText="Save and Exit"
      rejectText="Discard and Exit"
      @confirm="confirmExit(true)"
      @reject="confirmExit(false)"
    />

    <!-- New Diagram Modal -->
    <div v-if="showNewDiagramModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 class="text-2xl font-black text-slate-900 mb-2">New Diagram</h2>
        <p class="text-sm text-slate-500 mb-6">Create a new diagram for this product.</p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Diagram Name</label>
            <input 
              v-model="newDiagramName" 
              @keyup.enter="createNewDiagram"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all" 
              placeholder="Enter diagram name..."
            />
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button @click="showNewDiagramModal = false" class="flex-1 py-3 font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
          <button @click="createNewDiagram" :disabled="!newDiagramName.trim()" class="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 transition-all">Create Diagram</button>
        </div>
      </div>
    </div>

    <!-- Delete Diagram Confirmation Modal -->
    <ConfirmationModal
      :show="showDeleteDiagramModal"
      title="Delete Diagram"
      :message="`Are you sure you want to delete the diagram '${diagrams.find(d => d.id === diagramToDelete)?.name}'? This action cannot be undone.`"
      confirmText="Delete"
      rejectText="Cancel"
      @confirm="deleteDiagram"
      @reject="showDeleteDiagramModal = false; diagramToDelete = null"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, markRaw, reactive, onUnmounted } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { VueFlow, useVueFlow, ConnectionMode, type Node, type Edge, type Connection } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { toPng } from 'html-to-image';
import { marked } from 'marked';
import { useProductStore } from '../stores/products';
import { useRegistryStore } from '../stores/registry';
import SWCINode from '../components/designer/SWCINode.vue';
import NoteNode from '../components/designer/NoteNode.vue';
import DiagramToolbar from '../components/designer/DiagramToolbar.vue';
import ConfirmationModal from '../components/ConfirmationModal.vue';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true
});

// --- Flow Components ---
const nodeTypes = {
  swci: markRaw(SWCINode),
  note: markRaw(NoteNode),
};

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const registryStore = useRegistryStore();
const vueFlow = useVueFlow();
const { addNodes, addEdges, toObject, fromObject, setViewport, getViewport } = vueFlow;

// Diagram management
interface Diagram {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
}



const productId = route.params.id as string;
const product = ref<any>(null);
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle');
const swciSearch = ref('');
const showCreateSWCI = ref(false);
const selectedElement = ref<any>(null);
const snapToGrid = ref(true);

// Diagram toolbar
const canvasRef = ref<HTMLElement | null>(null);
const isLocked = ref(false);
const currentZoom = ref(1);
const isExporting = ref(false);

// Unsaved changes state
const isDirty = ref(false);
const showExitModal = ref(false);
let nextRoute: any = null;

// Multiple diagrams state
const diagrams = ref<Diagram[]>([]);
const activeDiagramId = ref<string>('');
const showNewDiagramModal = ref(false);
const newDiagramName = ref('');
const diagramToDelete = ref<string | null>(null);
const showDeleteDiagramModal = ref(false);

const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);

// Computed
const activeDiagram = computed(() => 
  diagrams.value.find(d => d.id === activeDiagramId.value)
);

const canDeleteActiveDiagram = computed(() => 
  activeDiagramId.value !== 'main'
);

const expandedGroups = ref<Record<string, boolean>>({});

const newSWCI = reactive({
  name: '',
  typeId: ''
});

const editForm = reactive({
  id: '',
  name: '',
  description: '',
  typeId: '',
  apiVersionId: null as string | null,
  selectedApiId: '',
  properties: {} as Record<string, any>
});

const defaultEdgeOptions = {
  style: { stroke: '#6366f1', strokeWidth: 2.5 },
  animated: false,
  markerEnd: 'arrowclosed',
};

// --- Computed ---
const groupedSWCIs = computed(() => {
  const query = swciSearch.value.toLowerCase();
  const items = productStore.swcis.filter(s => s.name.toLowerCase().includes(query));
  const groups: Record<string, { typeName: string, icon: string, items: any[] }> = {};
  items.forEach(item => {
    const typeName = item.type?.name || 'Uncategorized';
    if (!groups[typeName]) {
      groups[typeName] = {
        typeName,
        icon: item.type?.icon || 'settings_input_component',
        items: []
      };
    }
    groups[typeName].items.push(item);
  });
  const sortedGroupKeys = Object.keys(groups).sort();
  return sortedGroupKeys.map(key => {
    groups[key].items.sort((a, b) => a.name.localeCompare(b.name));
    return groups[key];
  });
});

const isApiType = computed(() => {
  const type = productStore.configItemTypes.find(t => t.id === editForm.typeId);
  return type?.name === 'API' || type?.name === 'MICROSERVICE';
});

const selectedTypeSpecs = computed(() => {
  const type = productStore.configItemTypes.find(t => t.id === editForm.typeId);
  return type?.specifications || [];
});

const selectedApiVersions = computed(() => {
  if (!editForm.selectedApiId) return [];
  const api = registryStore.apis.find(a => a.id === editForm.selectedApiId);
  return api?.versions || [];
});

// --- Diagram Management ---
const loadDiagram = (diagramId: string) => {
  // Load the target diagram first
  const diagram = diagrams.value.find(d => d.id === diagramId);
  if (!diagram) return;
  
  // Save current diagram state before switching
  if (activeDiagramId.value && activeDiagramId.value !== diagramId) {
    const currentDiagram = diagrams.value.find(d => d.id === activeDiagramId.value);
    if (currentDiagram) {
      currentDiagram.nodes = [...nodes.value];
      currentDiagram.edges = [...edges.value];
      // Save current viewport
      const currentViewport = getViewport();
      currentDiagram.viewport = { ...currentViewport };
    }
  }
  
  // Load new diagram
  activeDiagramId.value = diagramId;
  nodes.value = [...diagram.nodes];
  edges.value = [...diagram.edges];
  selectedElement.value = null;
  
  // Restore viewport if exists, otherwise fit view
  if (diagram.viewport) {
    setViewport(diagram.viewport);
    currentZoom.value = diagram.viewport.zoom;
  } else {
    setViewport({ x: 0, y: 0, zoom: 1 });
    currentZoom.value = 1;
  }
};

const onViewportChange = (viewport: { x: number; y: number; zoom: number }) => {
  currentZoom.value = viewport.zoom;
  if (activeDiagramId.value) {
    const currentDiagram = diagrams.value.find(d => d.id === activeDiagramId.value);
    if (currentDiagram) {
      currentDiagram.viewport = { ...viewport };
    }
  }
};

const createNewDiagram = async () => {
  if (!newDiagramName.value.trim()) return;
  
  try {
    // Create diagram via API
    const newDiagramData = await productStore.createDiagram(productId, {
      name: newDiagramName.value.trim(),
      design: { nodes: [], edges: [] },
      isMain: false
    });
    
    const newDiagram: Diagram = {
      id: newDiagramData.id,
      name: newDiagramData.name,
      nodes: [],
      edges: []
    };
    
    diagrams.value.push(newDiagram);
    newDiagramName.value = '';
    showNewDiagramModal.value = false;
    loadDiagram(newDiagram.id);
  } catch (err) {
    console.error('Failed to create diagram:', err);
    alert('Failed to create diagram');
  }
};

const confirmDeleteDiagram = (diagramId: string) => {
  const diagram = diagrams.value.find(d => d.id === diagramId);
  if (diagram && diagram.name === 'Main') return; // Cannot delete main diagram
  diagramToDelete.value = diagramId;
  showDeleteDiagramModal.value = true;
};

const deleteDiagram = async () => {
  if (!diagramToDelete.value) return;
  
  try {
    // Find the diagram to check if it's the main one
    const diagramToRemove = diagrams.value.find(d => d.id === diagramToDelete.value);
    if (!diagramToRemove) return;
    
    // Delete via API
    await productStore.deleteDiagram(diagramToDelete.value);
    
    const index = diagrams.value.findIndex(d => d.id === diagramToDelete.value);
    if (index > -1) {
      diagrams.value.splice(index, 1);
      
      // If we deleted the active diagram, switch to the main diagram
      if (activeDiagramId.value === diagramToDelete.value) {
        const mainDiagram = diagrams.value.find(d => d.name === 'Main');
        if (mainDiagram) {
          loadDiagram(mainDiagram.id);
        } else if (diagrams.value.length > 0) {
          loadDiagram(diagrams.value[0].id);
        }
      }
    }
    
    diagramToDelete.value = null;
    showDeleteDiagramModal.value = false;
  } catch (err: any) {
    console.error('Failed to delete diagram:', err);
    alert(err.message || 'Failed to delete diagram');
    diagramToDelete.value = null;
    showDeleteDiagramModal.value = false;
  }
};

const openNewDiagramModal = () => {
  newDiagramName.value = '';
  showNewDiagramModal.value = true;
};

// --- Lifecycle & Guards ---
onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  try {
    product.value = await productStore.getProduct(productId);
    await productStore.fetchSWCIs(product.value.organizationId);
    await productStore.fetchConfigItemTypes();
    await registryStore.fetchApis();
    productStore.configItemTypes.forEach(t => expandedGroups.value[t.name] = false);
    
    // Load diagrams from API
    const apiDiagrams = await productStore.getDiagrams(productId);
    
    if (apiDiagrams && apiDiagrams.length > 0) {
      // Load existing diagrams from API
      diagrams.value = apiDiagrams.map((d: any) => ({
        id: d.id,
        name: d.name,
        nodes: d.design?.nodes || [],
        edges: d.design?.edges || [],
        viewport: d.design?.viewport
      }));
      
      // Find and load main diagram
      const mainDiagram = apiDiagrams.find((d: any) => d.isMain);
      if (mainDiagram) {
        activeDiagramId.value = mainDiagram.id;
        nodes.value = [...(mainDiagram.design?.nodes || [])];
        edges.value = [...(mainDiagram.design?.edges || [])];
        // Restore viewport after nodes are loaded
        if (mainDiagram.design?.viewport) {
          setTimeout(() => {
            setViewport(mainDiagram.design.viewport);
          }, 100);
        }
      } else {
        // Fallback to first diagram
        activeDiagramId.value = apiDiagrams[0].id;
        nodes.value = [...(apiDiagrams[0].design?.nodes || [])];
        edges.value = [...(apiDiagrams[0].design?.edges || [])];
        // Restore viewport after nodes are loaded
        if (apiDiagrams[0].design?.viewport) {
          setTimeout(() => {
            setViewport(apiDiagrams[0].design.viewport);
          }, 100);
        }
      }
    } else {
      // No diagrams exist - the API should have created a main diagram
      // but if not, we'll wait for it
      console.log('No diagrams found, waiting for main diagram creation');
      diagrams.value = [];
    }
    
    // Set dirty false after initial load
    setTimeout(() => { isDirty.value = false; }, 500);
  } catch (err) {
    console.error('Initialization error', err);
  }
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (isDirty.value) {
    event.preventDefault();
    event.returnValue = ''; // Standard for modern browsers
  }
};

onBeforeRouteLeave((to, _from, next) => {
  if (isDirty.value) {
    nextRoute = to;
    showExitModal.value = true;
    next(false); // Cancel initial navigation
  } else {
    next();
  }
});

// --- Methods ---
const onNodesChange = () => { 
  isDirty.value = true;
  // Update active diagram nodes
  if (activeDiagramId.value) {
    const currentDiagram = diagrams.value.find(d => d.id === activeDiagramId.value);
    if (currentDiagram) {
      currentDiagram.nodes = [...nodes.value];
    }
  }
};

const onEdgesChange = () => { 
  isDirty.value = true;
  // Update active diagram edges
  if (activeDiagramId.value) {
    const currentDiagram = diagrams.value.find(d => d.id === activeDiagramId.value);
    if (currentDiagram) {
      currentDiagram.edges = [...edges.value];
    }
  }
};

const confirmExit = async (shouldSave: boolean) => {
  showExitModal.value = false;
  if (shouldSave) {
    await onSave();
  }
  isDirty.value = false;
  if (nextRoute) {
    router.push(nextRoute);
  }
};

const handleBack = () => {
  router.push(`/organizations/${product.value?.organizationId || ''}/products`);
};

const toggleGroup = (typeName: string) => {
  expandedGroups.value[typeName] = !expandedGroups.value[typeName];
};

const onDragStart = (event: DragEvent, swci: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify(swci));
    event.dataTransfer.effectAllowed = 'move';
  }
};

const onDrop = (event: DragEvent) => {
  const data = event.dataTransfer?.getData('application/vueflow');
  if (!data) return;
  const swci = JSON.parse(data);
  const position = { x: event.clientX - 300, y: event.clientY - 140 }; // Adjusted for tabs bar
  const newNode: Node = {
    id: `node-${Date.now()}`,
    type: 'swci',
    position,
    label: swci.name,
    data: { 
      swciId: swci.id,
      name: swci.name,
      type: swci.type?.name,
      icon: swci.type?.icon,
      description: swci.description
    },
  };
  addNodes([newNode]);
  isDirty.value = true;
  // Update active diagram nodes
  if (activeDiagramId.value) {
    const currentDiagram = diagrams.value.find(d => d.id === activeDiagramId.value);
    if (currentDiagram) {
      setTimeout(() => {
        currentDiagram.nodes = [...nodes.value];
      }, 0);
    }
  }
};

const onConnect = (params: Connection) => {
  const newEdge: Edge = {
    ...params,
    id: `edge-${Date.now()}`,
    data: { type: 'REST_CALL' }
  };
  addEdges([newEdge]);
  isDirty.value = true;
  // Update active diagram edges
  if (activeDiagramId.value) {
    const currentDiagram = diagrams.value.find(d => d.id === activeDiagramId.value);
    if (currentDiagram) {
      setTimeout(() => {
        currentDiagram.edges = [...edges.value];
      }, 0);
    }
  }
};

const onNodeClick = ({ node }: { node: Node }) => {
  selectedElement.value = node;
  const swci = productStore.swcis.find(s => s.id === node.data.swciId);
  if (swci) {
    editForm.id = swci.id;
    editForm.name = swci.name;
    editForm.description = swci.description || '';
    editForm.typeId = swci.typeId;
    editForm.apiVersionId = swci.apiVersionId || null;
    editForm.selectedApiId = swci.apiVersion?.apiId || '';
    const props: Record<string, any> = {};
    swci.properties?.forEach(p => {
      const spec = swci.type?.specifications?.find(s => s.id === p.specificationId);
      if (spec?.dataType === 'boolean') props[p.specificationId] = p.value === 'true';
      else if (spec?.dataType === 'integer') props[p.specificationId] = parseInt(p.value);
      else props[p.specificationId] = p.value;
    });
    editForm.properties = props;
  }
};

const onApiChange = () => {
  editForm.apiVersionId = null;
};

const onEdgeClick = ({ edge }: { edge: Edge }) => {
  selectedElement.value = edge;
};

const onPaneClick = () => {
  selectedElement.value = null;
};

const updateSWCI = async () => {
  if (!editForm.id) return;
  try {
    const propsToSave = Object.entries(editForm.properties).map(([specId, val]) => ({
      specificationId: specId,
      value: String(val)
    }));
    const updated = await productStore.updateSWCI(editForm.id, {
      name: editForm.name,
      description: editForm.description,
      typeId: editForm.typeId,
      apiVersionId: editForm.apiVersionId,
      properties: propsToSave
    });
    nodes.value = nodes.value.map(n => {
      if (n.data.swciId === editForm.id) {
        return {
          ...n,
          data: { ...n.data, name: updated.name, type: updated.type?.name, icon: updated.type?.icon, description: updated.description },
          label: updated.name
        };
      }
      return n;
    });
    selectedElement.value = null;
    isDirty.value = true;
    // Update active diagram nodes
    if (activeDiagramId.value) {
      const currentDiagram = diagrams.value.find(d => d.id === activeDiagramId.value);
      if (currentDiagram) {
        currentDiagram.nodes = [...nodes.value];
      }
    }
  } catch (err) {
    alert('Failed to update SWCI');
  }
};

const openCreateSWCI = () => {
  newSWCI.name = '';
  newSWCI.typeId = productStore.configItemTypes[0]?.id || '';
  showCreateSWCI.value = true;
};


const exportToPng = async () => {
  const flowEl = canvasRef.value?.querySelector('.vue-flow') as HTMLElement | null;
  if (!flowEl) return;
  isExporting.value = true;
  try {
    const dataUrl = await toPng(flowEl, {
      backgroundColor: '#faf9fe',
      pixelRatio: 2,
    });
    const link = document.createElement('a');
    link.download = `${product.value?.name ?? 'diagram'}-${activeDiagram.value?.name ?? 'main'}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Export PNG failed', err);
  } finally {
    isExporting.value = false;
  }
};

// --- Note Methods ---
const addNote = () => {
  const newNode: Node = {
    id: `note-${Date.now()}`,
    type: 'note',
    position: { x: 200, y: 200 },
    data: {
      content: '# New Note\n\nClick to edit',
      color: '#fef3c7',
      fontSize: 14
    },
    style: {
      width: '250px',
      height: '150px'
    }
  };
  addNodes([newNode]);
  selectedElement.value = newNode;
  isDirty.value = true;
};

const updateNoteNode = () => {
  // Force update the node to trigger re-render
  if (selectedElement.value && selectedElement.value.type === 'note') {
    const nodeIndex = nodes.value.findIndex(n => n.id === selectedElement.value.id);
    if (nodeIndex > -1) {
      nodes.value[nodeIndex] = { ...nodes.value[nodeIndex] };
    }
  }
  isDirty.value = true;
};

const deleteNode = (nodeId: string) => {
  const index = nodes.value.findIndex(n => n.id === nodeId);
  if (index > -1) {
    nodes.value.splice(index, 1);
    isDirty.value = true;
  }
};

const onNoteResize = (nodeId: string, width: number, height: number) => {
  const nodeIndex = nodes.value.findIndex(n => n.id === nodeId);
  if (nodeIndex > -1) {
    nodes.value[nodeIndex] = {
      ...nodes.value[nodeIndex],
      style: {
        ...nodes.value[nodeIndex].style,
        width: `${width}px`,
        height: `${height}px`
      }
    };
    isDirty.value = true;
  }
};

const renderMarkdown = (content: string): string => {
  try {
    return marked.parse(content) as string;
  } catch (e) {
    return content;
  }
};

const handleCreateSWCI = async () => {
  if (!product.value) return;
  try {
    await productStore.createSWCI(product.value.organizationId, {
      name: newSWCI.name,
      typeId: newSWCI.typeId
    });
    showCreateSWCI.value = false;
  } catch (err) {
    alert('Failed to create SWCI');
  }
};

const onSave = async () => {
  saveStatus.value = 'saving';
  try {
    // Save current diagram state first
    if (activeDiagramId.value) {
      const currentDiagram = diagrams.value.find(d => d.id === activeDiagramId.value);
      if (currentDiagram) {
        currentDiagram.nodes = [...nodes.value];
        currentDiagram.edges = [...edges.value];
        
        // Save current viewport
        const currentViewport = getViewport();
        currentDiagram.viewport = { ...currentViewport };
        
        // Save to API using the diagram ID
        await productStore.updateDiagram(activeDiagramId.value, {
          name: currentDiagram.name,
          design: {
            nodes: currentDiagram.nodes,
            edges: currentDiagram.edges,
            viewport: currentDiagram.viewport
          }
        });
      }
    }
    
    saveStatus.value = 'saved';
    isDirty.value = false;
    setTimeout(() => { saveStatus.value = 'idle'; }, 2000);
  } catch (err) {
    console.error('Failed to save diagram:', err);
    saveStatus.value = 'idle';
    alert('Failed to save diagram');
  }
};

const goBack = () => {
  handleBack();
};

</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.vue-flow__node-swci {
  padding: 0;
  border: none;
  background: transparent;
}

.vue-flow__edge.selected .vue-flow__edge-path {
  stroke: #4338ca !important;
  stroke-width: 4px !important;
}

</style>
