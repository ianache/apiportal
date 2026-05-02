<template>
  <div class="fixed inset-0 flex flex-col" style="font-family: 'Inter', sans-serif; background: #faf9fe;">

    <!-- ── Toolbar ─────────────────────────────────────── -->
    <header class="flex items-center justify-between px-4 flex-shrink-0 z-20"
      style="height:48px;background:#ffffff;border-bottom:1px solid #e3e2e7;">

      <!-- Left -->
      <div class="flex items-center gap-3">
        <button @click="router.push('/domains')"
          class="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60"
          style="color:#414755;">
          <span class="material-symbols-outlined" style="font-size:18px;">arrow_back</span>Domains
        </button>
        <span style="color:#e3e2e7;">|</span>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined" style="font-size:18px;color:#7c3aed;">account_tree</span>
          <span class="text-sm font-semibold" style="color:#1a1b1f;">
            Concept Modeler - {{ domainTitle }}
          </span>
        </div>
      </div>

      <!-- Center -->
      <div class="flex items-center gap-2">
        <!-- Zoom Level Display -->
        <span class="text-xs font-medium px-2 py-1 rounded-lg" style="background:#f4f3f8;color:#414755;min-width:50px;text-align:center;">
          {{ Math.round(zoomLevel * 100) }}%
        </span>
        
        <!-- Toggle Multiplicity & Roles -->
        <button @click="toggleLabelsVisibility"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
          :style="showLabels ? 'background:#e0e7ff;color:#0058bc;' : 'background:#f4f3f8;color:#717786;'"
          :title="showLabels ? 'Hide multiplicity and roles' : 'Show multiplicity and roles'">
          <span class="material-symbols-outlined" style="font-size:18px;">{{ showLabels ? 'label' : 'label_off' }}</span>
          <span class="hidden sm:inline">{{ showLabels ? 'Labels' : 'Labels' }}</span>
        </button>
        
        <button @click="addConceptNode"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
          style="background:#f4f3f8;color:#1a1b1f;"
          title="Add New Concept">
          <span class="material-symbols-outlined" style="font-size:18px;color:#7c3aed;">add_circle</span>
          <span class="hidden sm:inline">Concept</span>
        </button>
        <button @click="addSubModel"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
          style="background:#f4f3f8;color:#1a1b1f;"
          title="Add Sub Model">
          <span class="material-symbols-outlined" style="font-size:18px;color:#059669;">account_tree</span>
          <span class="hidden sm:inline">Sub Model</span>
        </button>
        <button @click="openAIChat"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
          style="background:linear-gradient(135deg, #7c3aed 0%, #0058bc 100%);color:#ffffff;"
          title="AI Assist - Chat with AI Designer">
          <span class="material-symbols-outlined" style="font-size:18px;">auto_awesome</span>
          <span class="hidden sm:inline">AI Assist</span>
        </button>
        <button @click="exportDesign"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
          style="background:#f4f3f8;color:#1a1b1f;"
          title="Export Design">
          <span class="material-symbols-outlined" style="font-size:18px;color:#059669;">file_export</span>
          <span class="hidden sm:inline">Export</span>
        </button>
      </div>

      <!-- Right -->
      <div class="flex items-center gap-3">
        <span v-if="saveStatus === 'saving'" class="flex items-center gap-1 text-xs font-medium" style="color:#a0a7b5;">
          <span class="material-symbols-outlined" style="font-size:14px;">progress_activity</span>Saving…
        </span>
        <span v-else-if="saveStatus === 'saved'" class="flex items-center gap-1 text-xs font-medium" style="color:#047857;">
          <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span>Saved
        </span>

        <button @click="saveFlow" :disabled="saveStatus === 'saving'"
          class="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
          style="background:#0058bc;color:#ffffff;">
          <span class="material-symbols-outlined" style="font-size:16px;">save</span>Save
        </button>
      </div>
    </header>

    <!-- ── Main Area ───────────────────────────────────── -->
    <div class="flex-1 flex overflow-hidden">

      <!-- Canvas -->
      <div ref="canvasContainer" class="flex-1 relative" style="background:#f4f3f8;">
        <div class="absolute inset-0">
          <VueFlow
            v-model:nodes="nodes"
            v-model:edges="edges"
            :default-viewport="{ x: 0, y: 0, zoom: zoomLevel }"
            :min-zoom="0.1"
            :max-zoom="2"
            :snap-to-grid="snapToGrid"
            :snap-grid="[16, 16]"
            :fit-view-on-init="false"
            :edges-updatable="true"
            :edges-focusable="true"
            :nodes-connectable="!isLocked"
            :nodes-draggable="!isLocked"
            :elements-selectable="!isLocked"
            @node-click="onNodeClick"
            @edge-click="onEdgeClick"
            @pane-click="onPaneClick"
            @connect="handleConnect"
            @edge-update="handleEdgeUpdate"
            @viewport-change="(viewport: any) => handleZoomChange(viewport.zoom)"
          >
            <Background pattern-color="#d9d8e8" :gap="16" />

            <template #node-concept="props">
              <div class="concept-node" :class="{ 'concept-node--selected': props.selected }">
                <Handle :id="`target-top-${props.id}`" type="target" :position="PositionEnum.Top" :connectable="true" style="background: #7c3aed; border: 2px solid #fff;" class="node-handle handle-top" />
                <Handle :id="`source-top-${props.id}`" type="source" :position="PositionEnum.Top" :connectable="true" style="background: #7c3aed; border: 2px solid #fff;" class="node-handle handle-top" />
                <Handle :id="`target-right-${props.id}`" type="target" :position="PositionEnum.Right" :connectable="true" style="background: #7c3aed; border: 2px solid #fff;" class="node-handle handle-right" />
                <Handle :id="`source-right-${props.id}`" type="source" :position="PositionEnum.Right" :connectable="true" style="background: #7c3aed; border: 2px solid #fff;" class="node-handle handle-right" />
                <Handle :id="`target-bottom-${props.id}`" type="target" :position="PositionEnum.Bottom" :connectable="true" style="background: #7c3aed; border: 2px solid #fff;" class="node-handle handle-bottom" />
                <Handle :id="`source-bottom-${props.id}`" type="source" :position="PositionEnum.Bottom" :connectable="true" style="background: #7c3aed; border: 2px solid #fff;" class="node-handle handle-bottom" />
                <Handle :id="`target-left-${props.id}`" type="target" :position="PositionEnum.Left" :connectable="true" style="background: #7c3aed; border: 2px solid #fff;" class="node-handle handle-left" />
                <Handle :id="`source-left-${props.id}`" type="source" :position="PositionEnum.Left" :connectable="true" style="background: #7c3aed; border: 2px solid #fff;" class="node-handle handle-left" />
                <span class="material-symbols-outlined" style="font-size:24px;color:#7c3aed;">category</span>
                <div class="concept-node__label">{{ props.data?.label || 'Concept' }}</div>
              </div>
            </template>

            <template #edge-relation="{ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }">
              <g class="edge-relation" :class="{ 'edge-selected': selectedItem?.type === 'edge' && selectedItem?.id === id }">
                <!-- Hitbox path for easier selection -->
                <path
                  :d="getEdgePath(data?.lineStyle || 'straight', sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition)"
                  fill="none"
                  stroke="transparent"
                  stroke-width="20"
                  @click.stop="selectEdgeById(id)"
                  style="cursor: pointer; pointer-events: stroke;"
                />
                <path
                  :d="getEdgePath(data?.lineStyle || 'straight', sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition)"
                  fill="none"
                  :stroke="selectedItem?.type === 'edge' && selectedItem?.id === id ? '#dc2626' : '#0058bc'"
                  :stroke-width="selectedItem?.type === 'edge' && selectedItem?.id === id ? '3' : '2'"
                  @click.stop="selectEdgeById(id)"
                  style="cursor: pointer; transition: stroke 0.2s ease, stroke-width 0.2s ease; pointer-events: stroke;"
                />
                <!-- Source role label -->
                <foreignObject v-if="showLabels && data?.sourceRole" 
                               :x="getLabelPosition(id, 'sourceRole', sourceX - 40, sourceY - 40).x" 
                               :y="getLabelPosition(id, 'sourceRole', sourceX - 40, sourceY - 40).y" 
                               width="80" height="20" 
                               style="z-index: 1000; pointer-events: all;"
                               @mousedown.prevent="(e) => startLabelDrag(e, id, 'sourceRole', sourceX - 40, sourceY - 40)">
                  <div class="edge-role draggable-label" 
                       :style="selectedItem?.type === 'edge' && selectedItem?.id === id 
                         ? 'background: #fee2e2; border: 1px solid #dc2626; border-radius: 4px; padding: 2px 6px; font-size: 9px; font-weight: bold; color: #dc2626; text-align: center; white-space: nowrap; cursor: move; user-select: none;' 
                         : 'background: #f4f3f8; border: 1px solid #0058bc; border-radius: 4px; padding: 2px 6px; font-size: 9px; font-weight: bold; color: #0058bc; text-align: center; white-space: nowrap; cursor: move; user-select: none;'"
                       @click.stop="selectEdgeById(id)">
                    {{ data.sourceRole }}
                  </div>
                </foreignObject>
                <!-- Target role label -->
                <foreignObject v-if="showLabels && data?.targetRole" 
                               :x="getLabelPosition(id, 'targetRole', targetX - 40, targetY - 40).x" 
                               :y="getLabelPosition(id, 'targetRole', targetX - 40, targetY - 40).y" 
                               width="80" height="20" 
                               style="z-index: 1000; pointer-events: all;"
                               @mousedown.prevent="(e) => startLabelDrag(e, id, 'targetRole', targetX - 40, targetY - 40)">
                  <div class="edge-role draggable-label" 
                       :style="selectedItem?.type === 'edge' && selectedItem?.id === id 
                         ? 'background: #fee2e2; border: 1px solid #dc2626; border-radius: 4px; padding: 2px 6px; font-size: 9px; font-weight: bold; color: #dc2626; text-align: center; white-space: nowrap; cursor: move; user-select: none;' 
                         : 'background: #f4f3f8; border: 1px solid #0058bc; border-radius: 4px; padding: 2px 6px; font-size: 9px; font-weight: bold; color: #0058bc; text-align: center; white-space: nowrap; cursor: move; user-select: none;'"
                       @click.stop="selectEdgeById(id)">
                    {{ data.targetRole }}
                  </div>
                </foreignObject>
                <!-- Source multiplicity -->
                <foreignObject v-if="showLabels && data?.sourceMultiplicity" 
                               :x="getLabelPosition(id, 'sourceMultiplicity', sourceX - 15, sourceY - 15).x" 
                               :y="getLabelPosition(id, 'sourceMultiplicity', sourceX - 15, sourceY - 15).y" 
                               width="30" height="20" 
                               style="z-index: 1000; pointer-events: all;"
                               @mousedown.prevent="(e) => startLabelDrag(e, id, 'sourceMultiplicity', sourceX - 15, sourceY - 15)">
                  <div class="edge-multiplicity draggable-label" 
                       :style="selectedItem?.type === 'edge' && selectedItem?.id === id 
                         ? 'background: #ffffff; border: 1px solid #dc2626; border-radius: 4px; padding: 2px 4px; font-size: 10px; font-weight: bold; color: #dc2626; text-align: center; cursor: move; user-select: none;' 
                         : 'background: #ffffff; border: 1px solid #0058bc; border-radius: 4px; padding: 2px 4px; font-size: 10px; font-weight: bold; color: #0058bc; text-align: center; cursor: move; user-select: none;'"
                       @click.stop="selectEdgeById(id)">
                    {{ data.sourceMultiplicity }}
                  </div>
                </foreignObject>
                <!-- Target multiplicity -->
                <foreignObject v-if="showLabels && data?.targetMultiplicity" 
                               :x="getLabelPosition(id, 'targetMultiplicity', targetX - 15, targetY - 15).x" 
                               :y="getLabelPosition(id, 'targetMultiplicity', targetX - 15, targetY - 15).y" 
                               width="30" height="20" 
                               style="z-index: 1000; pointer-events: all;"
                               @mousedown.prevent="(e) => startLabelDrag(e, id, 'targetMultiplicity', targetX - 15, targetY - 15)">
                  <div class="edge-multiplicity draggable-label" 
                       :style="selectedItem?.type === 'edge' && selectedItem?.id === id 
                         ? 'background: #ffffff; border: 1px solid #dc2626; border-radius: 4px; padding: 2px 4px; font-size: 10px; font-weight: bold; color: #dc2626; text-align: center; cursor: move; user-select: none;' 
                         : 'background: #ffffff; border: 1px solid #0058bc; border-radius: 4px; padding: 2px 4px; font-size: 10px; font-weight: bold; color: #0058bc; text-align: center; cursor: move; user-select: none;'"
                       @click.stop="selectEdgeById(id)">
                    {{ data.targetMultiplicity }}
                  </div>
                </foreignObject>
                <!-- Relation name in the middle -->
                <foreignObject v-if="data?.label" 
                               :x="getLabelPosition(id, 'relationName', (sourceX + targetX) / 2 - 50, (sourceY + targetY) / 2 - 15).x" 
                               :y="getLabelPosition(id, 'relationName', (sourceX + targetX) / 2 - 50, (sourceY + targetY) / 2 - 15).y" 
                               width="100" height="30" 
                               style="z-index: 1000; pointer-events: all;"
                               @mousedown.prevent="(e) => startLabelDrag(e, id, 'relationName', (sourceX + targetX) / 2 - 50, (sourceY + targetY) / 2 - 15)">
                  <div class="edge-relation-name draggable-label" 
                       :style="selectedItem?.type === 'edge' && selectedItem?.id === id 
                         ? 'background: #fee2e2; border: 1px solid #dc2626; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: bold; color: #dc2626; text-align: center; cursor: move; user-select: none;' 
                         : 'background: #ffffff; border: 1px solid #7c3aed; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: bold; color: #7c3aed; text-align: center; cursor: move; user-select: none;'"
                       @click.stop="selectEdgeById(id)">
                    {{ data.label }}
                  </div>
                </foreignObject>
              </g>
            </template>
          </VueFlow>
        </div>

        <!-- ── Diagram Toolbar ──────────────────────────── -->
        <DiagramToolbar
          :canvas-ref="canvasContainer"
          v-model:snap-to-grid="snapToGrid"
          v-model:is-locked="isLocked"
          @zoom-in="zoomIn()"
          @zoom-out="zoomOut()"
          @fit-view="fitView()"
        />
      </div>

      <!-- Properties Panel -->
      <aside 
        class="properties-panel border-l overflow-y-auto"
        :class="{ 'panel-open': selectedItem, 'panel-closed': !selectedItem }"
        style="background:#ffffff;border-color:#e3e2e7;"
      >
        <div v-if="selectedItem" class="p-4">
          <!-- Node Properties -->
          <template v-if="selectedItem.type === 'node'">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold" style="color:#1a1b1f;">Concept Properties</h3>
              <button @click="selectedItem = null" class="p-1 rounded-lg hover:bg-gray-100">
                <span class="material-symbols-outlined" style="font-size:18px;color:#717786;">close</span>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="panel-label">Name</label>
                <input v-model="nodeForm.label" class="panel-input" placeholder="Concept name" @change="updateNodeData" />
              </div>
              <div>
                <label class="panel-label">Description</label>
                <textarea v-model="nodeForm.description" class="panel-textarea" rows="3" placeholder="Describe this concept..." @change="updateNodeData" />
              </div>

              <!-- Attributes Section -->
              <div class="border-t pt-4 mt-4" style="border-color:#e3e2e7;">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-bold" style="color:#7c3aed;">
                    <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px;">database</span>
                    Attributes ({{ nodeForm.attributes.length }})
                  </h4>
                  <div class="flex gap-2">
                    <button @click="generateAttributesWithAI" 
                            :disabled="aiGenerating || !nodeForm.label"
                            class="px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50" 
                            style="background:linear-gradient(135deg, #7c3aed 0%, #0058bc 100%);color:#ffffff;"
                            title="Generate attributes with AI">
                      <span v-if="aiGenerating" class="material-symbols-outlined animate-spin" style="font-size:14px;vertical-align:middle;">progress_activity</span>
                      <span v-else class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;">auto_awesome</span>
                      AI
                    </button>
                    <button @click="showDataTypeManager = true" class="px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80" style="background:#f4f3f8;color:#059669;" title="Manage Data Types">
                      <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;">tune</span>
                    </button>
                    <button @click="startAddAttribute" class="px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80" style="background:#f4f3f8;color:#0058bc;">
                      <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;">add</span>
                      Add
                    </button>
                  </div>
                </div>

                <!-- Attribute Form -->
                <div v-if="showAttributeForm" class="bg-gray-50 rounded-lg p-3 mb-3 border" style="border-color:#e3e2e7;">
                  <div class="space-y-3">
                    <div>
                      <label class="panel-label">Attribute Name</label>
                      <input v-model="attributeForm.name" class="panel-input" placeholder="e.g. email, firstName" />
                    </div>
                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <label class="panel-label">Description</label>
                        <button 
                          v-if="attributeForm.name"
                          @click="generateAttributeDescription" 
                          :disabled="aiGenerating"
                          class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                          style="background:#f4f3f8;color:#0058bc;"
                        >
                          <span v-if="aiGenerating" class="material-symbols-outlined animate-spin" style="font-size:12px;">progress_activity</span>
                          <span v-else class="material-symbols-outlined" style="font-size:12px;">auto_awesome</span>
                          AI Assist
                        </button>
                      </div>
                      <textarea v-model="attributeForm.description" class="panel-textarea" rows="2" placeholder="Describe this attribute..." />
                    </div>
                    <div>
                      <label class="panel-label">Data Type</label>
                      <select v-model="attributeForm.dataTypeName" class="panel-select" @change="onDataTypeChange">
                        <option value="">Select data type...</option>
                        <option v-for="type in businessDataTypes" :key="type.name" :value="type.name">
                          {{ type.name }}
                        </option>
                        <option value="__custom__">+ Custom Type...</option>
                      </select>
                    </div>
                    <div v-if="attributeForm.dataTypeName === '__custom__' || isCustomDataType">
                      <label class="panel-label">Custom Type Name</label>
                      <input v-model="attributeForm.customDataTypeName" class="panel-input" placeholder="Enter custom type name" />
                    </div>
                    <div>
                      <label class="panel-label">Type Description</label>
                      <input v-model="attributeForm.dataTypeDescription" class="panel-input" placeholder="Description of the data type" />
                    </div>
                    <div class="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        v-model="attributeForm.mandatory" 
                        class="w-4 h-4 rounded border-gray-300"
                        style="accent-color:#0058bc;"
                      />
                      <label class="text-xs font-medium" style="color:#414755;">Mandatory</label>
                    </div>
                    <div class="flex gap-2 pt-2">
                      <button @click="saveAttribute" class="flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all hover:opacity-80" style="background:#0058bc;color:#ffffff;">
                        Save
                      </button>
                      <button @click="cancelAttributeForm" class="flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all hover:opacity-80 btn-secondary" style="background:#f4f3f8;color:#414755;">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Attributes List (Collapsible) -->
                <div v-if="nodeForm.attributes.length > 0" class="space-y-2">
                  <div 
                    v-for="attr in nodeForm.attributes" 
                    :key="attr.id"
                    class="rounded-lg border overflow-hidden transition-all"
                    :class="{ 'bg-gray-50': expandedAttributes.has(attr.id) }"
                    style="border-color:#e3e2e7;"
                  >
                    <!-- Collapsed Header -->
                    <div 
                      class="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      @click="toggleAttributeExpand(attr.id)"
                    >
                      <div class="flex items-center gap-2 flex-1 min-w-0">
                        <span class="material-symbols-outlined text-sm transition-transform" 
                          :style="expandedAttributes.has(attr.id) ? 'transform: rotate(90deg);' : ''"
                          style="color:#717786;">
                          chevron_right
                        </span>
                        <span class="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" 
                          :style="attr.mandatory ? 'background:#e0e7ff;color:#0058bc;' : 'background:#f4f3f8;color:#717786;'">
                          {{ attr.mandatory ? 'Required' : 'Optional' }}
                        </span>
                        <span class="font-medium text-sm truncate" style="color:#1a1b1f;">{{ attr.name }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500">{{ attr.dataType.name }}</span>
                        <button @click.stop="deleteAttribute(attr.id)" class="p-1 rounded hover:bg-red-100 transition-colors">
                          <span class="material-symbols-outlined" style="font-size:14px;color:#991b1b;">delete</span>
                        </button>
                      </div>
                    </div>
                    
                    <!-- Expanded Content -->
                    <div v-if="expandedAttributes.has(attr.id)" class="px-3 pb-3 border-t" style="border-color:#e3e2e7;">
                      <div class="space-y-3 pt-3">
                        <div>
                          <label class="panel-label">Name</label>
                          <input 
                            :value="attr.name" 
                            class="panel-input" 
                            @change="(e) => updateAttributeField(attr.id, 'name', (e.target as HTMLInputElement).value)"
                          />
                        </div>
                        <div>
                          <div class="flex items-center justify-between mb-1">
                            <label class="panel-label">Description</label>
                            <button 
                              @click="generateAttributeDescriptionForAttr(attr)"
                              :disabled="aiGenerating"
                              class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                              style="background:#f4f3f8;color:#0058bc;"
                            >
                              <span v-if="aiGenerating" class="material-symbols-outlined animate-spin" style="font-size:10px;">progress_activity</span>
                              <span v-else class="material-symbols-outlined" style="font-size:10px;">auto_awesome</span>
                              AI
                            </button>
                          </div>
                          <textarea 
                            :value="attr.description" 
                            class="panel-textarea" 
                            rows="2"
                            @change="(e) => updateAttributeField(attr.id, 'description', (e.target as HTMLTextAreaElement).value)"
                          />
                        </div>
                        <div>
                          <label class="panel-label">Data Type</label>
                          <select 
                            :value="attr.dataType.name" 
                            class="panel-select"
                            @change="(e) => updateAttributeDataType(attr.id, (e.target as HTMLSelectElement).value)"
                          >
                            <option v-for="type in businessDataTypes" :key="type.name" :value="type.name">
                              {{ type.name }}
                            </option>
                          </select>
                        </div>
                        <div class="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            :checked="attr.mandatory"
                            @change="(e) => updateAttributeField(attr.id, 'mandatory', (e.target as HTMLInputElement).checked)"
                            class="w-4 h-4 rounded border-gray-300"
                            style="accent-color:#0058bc;"
                          />
                          <label class="text-xs font-medium" style="color:#414755;">Mandatory</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-4 text-xs" style="color:#a0a7b5;">
                  No attributes defined
                </div>
              </div>

              <button @click="deleteSelected" class="btn-danger w-full mt-4">
                <span class="material-symbols-outlined" style="font-size:16px;">delete</span>Delete Concept
              </button>
            </div>
          </template>

          <!-- Edge Properties -->
          <template v-else-if="selectedItem.type === 'edge'">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold" style="color:#1a1b1f;">Relation Properties</h3>
              <button @click="selectedItem = null" class="p-1 rounded-lg hover:bg-gray-100">
                <span class="material-symbols-outlined" style="font-size:18px;color:#717786;">close</span>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="panel-label">Relation Name</label>
                <input v-model="edgeForm.label" class="panel-input" placeholder="e.g. has, owns, belongs to" @change="updateEdgeData" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="panel-label">Source Role</label>
                  <input v-model="edgeForm.sourceRole" class="panel-input" placeholder="e.g. owner, parent" @change="updateEdgeData" />
                </div>
                <div>
                  <label class="panel-label">Target Role</label>
                  <input v-model="edgeForm.targetRole" class="panel-input" placeholder="e.g. owned, child" @change="updateEdgeData" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="panel-label">Source Multiplicity</label>
                  <select v-model="edgeForm.sourceMultiplicity" class="panel-select" @change="updateEdgeData">
                    <option value="?">? (Opcional)</option>
                    <option value="1">1 (Uno - Mandatorio)</option>
                    <option value="0..*">0..* (Cero o más)</option>
                    <option value="1..*">1..* (Uno o más)</option>
                  </select>
                </div>
                <div>
                  <label class="panel-label">Target Multiplicity</label>
                  <select v-model="edgeForm.targetMultiplicity" class="panel-select" @change="updateEdgeData">
                    <option value="?">? (Opcional)</option>
                    <option value="1">1 (Uno - Mandatorio)</option>
                    <option value="0..*">0..* (Cero o más)</option>
                    <option value="1..*">1..* (Uno o más)</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="panel-label">
                  <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;margin-right:4px;">line_style</span>
                  Line Style
                </label>
                <select v-model="edgeForm.lineStyle" class="panel-select" @change="updateEdgeData">
                  <option value="straight">Straight Line</option>
                  <option value="step">Angular Connector</option>
                  <option value="bezier">Curved (Bezier)</option>
                </select>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="panel-label">Description</label>
                  <button 
                    v-if="edgeForm.label"
                    @click="generateRelationDescription" 
                    :disabled="aiGenerating"
                    class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                    style="background:#f4f3f8;color:#0058bc;"
                  >
                    <span v-if="aiGenerating" class="material-symbols-outlined animate-spin" style="font-size:12px;">progress_activity</span>
                    <span v-else class="material-symbols-outlined" style="font-size:12px;">auto_awesome</span>
                    AI
                  </button>
                </div>
                <textarea v-model="edgeForm.description" class="panel-textarea" rows="3" placeholder="Describe this relation..." @change="updateEdgeData" />
              </div>
              <button @click="deleteSelectedEdge" class="btn-danger w-full">
                <span class="material-symbols-outlined" style="font-size:16px;">delete</span>Delete Relation
              </button>
            </div>
          </template>
        </div>
      </aside>

    </div>

    <!-- AI Assist Chat Modal -->
    <div v-if="showAIChat" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5);">
      <div class="w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl" style="background: #ffffff;">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b" style="background: linear-gradient(135deg, #7c3aed 0%, #0058bc 100%); border-color: #e3e2e7;">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined" style="font-size:24px;color:#ffffff;">auto_awesome</span>
            <span class="text-lg font-bold" style="color:#ffffff;">AI Designer</span>
            <span class="text-xs px-2 py-0.5 rounded-full" style="background: rgba(255,255,255,0.2); color:#ffffff;">Powered by LLM</span>
          </div>
          <button @click="closeAIChat" class="p-1 rounded-lg hover:bg-white/20 transition-colors">
            <span class="material-symbols-outlined" style="font-size:24px;color:#ffffff;">close</span>
          </button>
        </div>

        <!-- Chat Messages -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4" style="background: #faf9fe;">
          <!-- Welcome Message -->
          <div v-if="aiMessages.length === 0" class="text-center py-8">
            <span class="material-symbols-outlined" style="font-size:48px;color:#7c3aed;">psychology</span>
            <h3 class="text-lg font-bold mt-2" style="color:#1a1b1f;">AI Designer Assistant</h3>
            <p class="text-sm mt-1" style="color:#717786;">
              Describe your domain concepts and relationships. I'll help you create a conceptual model.
              <br>Example: "Create a model for an e-commerce system with customers, orders, and products"
            </p>
          </div>

          <div v-for="(msg, idx) in aiMessages" :key="idx" 
               :class="['flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row']">
            <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                 :style="msg.role === 'user' ? 'background:#0058bc;' : 'background:linear-gradient(135deg, #7c3aed 0%, #0058bc 100%);'">
              <span class="material-symbols-outlined" style="font-size:16px;color:#ffffff;">
                {{ msg.role === 'user' ? 'person' : 'auto_awesome' }}
              </span>
            </div>
            <div :class="['max-w-[80%] px-4 py-3 rounded-2xl text-sm']"
                 :style="msg.role === 'user' 
                   ? 'background:#0058bc;color:#ffffff;border-bottom-right-radius:4px;' 
                   : 'background:#ffffff;color:#1a1b1f;border:1px solid #e3e2e7;border-bottom-left-radius:4px;'">
              <div v-if="msg.type === 'concepts'" class="space-y-3">
                <p class="mb-2">{{ msg.content }}</p>
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p class="font-semibold mb-2" style="color:#7c3aed;">Generated Concepts:</p>
                  <ul class="space-y-1">
                    <li v-for="(concept, cIdx) in msg.concepts" :key="cIdx" class="flex items-center gap-2 text-xs">
                      <span class="material-symbols-outlined" style="font-size:14px;color:#059669;">check_circle</span>
                      <span><strong>{{ concept.name }}</strong>: {{ concept.description }}</span>
                    </li>
                  </ul>
                </div>
                <button @click="applyAIConcepts(msg.concepts || [], msg.relations || [])"
                        class="w-full py-2 px-4 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                        style="background:linear-gradient(135deg, #059669 0%, #047857 100%);color:#ffffff;">
                  <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px;">add_circle</span>
                  Add to Model
                </button>
              </div>
              <div v-else>{{ msg.content }}</div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="aiLoading" class="flex gap-3">
            <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background:linear-gradient(135deg, #7c3aed 0%, #0058bc 100%);">
              <span class="material-symbols-outlined animate-spin" style="font-size:16px;color:#ffffff;">progress_activity</span>
            </div>
            <div class="px-4 py-3 rounded-2xl text-sm" style="background:#ffffff;color:#1a1b1f;border:1px solid #e3e2e7;border-bottom-left-radius:4px;">
              <span class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></span>
                <span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay:0.1s;"></span>
                <span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay:0.2s;"></span>
                <span class="ml-1">AI is thinking...</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Chat Input -->
        <div class="p-4 border-t" style="background:#ffffff;border-color:#e3e2e7;">
          <div class="flex gap-2">
            <textarea 
              v-model="aiInput" 
              @keydown.enter.prevent="sendAIMessage"
              placeholder="Describe your domain or ask for model generation..."
              class="flex-1 px-4 py-3 rounded-xl text-sm resize-none"
              style="background:#f4f3f8;color:#1a1b1f;border:1px solid #e3e2e7;min-height:60px;max-height:120px;"
              :disabled="aiLoading"
              rows="2"
            ></textarea>
            <button 
              @click="sendAIMessage" 
              :disabled="!aiInput.trim() || aiLoading"
              class="flex-shrink-0 px-4 py-2 rounded-xl font-bold transition-all hover:opacity-80 disabled:opacity-40"
              style="background:linear-gradient(135deg, #7c3aed 0%, #0058bc 100%);color:#ffffff;">
              <span class="material-symbols-outlined" style="font-size:20px;">send</span>
            </button>
          </div>
          <p class="text-xs mt-2" style="color:#717786;">
            <span class="material-symbols-outlined" style="font-size:12px;vertical-align:middle;">info</span>
            Current model context: {{ nodes.length }} concepts, {{ edges.length }} relations
          </p>
        </div>
      </div>
    </div>

    <!-- Data Type Manager Modal -->
    <div v-if="showDataTypeManager" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5);">
      <div class="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl" style="background: #ffffff;">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b" style="background: #059669; border-color: #e3e2e7;">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined" style="font-size:24px;color:#ffffff;">tune</span>
            <span class="text-lg font-bold" style="color:#ffffff;">Business Data Types</span>
          </div>
          <button @click="showDataTypeManager = false" class="p-1 rounded-lg hover:bg-white/20 transition-colors">
            <span class="material-symbols-outlined" style="font-size:24px;color:#ffffff;">close</span>
          </button>
        </div>

        <!-- Data Types List -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- Add/Edit Form -->
          <div class="bg-gray-50 rounded-lg p-3 mb-4 border" style="border-color:#e3e2e7;">
            <div class="space-y-3">
              <div>
                <label class="panel-label">Type Name</label>
                <input v-model="newDataTypeForm.name" class="panel-input" placeholder="e.g. TaxID, SerialNumber" />
              </div>
              <div>
                <label class="panel-label">Description</label>
                <input v-model="newDataTypeForm.description" class="panel-input" placeholder="Brief description of the type" />
              </div>
              <div class="flex gap-2">
                <button @click="saveDataType" class="flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all hover:opacity-80" style="background:#059669;color:#ffffff;">
                  {{ editingDataTypeIndex !== null ? 'Update' : 'Add' }} Type
                </button>
                <button v-if="editingDataTypeIndex !== null" @click="cancelEditDataType" class="px-3 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80" style="background:#f4f3f8;color:#414755;">
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <!-- Types List -->
          <div class="space-y-2">
            <div 
              v-for="(type, index) in businessDataTypes" 
              :key="type.name"
              class="p-3 rounded-lg border flex items-center justify-between"
              style="border-color:#e3e2e7;"
            >
              <div>
                <div class="font-medium text-sm" style="color:#1a1b1f;">{{ type.name }}</div>
                <div class="text-xs" style="color:#717786;">{{ type.description }}</div>
              </div>
              <div class="flex gap-1">
                <button @click="editDataType(index)" class="p-1.5 rounded hover:bg-blue-100 transition-colors">
                  <span class="material-symbols-outlined" style="font-size:16px;color:#0058bc;">edit</span>
                </button>
                <button @click="deleteDataType(index)" class="p-1.5 rounded hover:bg-red-100 transition-colors">
                  <span class="material-symbols-outlined" style="font-size:16px;color:#991b1b;">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 border-t" style="border-color:#e3e2e7;">
          <button @click="showDataTypeManager = false" class="w-full py-2 px-4 rounded-xl text-sm font-bold transition-all hover:opacity-80" style="background:#f4f3f8;color:#414755;">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VueFlow, useVueFlow, Handle, Position, getBezierPath as getVueFlowBezierPath } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import type { Node, Edge, Connection, NodeMouseEvent } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import { useDomainsStore } from '../stores/domains';
import { useLLMPreferencesStore } from '../stores/preferences';
import { useAuthStore } from '../stores/auth';
import DiagramToolbar from '../components/designer/DiagramToolbar.vue';

interface Attribute {
  id: string;
  name: string;
  description: string;
  dataType: {
    name: string;
    description: string;
  };
  mandatory: boolean;
}

interface ConceptNode {
  id: string;
  type: 'concept';
  position: { x: number; y: number };
  data: { 
    label: string; 
    description: string;
    attributes: Attribute[];
  };
}

interface RelationEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type: 'relation';
  updatable?: boolean;
  data: {
    label: string;
    description: string;
    sourceRole: string;
    targetRole: string;
    sourceMultiplicity: string;
    targetMultiplicity: string;
    lineStyle: 'straight' | 'step' | 'bezier';
    labelPositions?: {
      sourceRole?: { x: number; y: number };
      targetRole?: { x: number; y: number };
      sourceMultiplicity?: { x: number; y: number };
      targetMultiplicity?: { x: number; y: number };
      relationName?: { x: number; y: number };
    };
  };
}

const route = useRoute();
const router = useRouter();
const domainsStore = useDomainsStore();
const llmPrefs = useLLMPreferencesStore();
const auth = useAuthStore();

const domainId = computed(() => route.params.id as string);
const domainTitle = ref('');
const { addEdge, findNode, updateEdge, setViewport, zoomIn, zoomOut, fitView } = useVueFlow();
const isLocked = ref(false);

const nodes = ref<ConceptNode[]>([]);
const edges = ref<RelationEdge[]>([]);
const snapToGrid = ref(true);
const zoomLevel = ref(1);
const showLabels = ref(true);

// Expose Position for template
const PositionEnum = Position;
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle');
const selectedItem = ref<{ type: 'node'; id: string } | { type: 'edge'; id: string } | null>(null);
const aiGenerating = ref(false);

const nodeForm = reactive({ 
  label: '', 
  description: '',
  attributes: [] as Attribute[]
});

const attributeForm = reactive({
  id: '',
  name: '',
  description: '',
  dataTypeName: '',
  customDataTypeName: '',
  dataTypeDescription: '',
  mandatory: true
});

const editingAttributeId = ref<string | null>(null);
const showAttributeForm = ref(false);
const expandedAttributes = ref<Set<string>>(new Set());

// Predefined business data types
const businessDataTypes = ref([
  { name: 'String', description: 'Texto libre de longitud variable' },
  { name: 'Integer', description: 'Número entero' },
  { name: 'Decimal', description: 'Número decimal con precisión' },
  { name: 'Boolean', description: 'Valor verdadero/falso' },
  { name: 'Date', description: 'Fecha sin hora' },
  { name: 'DateTime', description: 'Fecha y hora' },
  { name: 'Time', description: 'Hora sin fecha' },
  { name: 'Email', description: 'Dirección de correo electrónico válida' },
  { name: 'Phone', description: 'Número de teléfono' },
  { name: 'Currency', description: 'Valor monetario' },
  { name: 'Percentage', description: 'Valor porcentual (0-100)' },
  { name: 'URL', description: 'Dirección web válida' },
  { name: 'UUID', description: 'Identificador único universal' },
  { name: 'Code', description: 'Código o identificador corto' },
  { name: 'Text', description: 'Texto largo o descripción' }
]);

const showDataTypeManager = ref(false);
const newDataTypeForm = reactive({
  name: '',
  description: ''
});
const editingDataTypeIndex = ref<number | null>(null);
const edgeForm = reactive({
  label: '',
  description: '',
  sourceRole: '',
  targetRole: '',
  sourceMultiplicity: '1',
  targetMultiplicity: '1',
  lineStyle: 'straight' as 'straight' | 'step' | 'bezier'
});

// AI Chat State
const showAIChat = ref(false);
const aiInput = ref('');
const aiLoading = ref(false);
interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'concepts';
  concepts?: Array<{ name: string; description: string; x?: number; y?: number }>;
  relations?: Array<{ source: string; target: string; label: string; sourceRole?: string; targetRole?: string; sourceMultiplicity?: string; targetMultiplicity?: string }>;
}
const aiMessages = ref<AIMessage[]>([]);

function openAIChat() {
  showAIChat.value = true;
}

function closeAIChat() {
  showAIChat.value = false;
}

function exportDesign() {
  const designData = {
    domain: domainTitle.value,
    nodes: nodes.value,
    edges: edges.value,
    viewport: { zoom: zoomLevel.value },
    exportedAt: new Date().toISOString()
  };
  
  const jsonData = JSON.stringify(designData, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `concept-model-${domainTitle.value.replace(/\s+/g, '-').toLowerCase() || 'export'}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

async function sendAIMessage() {
  if (!aiInput.value.trim() || aiLoading.value) return;
  
  const userMessage = aiInput.value.trim();
  aiInput.value = '';
  
  aiMessages.value.push({
    role: 'user',
    content: userMessage
  });
  
  aiLoading.value = true;
  
  try {
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    // Build complete context from current Concept Model (nodes and edges)
    const currentConcepts = nodes.value.map(n => ({
      name: n.data.label,
      description: n.data.description,
      attributes: n.data.attributes.map(a => ({
        name: a.name,
        description: a.description,
        dataType: a.dataType.name,
        mandatory: a.mandatory
      }))
    }));
    
    const currentRelations = edges.value.map(e => ({
      source: nodes.value.find(n => n.id === e.source)?.data.label || e.source,
      target: nodes.value.find(n => n.id === e.target)?.data.label || e.target,
      label: e.data.label,
      description: e.data.description,
      sourceRole: e.data.sourceRole,
      targetRole: e.data.targetRole,
      sourceMultiplicity: e.data.sourceMultiplicity,
      targetMultiplicity: e.data.targetMultiplicity
    }));
    
    const conceptsContext = currentConcepts.length > 0
      ? currentConcepts.map(c => {
          const attrsStr = c.attributes.length > 0
            ? `\n    Attributes: ${c.attributes.map(a => `${a.name} (${a.dataType}${a.mandatory ? ', required' : ', optional'}): ${a.description}`).join('; ')}`
            : '';
          return `- ${c.name}: ${c.description}${attrsStr}`;
        }).join('\n')
      : 'No concepts defined yet';
    
    const relationsContext = currentRelations.length > 0
      ? currentRelations.map(r => {
          const roles = [r.sourceRole, r.targetRole].filter(Boolean).join(' - ');
          return `- ${r.source} "${r.label}" ${r.target} [${r.sourceMultiplicity}..${r.targetMultiplicity}]${roles ? ` (${roles})` : ''}: ${r.description}`;
        }).join('\n')
      : 'No relations defined yet';
    
    const systemPrompt = `You are an expert Conceptual Data Model Designer. Your task is to help users create conceptual models by identifying entities (concepts), their attributes, and relationships.

## Concept Model Knowledge Base (Use this as context for all your responses):
${conceptsContext}

${relationsContext}

## Task:
Based on the Concept Model above, help the user generate new concepts, attributes, or relationships. You can also suggest modifications to existing elements.

## Response Format:
When generating new elements, respond with JSON in this format:
{
  "concepts": [
    { "name": "ConceptName", "description": "Brief description" }
  ],
  "relations": [
    { "source": "SourceConcept", "target": "TargetConcept", "label": "relationship name", "sourceRole": "role", "targetRole": "role", "sourceMultiplicity": "1", "targetMultiplicity": "0..*" }
  ],
  "explanation": "Brief explanation of the changes"
}

## Multiplicity Options:
- "?" (optional)
- "1" (mandatory)  
- "0..*" (zero or more)
- "1..*" (one or more)

## Important:
- Always validate that source and target concepts exist in the Concept Model or in the new concepts array
- Use the existing Concept Model as knowledge base to maintain consistency
- Attribute data types should be from: String, Integer, Decimal, Boolean, Date, DateTime, Time, Email, Phone, Currency, Percentage, URL, UUID, Code, Text`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...aiMessages.value.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];
    
    const res = await fetch(`${bffBase}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        provider: llmPrefs.provider,
        apiKey: llmPrefs.currentApiKey,
        customApiUrl: llmPrefs.apiUrl,
        model: llmPrefs.model,
        messages
      }),
    });
    
    if (res.ok) {
      const data = await res.json();
      let responseContent = data.content || '';
      
      // Try to parse JSON response
      let parsedResponse: any = null;
      try {
        // Look for JSON in the response
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.log('Response is not JSON, treating as text');
      }
      
      if (parsedResponse && parsedResponse.concepts) {
        aiMessages.value.push({
          role: 'assistant',
          content: parsedResponse.explanation || 'Here are the generated concepts and relations:',
          type: 'concepts',
          concepts: parsedResponse.concepts,
          relations: parsedResponse.relations || []
        });
      } else {
        aiMessages.value.push({
          role: 'assistant',
          content: responseContent,
          type: 'text'
        });
      }
    } else {
      throw new Error('Failed to get AI response');
    }
  } catch (e) {
    console.error('AI chat failed:', e);
    aiMessages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error processing your request. Please try again.',
      type: 'text'
    });
  } finally {
    aiLoading.value = false;
  }
}

function applyAIConcepts(newConcepts: Array<{ name: string; description: string }>, newRelations: Array<any>) {
  // Add new concepts
  const conceptMap = new Map<string, string>(); // name -> id
  
  newConcepts.forEach((concept, index) => {
    // Check if concept already exists
    const existing = nodes.value.find(n => n.data.label.toLowerCase() === concept.name.toLowerCase());
    if (!existing) {
      const id = `concept-${Date.now()}-${index}`;
      conceptMap.set(concept.name.toLowerCase(), id);
      
      const newNode: ConceptNode = {
        id,
        type: 'concept',
        position: { 
          x: 200 + Math.random() * 300, 
          y: 150 + Math.random() * 200 
        },
        data: { 
          label: concept.name, 
          description: concept.description || '',
          attributes: []
        }
      };
      nodes.value = [...nodes.value, newNode];
    } else {
      conceptMap.set(concept.name.toLowerCase(), existing.id);
    }
  });
  
  // Add new relations
  newRelations.forEach((rel, index) => {
    const sourceId = conceptMap.get(rel.source.toLowerCase()) || 
                     nodes.value.find(n => n.data.label.toLowerCase() === rel.source.toLowerCase())?.id;
    const targetId = conceptMap.get(rel.target.toLowerCase()) || 
                     nodes.value.find(n => n.data.label.toLowerCase() === rel.target.toLowerCase())?.id;
    
    if (sourceId && targetId && sourceId !== targetId) {
      // Check if relation already exists
      const existing = edges.value.find(e => 
        e.source === sourceId && e.target === targetId && e.data.label === rel.label
      );
      
      if (!existing) {
        const newEdge: RelationEdge = {
          id: `e-${Date.now()}-${index}`,
          source: sourceId,
          target: targetId,
          sourceHandle: null,
          targetHandle: null,
          type: 'relation',
          updatable: true,
          data: {
            label: rel.label || '',
            description: rel.description || '',
            sourceRole: rel.sourceRole || '',
            targetRole: rel.targetRole || '',
            sourceMultiplicity: rel.sourceMultiplicity || '1',
            targetMultiplicity: rel.targetMultiplicity || '0..*',
            lineStyle: rel.lineStyle || 'straight',
            labelPositions: {}
          }
        };
        edges.value = [...edges.value, newEdge];
      }
    }
  });
  
  // Add confirmation message
  aiMessages.value.push({
    role: 'assistant',
    content: `✅ Added ${newConcepts.length} concept(s) and ${newRelations.length} relation(s) to your model!`,
    type: 'text'
  });
}

function addSubModel() {
  // Placeholder for sub-model functionality
  alert('Sub Model feature coming soon! This will allow you to create nested conceptual models.');
}

function toggleLabelsVisibility() {
  showLabels.value = !showLabels.value;
}

function handleZoomChange(newZoom: number) {
  zoomLevel.value = newZoom;
}

onMounted(async () => {
  await domainsStore.fetch();
  const domain = domainsStore.byId(domainId.value);
  if (domain) {
    domainTitle.value = domain.title;
  }
  await loadModel();
  // Apply saved zoom level after model is loaded
  setTimeout(() => {
    if (zoomLevel.value !== 1) {
      setViewport({ x: 0, y: 0, zoom: zoomLevel.value });
    }
  }, 100);
});

function handleConnect(params: Connection) {
  const newEdge: RelationEdge = {
    id: `e-${Date.now()}`,
    source: params.source,
    target: params.target,
    sourceHandle: params.sourceHandle || null,
    targetHandle: params.targetHandle || null,
    type: 'relation',
    updatable: true,
    data: {
      label: '',
      description: '',
      sourceRole: '',
      targetRole: '',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      lineStyle: 'straight',
      labelPositions: {}
    }
  };
  edges.value = [...edges.value, newEdge];
}

function handleEdgeUpdate({ edge, connection }: { edge: any; connection: Connection }) {
  // Update the existing edge with new connection info using updateEdge
  const edgeToUpdate = edges.value.find(e => e.id === edge.id);
  if (edgeToUpdate) {
    updateEdge(edgeToUpdate, {
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle || null,
      targetHandle: connection.targetHandle || null
    });
  }
}

function addConceptNode() {
  const id = `concept-${Date.now()}`;
  const newNode: ConceptNode = {
    id,
    type: 'concept',
    position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
    data: { label: 'New Concept', description: '', attributes: [] }
  };
  nodes.value = [...nodes.value, newNode];
}

function onNodeClick(event: any) {
  const node = findNode(event.node.id);
  if (node) {
    selectedItem.value = { type: 'node', id: node.id };
    nodeForm.label = node.data.label;
    nodeForm.description = node.data.description;
    nodeForm.attributes = node.data.attributes || [];
  }
}

function updateNodeData() {
  if (selectedItem.value?.type === 'node') {
    const node = findNode(selectedItem.value.id);
    if (node) {
      node.data.label = nodeForm.label;
      node.data.description = nodeForm.description;
      node.data.attributes = nodeForm.attributes;
    }
  }
}

// Attribute management functions
function startAddAttribute() {
  editingAttributeId.value = null;
  attributeForm.id = '';
  attributeForm.name = '';
  attributeForm.description = '';
  attributeForm.dataTypeName = '';
  attributeForm.customDataTypeName = '';
  attributeForm.dataTypeDescription = '';
  attributeForm.mandatory = true;
  showAttributeForm.value = true;
}

function editAttribute(attr: Attribute) {
  editingAttributeId.value = attr.id;
  attributeForm.id = attr.id;
  attributeForm.name = attr.name;
  attributeForm.description = attr.description;
  attributeForm.dataTypeName = attr.dataType.name;
  attributeForm.customDataTypeName = '';
  attributeForm.dataTypeDescription = attr.dataType.description;
  attributeForm.mandatory = attr.mandatory;
  showAttributeForm.value = true;
}

const isCustomDataType = computed(() => {
  return attributeForm.dataTypeName && 
         !businessDataTypes.value.some(t => t.name === attributeForm.dataTypeName);
});

function onDataTypeChange() {
  if (attributeForm.dataTypeName === '__custom__') {
    attributeForm.customDataTypeName = '';
    attributeForm.dataTypeDescription = '';
  } else if (attributeForm.dataTypeName) {
    const selectedType = businessDataTypes.value.find(t => t.name === attributeForm.dataTypeName);
    if (selectedType) {
      attributeForm.dataTypeDescription = selectedType.description;
    }
  }
}

function saveAttribute() {
  if (!attributeForm.name.trim()) return;
  
  const finalDataTypeName = attributeForm.dataTypeName === '__custom__' 
    ? (attributeForm.customDataTypeName || 'Custom')
    : (attributeForm.dataTypeName || 'String');
  
  const newAttr: Attribute = {
    id: editingAttributeId.value || `attr-${Date.now()}`,
    name: attributeForm.name,
    description: attributeForm.description,
    dataType: {
      name: finalDataTypeName,
      description: attributeForm.dataTypeDescription || ''
    },
    mandatory: attributeForm.mandatory
  };
  
  if (editingAttributeId.value) {
    const index = nodeForm.attributes.findIndex(a => a.id === editingAttributeId.value);
    if (index !== -1) {
      nodeForm.attributes[index] = newAttr;
    }
  } else {
    nodeForm.attributes.push(newAttr);
  }
  
  // Update the node data
  updateNodeData();
  
  showAttributeForm.value = false;
  editingAttributeId.value = null;
}

function cancelAttributeForm() {
  showAttributeForm.value = false;
  editingAttributeId.value = null;
}

function deleteAttribute(attrId: string) {
  nodeForm.attributes = nodeForm.attributes.filter(a => a.id !== attrId);
  updateNodeData();
}

function toggleAttributeExpand(attrId: string) {
  if (expandedAttributes.value.has(attrId)) {
    expandedAttributes.value.delete(attrId);
  } else {
    expandedAttributes.value.add(attrId);
  }
}

function updateAttributeField(attrId: string, field: string, value: any) {
  const attr = nodeForm.attributes.find(a => a.id === attrId);
  if (attr) {
    (attr as any)[field] = value;
    updateNodeData();
  }
}

function updateAttributeDataType(attrId: string, typeName: string) {
  const attr = nodeForm.attributes.find(a => a.id === attrId);
  if (attr) {
    const type = businessDataTypes.value.find(t => t.name === typeName);
    attr.dataType = {
      name: typeName,
      description: type?.description || ''
    };
    updateNodeData();
  }
}

// Data Type Management
function saveDataType() {
  if (!newDataTypeForm.name.trim()) return;
  
  if (editingDataTypeIndex.value !== null) {
    businessDataTypes.value[editingDataTypeIndex.value] = {
      name: newDataTypeForm.name,
      description: newDataTypeForm.description
    };
  } else {
    businessDataTypes.value.push({
      name: newDataTypeForm.name,
      description: newDataTypeForm.description
    });
  }
  
  newDataTypeForm.name = '';
  newDataTypeForm.description = '';
  editingDataTypeIndex.value = null;
}

function editDataType(index: number) {
  editingDataTypeIndex.value = index;
  newDataTypeForm.name = businessDataTypes.value[index].name;
  newDataTypeForm.description = businessDataTypes.value[index].description;
}

function cancelEditDataType() {
  editingDataTypeIndex.value = null;
  newDataTypeForm.name = '';
  newDataTypeForm.description = '';
}

function deleteDataType(index: number) {
  businessDataTypes.value.splice(index, 1);
}

// AI Attribute Description Generation
async function generateAttributeDescription() {
  if (!attributeForm.name.trim() || aiGenerating.value) return;
  
  aiGenerating.value = true;
  try {
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const messages = [
      { 
        role: 'system', 
        content: 'You are an expert in data modeling. Generate a concise description (max 100 chars) for an attribute based on its name and the concept context.' 
      },
      { 
        role: 'user', 
        content: `Generate a description for attribute "${attributeForm.name}" in concept "${nodeForm.label}". Concept description: "${nodeForm.description}". Keep it under 100 characters.` 
      }
    ];
    
    const res = await fetch(`${bffBase}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        provider: llmPrefs.provider,
        apiKey: llmPrefs.currentApiKey,
        customApiUrl: llmPrefs.apiUrl,
        model: llmPrefs.model,
        messages
      }),
    });
    
    if (res.ok) {
      const data = await res.json();
      attributeForm.description = data.content?.substring(0, 100) || attributeForm.description;
    }
  } catch (e) {
    console.error('AI generation failed:', e);
  } finally {
    aiGenerating.value = false;
  }
}

async function generateAttributeDescriptionForAttr(attr: Attribute) {
  if (aiGenerating.value) return;
  
  aiGenerating.value = true;
  try {
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const messages = [
      { 
        role: 'system', 
        content: 'You are an expert in data modeling. Generate a concise description (max 100 chars) for an attribute.' 
      },
      { 
        role: 'user', 
        content: `Generate a description for attribute "${attr.name}" (${attr.dataType.name}) in concept "${nodeForm.label}". Keep it under 100 characters.` 
      }
    ];
    
    const res = await fetch(`${bffBase}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        provider: llmPrefs.provider,
        apiKey: llmPrefs.currentApiKey,
        customApiUrl: llmPrefs.apiUrl,
        model: llmPrefs.model,
        messages
      }),
    });
    
    if (res.ok) {
      const data = await res.json();
      attr.description = data.content?.substring(0, 100) || attr.description;
      updateNodeData();
    }
  } catch (e) {
    console.error('AI generation failed:', e);
  } finally {
    aiGenerating.value = false;
  }
}

async function generateAttributesWithAI() {
  if (!nodeForm.label.trim() || aiGenerating.value) return;
  
  aiGenerating.value = true;
  try {
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const systemPrompt = `You are an expert data modeler. Based on the concept name and description provided, generate a comprehensive list of attributes that would be appropriate for this concept.

Current attributes in this concept: ${nodeForm.attributes.map(a => a.name).join(', ') || 'None'}

Respond with a JSON array of attributes in this format:
[
  { "name": "attributeName", "description": "Brief description", "dataType": "String|Integer|Decimal|Boolean|Date|DateTime|Email|etc", "mandatory": true|false },
  ...
]

Generate 5-10 relevant attributes. Use appropriate business data types from: String, Integer, Decimal, Boolean, Date, DateTime, Time, Email, Phone, Currency, Percentage, URL, UUID, Code, Text.`;
    
    const messages = [
      { 
        role: 'system', 
        content: systemPrompt
      },
      { 
        role: 'user', 
        content: `Generate attributes for concept:
Name: "${nodeForm.label}"
Description: "${nodeForm.description || 'No description provided'}"` 
      }
    ];
    
    const res = await fetch(`${bffBase}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        provider: llmPrefs.provider,
        apiKey: llmPrefs.currentApiKey,
        customApiUrl: llmPrefs.apiUrl,
        model: llmPrefs.model,
        messages
      }),
    });
    
    if (res.ok) {
      const data = await res.json();
      let generatedAttributes: any[] = [];
      
      // Try to parse JSON from response
      try {
        const jsonMatch = data.content?.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedAttributes = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        alert('Failed to parse AI response. Please try again.');
        return;
      }
      
      // Add generated attributes
      if (Array.isArray(generatedAttributes) && generatedAttributes.length > 0) {
        let addedCount = 0;
        
        generatedAttributes.forEach((attr: any) => {
          // Check if attribute with same name already exists
          const exists = nodeForm.attributes.some(
            existing => existing.name.toLowerCase() === (attr.name || '').toLowerCase()
          );
          
          if (!exists && attr.name) {
            const newAttr: Attribute = {
              id: `attr-${Date.now()}-${addedCount}`,
              name: attr.name,
              description: attr.description || '',
              dataType: {
                name: attr.dataType || 'String',
                description: ''
              },
              mandatory: attr.mandatory === true
            };
            
            nodeForm.attributes.push(newAttr);
            addedCount++;
          }
        });
        
        // Update the node data
        updateNodeData();
        
        // Show success message
        if (addedCount > 0) {
          alert(`✅ Successfully added ${addedCount} attribute(s) to the concept!`);
        } else {
          alert('No new attributes were added. All suggested attributes already exist.');
        }
      } else {
        alert('No attributes were generated. Please try again.');
      }
    }
  } catch (e) {
    console.error('AI generation failed:', e);
    alert('Failed to generate attributes. Please try again.');
  } finally {
    aiGenerating.value = false;
  }
}

function selectEdgeById(edgeId: string) {
  const edge = edges.value.find(e => e.id === edgeId);
  if (edge) {
    selectedItem.value = { type: 'edge', id: edge.id };
    edgeForm.label = edge.data.label;
    edgeForm.description = edge.data.description;
    edgeForm.sourceRole = edge.data.sourceRole || '';
    edgeForm.targetRole = edge.data.targetRole || '';
    edgeForm.sourceMultiplicity = edge.data.sourceMultiplicity;
    edgeForm.targetMultiplicity = edge.data.targetMultiplicity;
    edgeForm.lineStyle = edge.data.lineStyle || 'straight';
  }
}

// Label drag state
const draggingLabel = ref<{
  edgeId: string;
  labelType: 'sourceRole' | 'targetRole' | 'sourceMultiplicity' | 'targetMultiplicity' | 'relationName';
  startX: number;
  startY: number;
  initialOffsetX: number;
  initialOffsetY: number;
} | null>(null);

function startLabelDrag(
  event: MouseEvent,
  edgeId: string,
  labelType: 'sourceRole' | 'targetRole' | 'sourceMultiplicity' | 'targetMultiplicity' | 'relationName',
  currentX: number,
  currentY: number
) {
  event.stopPropagation();
  event.preventDefault();
  
  const edge = edges.value.find(e => e.id === edgeId);
  if (!edge) return;
  
  // Initialize labelPositions if not exists
  if (!edge.data.labelPositions) {
    edge.data.labelPositions = {};
  }
  
  const labelPos = edge.data.labelPositions[labelType];
  const initialOffsetX = labelPos ? labelPos.x : 0;
  const initialOffsetY = labelPos ? labelPos.y : 0;
  
  draggingLabel.value = {
    edgeId,
    labelType,
    startX: event.clientX,
    startY: event.clientY,
    initialOffsetX,
    initialOffsetY
  };
  
  document.addEventListener('mousemove', handleLabelDrag);
  document.addEventListener('mouseup', stopLabelDrag);
}

function handleLabelDrag(event: MouseEvent) {
  if (!draggingLabel.value) return;
  
  const { edgeId, labelType, startX, startY, initialOffsetX, initialOffsetY } = draggingLabel.value;
  const deltaX = (event.clientX - startX) / zoomLevel.value;
  const deltaY = (event.clientY - startY) / zoomLevel.value;
  
  const edge = edges.value.find(e => e.id === edgeId);
  if (edge && edge.data.labelPositions) {
    edge.data.labelPositions[labelType] = {
      x: initialOffsetX + deltaX,
      y: initialOffsetY + deltaY
    };
  }
}

function stopLabelDrag() {
  draggingLabel.value = null;
  document.removeEventListener('mousemove', handleLabelDrag);
  document.removeEventListener('mouseup', stopLabelDrag);
}

function getLabelPosition(
  edgeId: string,
  labelType: 'sourceRole' | 'targetRole' | 'sourceMultiplicity' | 'targetMultiplicity' | 'relationName',
  defaultX: number,
  defaultY: number
): { x: number; y: number } {
  const edge = edges.value.find(e => e.id === edgeId);
  const offset = edge?.data.labelPositions?.[labelType];
  return {
    x: defaultX + (offset?.x || 0),
    y: defaultY + (offset?.y || 0)
  };
}

function onEdgeClick(event: any) {
  selectEdgeById(event.edge.id);
}

function onPaneClick() {
  selectedItem.value = null;
}

function deleteSelected() {
  if (selectedItem.value?.type === 'node') {
    nodes.value = nodes.value.filter(n => n.id !== selectedItem.value?.id);
    edges.value = edges.value.filter(e => e.source !== selectedItem.value?.id && e.target !== selectedItem.value?.id);
    selectedItem.value = null;
  }
}

function deleteSelectedEdge() {
  if (selectedItem.value?.type === 'edge') {
    edges.value = edges.value.filter(e => e.id !== selectedItem.value?.id);
    selectedItem.value = null;
  }
}

function getEdgePath(style: string, sx: number, sy: number, tx: number, ty: number, sourcePosition: any, targetPosition: any): string {
  switch (style) {
    case 'step':
      return getStepPath(sx, sy, tx, ty);
    case 'bezier':
      // Use Vue Flow's built-in bezier path generator for more organic look
      const [path] = getVueFlowBezierPath({
        sourceX: sx,
        sourceY: sy,
        sourcePosition,
        targetX: tx,
        targetY: ty,
        targetPosition,
      });
      return path;
    case 'straight':
    default:
      return `M ${sx} ${sy} L ${tx} ${ty}`;
  }
}

function getStepPath(sx: number, sy: number, tx: number, ty: number): string {
  const midX = (sx + tx) / 2;
  // Angular connector with a horizontal middle segment
  return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
}

function getBezierPath(sx: number, sy: number, tx: number, ty: number): string {
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Control points for smooth bezier curve
  // The control points are placed along the line between source and target
  // with an offset perpendicular to create the curve
  const offset = Math.min(dist * 0.3, 80);
  
  // Calculate control points
  const cp1x = sx + (dx * 0.3);
  const cp1y = sy + (dy * 0.1) - offset;
  const cp2x = tx - (dx * 0.3);
  const cp2y = ty - (dy * 0.1) + offset;
  
  return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;
}

function updateEdgeData() {
  if (selectedItem.value?.type === 'edge') {
    const edge = edges.value.find(e => e.id === selectedItem.value?.id);
    if (edge) {
      edge.data.label = edgeForm.label;
      edge.data.description = edgeForm.description;
      edge.data.sourceRole = edgeForm.sourceRole;
      edge.data.targetRole = edgeForm.targetRole;
      edge.data.sourceMultiplicity = edgeForm.sourceMultiplicity;
      edge.data.targetMultiplicity = edgeForm.targetMultiplicity;
      edge.data.lineStyle = edgeForm.lineStyle;
    }
  }
}

async function generateRelationDescription() {
  if (aiGenerating.value) return;
  aiGenerating.value = true;
  try {
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const sourceNode = nodes.value.find(n => n.id === edges.value.find(e => e.id === selectedItem.value?.id)?.source);
    const targetNode = nodes.value.find(n => n.id === edges.value.find(e => e.id === selectedItem.value?.id)?.target);

    const messages = [
      { role: 'system', content: 'You are a helpful assistant that generates relation descriptions in conceptual data models. Provide a concise description (MAX 200 characters) explaining the semantic relationship between two concepts.' },
      { role: 'user', content: `Generate a description for the relation between "${sourceNode?.data?.label}" (${edgeForm.sourceRole || 'source'}) and "${targetNode?.data?.label}" (${edgeForm.targetRole || 'target'}). Relation name: "${edgeForm.label}". Multiplicity: ${edgeForm.sourceMultiplicity} to ${edgeForm.targetMultiplicity}. Keep it under 200 characters.` }
    ];
    
    const res = await fetch(`${bffBase}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        provider: llmPrefs.provider,
        apiKey: llmPrefs.currentApiKey,
        customApiUrl: llmPrefs.apiUrl,
        model: llmPrefs.model,
        messages
      }),
    });
    if (res.ok) {
      const data = await res.json();
      edgeForm.description = data.content?.substring(0, 200) || edgeForm.description;
    }
  } catch (e) {
    console.error('AI generate failed:', e);
  } finally {
    aiGenerating.value = false;
  }
}

async function saveFlow() {
  saveStatus.value = 'saving';
  try {
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    await fetch(`${bffBase}/domains/${domainId.value}/concept-model`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        nodes: nodes.value,
        edges: edges.value,
        viewport: { zoom: zoomLevel.value }
      })
    });
    saveStatus.value = 'saved';
    setTimeout(() => { saveStatus.value = 'idle'; }, 2000);
  } catch (e) {
    console.error('Save failed:', e);
    saveStatus.value = 'idle';
  }
}

async function loadModel() {
  try {
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${bffBase}/domains/${domainId.value}/concept-model`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.nodes) {
        // Ensure all nodes have attributes array
        nodes.value = data.nodes.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            attributes: node.data.attributes || []
          }
        }));
      }
      if (data.edges) {
        // Ensure all edges have lineStyle, labelPositions and updatable
        edges.value = data.edges.map((edge: any) => ({
          ...edge,
          updatable: true,
          data: {
            ...edge.data,
            lineStyle: edge.data.lineStyle || 'straight',
            labelPositions: edge.data.labelPositions || {}
          }
        }));
      }
      // Restore zoom level if saved
      if (data.viewport && data.viewport.zoom) {
        zoomLevel.value = data.viewport.zoom;
      }
    }
  } catch (e) {
    console.error('Load failed:', e);
  }
}
</script>

<style scoped>
.concept-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: #ffffff;
  border: 2px solid #e3e2e7;
  border-radius: 12px;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
}

.concept-node:hover {
  border-color: #7c3aed;
  box-shadow: 0 4px 12px rgba(124,58,237,0.15);
}

.concept-node--selected {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124,58,237,0.2);
}

.concept-node__label {
  font-size: 13px;
  font-weight: 600;
  color: #1a1b1f;
}

.panel-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #414755;
  margin-bottom: 6px;
}

.panel-input, .panel-select, .panel-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e3e2e7;
  border-radius: 8px;
  font-size: 13px;
  background: #f4f3f8;
  color: #1a1b1f;
}

.panel-textarea {
  resize: vertical;
  min-height: 80px;
}

.btn-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #fee2e2;
}

.edge-relation {
  overflow: visible;
  pointer-events: none;
}

.edge-relation text {
  pointer-events: none;
  user-select: none;
}

.node-handle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s;
}

.node-handle:hover {
  opacity: 1;
  transform: scale(1.3);
}

:deep(.vue-flow__handle) {
  z-index: 10;
}

:deep(.vue-flow__handle.connecting) {
  opacity: 1;
  transform: scale(1.5);
  box-shadow: 0 0 8px rgba(124, 58, 237, 0.6);
}

:deep(.vue-flow__handle.valid) {
  background: #059669 !important;
  opacity: 1;
  transform: scale(1.3);
}

:deep(.vue-flow__edge) {
  z-index: 5;
}

:deep(.vue-flow__edge.updatable) {
  cursor: pointer;
}

:deep(.vue-flow__edge.selected) .vue-flow__edge-path {
  stroke: #7c3aed;
  stroke-width: 3;
}

:deep(.vue-flow__connection) {
  stroke: #0058bc;
  stroke-width: 2;
}

:deep(.vue-flow__edge-path) {
  stroke: #0058bc;
  stroke-width: 2;
}

:deep(.vue-flow__edgeupdater) {
  cursor: grab;
}

:deep(.vue-flow__edgeupdater:hover) {
  cursor: grab;
  filter: drop-shadow(0 0 4px rgba(0, 88, 188, 0.6));
}

:deep(.vue-flow__node) {
  z-index: 10;
}

.edge-label, .edge-multiplicity, .edge-relation-name {
  pointer-events: none;
}

/* Properties Panel Animation */
.properties-panel {
  width: 320px;
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.properties-panel.panel-open {
  transform: translateX(0);
  opacity: 1;
}

.properties-panel.panel-closed {
  transform: translateX(100%);
  opacity: 0;
  width: 0;
  overflow: hidden;
}

/* Make edge labels clickable */
:deep(.edge-multiplicity),
:deep(.edge-role) {
  cursor: pointer;
  pointer-events: all;
}

:deep(.edge-multiplicity:hover),
:deep(.edge-role:hover) {
  filter: brightness(1.1);
}

/* Clickable edge paths */
:deep(.vue-flow__edge-path) {
  pointer-events: stroke;
  cursor: pointer;
}

:deep(.vue-flow__edge:hover) .vue-flow__edge-path {
  stroke-width: 3;
  filter: drop-shadow(0 0 3px rgba(0, 88, 188, 0.5));
}

/* Attribute card hover */
.attribute-card {
  transition: all 0.2s ease;
}

.attribute-card:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Smooth transitions for form elements */
.panel-input,
.panel-select,
.panel-textarea {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.panel-input:focus,
.panel-select:focus,
.panel-textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

/* Collapsible Attribute List Styles */
.attribute-item {
  transition: all 0.3s ease;
}

.attribute-header {
  transition: background-color 0.2s ease;
}

.attribute-header:hover {
  background-color: #f9fafb;
}

.attribute-expand-enter-active,
.attribute-expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.attribute-expand-enter-from,
.attribute-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Custom scrollbar for panel */
.properties-panel::-webkit-scrollbar {
  width: 6px;
}

.properties-panel::-webkit-scrollbar-track {
  background: #f4f3f8;
}

.properties-panel::-webkit-scrollbar-thumb {
  background: #d9d8e8;
  border-radius: 3px;
}

.properties-panel::-webkit-scrollbar-thumb:hover {
  background: #b0afc0;
}

/* Data Type Badge Styles */
.data-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: #e0e7ff;
  color: #0058bc;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
}

/* Mandatory Badge */
.mandatory-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
}

.mandatory-badge.required {
  background: #e0e7ff;
  color: #0058bc;
}

.mandatory-badge.optional {
  background: #f4f3f8;
  color: #717786;
}

/* Draggable Labels Styles */
.draggable-label {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s ease, transform 0.1s ease;
}

.draggable-label:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}

.draggable-label:active {
  cursor: grabbing !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Ensure edge labels are rendered above nodes */
:deep(.vue-flow__edges) {
  z-index: 1000 !important;
}

:deep(.vue-flow__edge) {
  z-index: 1001 !important;
}

:deep(.vue-flow__edge-label) {
  z-index: 1002 !important;
}

:deep(.vue-flow__nodes) {
  z-index: 10 !important;
}

/* Ensure foreignObjects in edges are above everything */
.edge-relation foreignObject {
  z-index: 1010 !important;
}

/* Prevent text selection during drag */
.no-select {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Selected edge should be on top of everything */
:deep(.vue-flow__edge.selected) {
  z-index: 2000 !important;
}

:deep(.vue-flow__edge.selected .edge-relation foreignObject) {
  z-index: 2010 !important;
}
</style>
