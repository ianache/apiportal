<template>
  <div class="fixed inset-0 flex flex-col" style="font-family: 'Inter', sans-serif;">

    <!-- ── Toolbar ─────────────────────────────────────── -->
    <header class="flex items-center justify-between px-4 h-12 flex-shrink-0 z-10"
      style="background:#ffffff; border-bottom:1px solid #e3e2e7;">
      <div class="flex items-center gap-3">
        <button @click="goBack" class="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60" style="color:#414755;">
          <span class="material-symbols-outlined" style="font-size:18px;">arrow_back</span>Back to API
        </button>
        <span style="color:#e3e2e7;">|</span>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined" style="font-size:18px;color:#0058bc;">api</span>
          <span class="text-sm font-semibold" style="color:#1a1b1f;">{{ apiName }} <span style="color:#a0a7b5;">·</span> v{{ version }}</span>
          <span class="px-2 py-0.5 rounded-full text-xs font-bold uppercase" style="background:#eff6ff;color:#0058bc;">OpenAPI 3.1</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- AI Designer -->
        <button @click="showAiPanel = !showAiPanel" class="toolbar-icon-btn ai-btn" :class="{ 'toolbar-icon-btn--active': showAiPanel }" title="AI Designer">
          <span class="material-symbols-outlined" style="font-size:19px;">auto_awesome</span>
        </button>
        <!-- AI Reviewer -->
        <button @click="showReviewPanel = !showReviewPanel" class="toolbar-icon-btn review-btn" :class="{ 'toolbar-icon-btn--active': showReviewPanel }" title="AI Reviewer">
          <span class="material-symbols-outlined" style="font-size:19px;">rate_review</span>
        </button>
        <div class="toolbar-divider"></div>
        <!-- Components catalog -->
        <button @click="showComponents = !showComponents" class="toolbar-icon-btn" :class="{ 'toolbar-icon-btn--active': showComponents }" title="Components Catalog">
          <span class="material-symbols-outlined" style="font-size:19px;">dataset</span>
        </button>
        <div class="toolbar-divider"></div>
        <!-- Import / Export -->
        <input ref="fileInputRef" type="file" accept=".yaml,.yml,.json" class="sr-only" @change="onFileImport" />
        <button @click="fileInputRef?.click()" class="toolbar-icon-btn" title="Import YAML (OpenAPI or Design)">
          <span class="material-symbols-outlined" style="font-size:19px;">upload_file</span>
        </button>
        <button @click="snapToGrid = !snapToGrid" class="toolbar-icon-btn" :class="{ 'toolbar-icon-btn--active': snapToGrid }" title="Toggle snap to grid">
          <span class="material-symbols-outlined" style="font-size:19px;">grid_on</span>
        </button>
        <button @click="exportDesignYaml" class="toolbar-icon-btn" title="Export Visual Design YAML">
          <span class="material-symbols-outlined" style="font-size:19px;">device_hub</span>
        </button>
        <button @click="exportYaml" class="toolbar-icon-btn" title="Export OpenAPI 3.1 YAML">
          <span class="material-symbols-outlined" style="font-size:19px;">download</span>
        </button>
        <div class="toolbar-divider"></div>
        <span v-if="saveStatus==='saving'" class="flex items-center gap-1 text-xs font-medium" style="color:#a0a7b5;">
          <span class="material-symbols-outlined" style="font-size:14px;">progress_activity</span>Saving…
        </span>
        <span v-else-if="saveStatus==='saved'" class="flex items-center gap-1 text-xs font-medium" style="color:#047857;">
          <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span>Saved
        </span>
        <span v-else-if="saveStatus==='error'" class="flex items-center gap-1 text-xs font-medium" style="color:#991b1b;">
          <span class="material-symbols-outlined" style="font-size:14px;">error</span>Save failed
        </span>
        <button @click="saveFlow" :disabled="saveStatus==='saving'"
          class="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
          style="background:#0058bc;color:#ffffff;">
          <span class="material-symbols-outlined" style="font-size:16px;">save</span>Save Flow
        </button>
      </div>
    </header>

    <!-- ── Canvas area ─────────────────────────────────── -->
    <div class="flex-1 relative overflow-hidden">

      <!-- Vue Flow -->
      <VueFlow v-model:nodes="nodes" v-model:edges="edges" :node-types="nodeTypes"
        :default-edge-options="defaultEdgeOptions" :connect-on-click="false"
        :snap-to-grid="snapToGrid" :snap-grid="[24, 24]"
        fit-view-on-init class="flow-canvas"
        @node-click="onNodeClick" @edge-click="onEdgeClick" @pane-click="onPaneClick">
        <Background :gap="24" :size="1.5" pattern-color="#d4d2db" variant="dots" />
      </VueFlow>

      <!-- ── LEFT: components panel ──────────────────────── -->
      <Transition name="panel-left-slide">
        <aside v-if="showComponents" class="components-panel" :style="{ width: componentsWidth + 'px' }" @click.stop>
          <!-- Resizer handle (Right side of left panel) -->
          <div class="panel-resizer-right" @mousedown="startResizingLeft">
            <div class="panel-resizer-line"></div>
          </div>
          <div class="panel-header">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined" style="font-size:18px;color:#0058bc;">dataset</span>
              <span class="text-sm font-bold" style="color:#1a1b1f;">Components</span>
            </div>
            <button @click="showComponents=false" class="panel-close">
              <span class="material-symbols-outlined" style="font-size:18px;">close</span>
            </button>
          </div>

          <!-- Add schema -->
          <div class="panel-section">
            <button @click="addSchema" class="btn-add w-full">
              <span class="material-symbols-outlined" style="font-size:16px;">add</span>New Schema
            </button>
          </div>

          <!-- Schema list -->
          <div v-for="schema in components" :key="schema.id" class="schema-card">
            <!-- Card header — always visible -->
            <div class="schema-card-header" @click="toggleSchema(schema.id)" style="cursor:pointer;">
              <span
                class="material-symbols-outlined schema-chevron"
                :class="{ 'schema-chevron--open': !collapsedSchemas.has(schema.id) }"
                style="font-size:18px;color:#a0a7b5;flex-shrink:0;"
              >chevron_right</span>
              <input
                v-model="schema.name"
                class="schema-name-input"
                placeholder="SchemaName"
                @click.stop
              />
              <span v-if="schema.properties.length" class="schema-prop-count">{{ schema.properties.length }}</span>
              <button @click.stop="removeSchema(schema.id)" class="panel-close" title="Remove schema">
                <span class="material-symbols-outlined" style="font-size:16px;">delete</span>
              </button>
            </div>

            <!-- Collapsible body -->
            <div v-if="!collapsedSchemas.has(schema.id)" class="schema-body">
              <input v-model="schema.description" class="panel-input mt-1" placeholder="Description…" />

              <!-- Properties -->
              <div class="mt-2 space-y-1">
                <div v-for="prop in schema.properties" :key="prop.id" class="prop-row">
                  <input v-model="prop.name" class="prop-input" placeholder="field" />
                  <select v-model="prop.type" class="prop-select">
                    <option v-for="t in OPENAPI_TYPES" :key="t" :value="t">{{ t }}</option>
                  </select>
                  <label class="prop-req" :title="prop.required ? 'Required' : 'Optional'">
                    <input type="checkbox" v-model="prop.required" class="sr-only" />
                    <span :style="{ color: prop.required ? '#0058bc' : '#a0a7b5' }" class="material-symbols-outlined" style="font-size:16px;">asterisk</span>
                  </label>
                  <button @click="removeProp(schema, prop.id)" class="panel-close">
                    <span class="material-symbols-outlined" style="font-size:14px;">close</span>
                  </button>
                </div>
              </div>
              <button @click="addProp(schema)" class="btn-add-small mt-2">+ property</button>
            </div>
          </div>

          <div v-if="!components.length" class="px-4 py-6 text-center text-xs" style="color:#a0a7b5;">
            No schemas yet. Add one to reference from operations.
          </div>
        </aside>
      </Transition>

      <!-- ── RIGHT: Properties panel ─────────────────────── -->
      <Transition name="panel-slide">
        <aside v-if="selectedNode || selectedEdge" class="properties-panel" :style="{ width: panelWidth + 'px' }" @click.stop>
          <!-- Resizer handle -->
          <div class="panel-resizer" @mousedown="startResizing">
            <div class="panel-resizer-line"></div>
          </div>

          <!-- NODE view -->
          <template v-if="selectedNode && panelView === 'node'">
            <div class="panel-header">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined" style="font-size:18px;color:#0058bc;">folder_open</span>
                <span class="text-sm font-bold" style="color:#1a1b1f;">{{ selectedNode.data.isRoot ? 'API Info' : 'Resource Properties' }}</span>
              </div>
              <button @click="selectedNode=null" class="panel-close">
                <span class="material-symbols-outlined" style="font-size:18px;">close</span>
              </button>
            </div>

            <!-- ROOT NODE: API Info form -->
            <template v-if="selectedNode.data.isRoot">
              <div class="panel-section">
                <label class="panel-label">API TITLE</label>
                <input v-model="selectedNode.data.title" @input="updateNodeData" class="panel-input" placeholder="My API" />
              </div>
              <div class="panel-section">
                <label class="panel-label">API DESCRIPTION</label>
                <textarea v-model="selectedNode.data.description" @input="updateNodeData" class="panel-textarea" rows="3" placeholder="Detailed description of the API…" />
              </div>
              <div class="panel-section">
                <label class="panel-label">CONTACT NAME</label>
                <input v-model="selectedNode.data.contactName" @input="updateNodeData" class="panel-input" placeholder="John Doe" />
              </div>
              <div class="panel-section">
                <label class="panel-label">CONTACT EMAIL</label>
                <input v-model="selectedNode.data.contactEmail" @input="updateNodeData" class="panel-input" type="email" placeholder="contact@example.com" />
              </div>
              <div class="panel-section">
                <label class="panel-label">ROOT CONTEXT</label>
                <input v-model="selectedNode.data.rootContext" @input="updateNodeData" class="panel-input" placeholder="/api/v1" />
                <p class="panel-hint">Base path prefix for all endpoints (e.g., /telemetria/api/v1)</p>
              </div>
              <div class="panel-section">
                <label class="panel-label">TAGS</label>
                <div class="tags-container">
                  <div v-if="!selectedNode.data.tags?.length" class="text-xs" style="color:#a0a7b5;">No tags</div>
                  <div v-for="(tag, i) in selectedNode.data.tags" :key="i" class="tag-chip">
                    <span>{{ tag }}</span>
                    <button @click="removeTag(i)" class="tag-remove">
                      <span class="material-symbols-outlined" style="font-size:12px;">close</span>
                    </button>
                  </div>
                </div>
                <div class="flex gap-2 mt-2">
                  <input v-model="newTag" @keydown.enter.prevent="addTag" class="panel-input flex-1" placeholder="Add tag…" style="font-size:12px;" />
                  <button @click="addTag" class="btn-add-small" style="padding:0 8px;">Add</button>
                </div>
              </div>
            </template>

            <!-- REGULAR NODE: Resource Properties form -->
            <template v-else>
              <div class="panel-section">
                <label class="panel-label">RESOURCE PATH</label>
                <input v-model="selectedNode.data.path" @input="updateNodeData" class="panel-input" placeholder="/resource" />
                <p class="panel-hint">e.g. <code>/users/{id}</code></p>
              </div>
              <div class="panel-section">
                <label class="panel-label">OPERATION SUMMARY / ID</label>
                <input v-model="selectedNode.data.operationName" @input="updateNodeData" class="panel-input" placeholder="Get Users List" />
              </div>
              <div class="panel-section">
                <label class="panel-label">SECURITY SCHEME</label>
                <select v-model="selectedNode.data.security" @change="updateNodeData" class="panel-select w-full" style="max-width:none;width:100%;box-sizing:border-box;">
                  <option value="">— None —</option>
                  <option value="bearerAuth">Bearer Auth (JWT)</option>
                  <option value="apiKeyAuth">API Key</option>
                  <option value="oauth2">OAuth2</option>
                </select>
              </div>
              <div class="panel-section">
                <label class="panel-label">HTTP METHODS</label>
                <div class="methods-grid">
                  <div v-for="m in HTTP_METHODS" :key="m.verb" class="method-row">
                    <label class="method-toggle" :class="{ 'method-toggle--on': hasMethod(m.verb) }">
                      <input type="checkbox" :checked="hasMethod(m.verb)" @change="toggleMethod(m.verb)" class="sr-only" />
                      <span class="method-dot" :style="{ background: m.color }"></span>
                      {{ m.verb }}
                    </label>
                    <button v-if="hasMethod(m.verb)" @click="openMethodDetail(m.verb)"
                      class="method-edit-btn" title="Configure operation">
                      <span class="material-symbols-outlined" style="font-size:15px;">edit_note</span>
                    </button>
                  </div>
                </div>
              </div>
              <div class="panel-section">
                <label class="panel-label">DESCRIPTION</label>
                <textarea v-model="selectedNode.data.description" @input="updateNodeData" class="panel-textarea" rows="3" placeholder="Describe this resource…" />
              </div>
              <div class="panel-section">
                <label class="panel-label">TAGS</label>
                <div class="tags-container">
                  <div v-if="!selectedNode.data.tags?.length" class="text-xs" style="color:#a0a7b5;">No tags</div>
                  <div v-for="(tag, i) in selectedNode.data.tags" :key="i" class="tag-chip">
                    <span>{{ tag }}</span>
                    <button @click="removeTag(i)" class="tag-remove">
                      <span class="material-symbols-outlined" style="font-size:12px;">close</span>
                    </button>
                  </div>
                </div>
                <div class="flex gap-2 mt-2">
                  <input v-model="newTag" @keydown.enter.prevent="addTag" class="panel-input flex-1" placeholder="Add tag…" style="font-size:12px;" />
                  <button @click="addTag" class="btn-add-small" style="padding:0 8px;">Add</button>
                </div>
              </div>
              <div class="panel-section panel-section--danger">
                <button @click="deleteSelectedNode" class="btn-danger">
                  <span class="material-symbols-outlined" style="font-size:16px;">delete</span>Remove Resource
                </button>
              </div>
            </template>
          </template>

          <!-- METHOD DETAIL view -->
          <template v-else-if="selectedNode && panelView === 'method' && selectedMethod">
            <div class="panel-header">
              <button @click="panelView='node'" class="flex items-center gap-1 text-sm font-medium" style="color:#414755;">
                <span class="material-symbols-outlined" style="font-size:18px;">chevron_left</span>
              </button>
              <div class="flex items-center gap-2">
                <span class="method-badge-lg" :style="{ background: methodColor(selectedMethod), color:'#fff' }">{{ selectedMethod }}</span>
                <span class="text-sm font-semibold" style="color:#1a1b1f;">{{ selectedNode.data.path }}</span>
              </div>
              <button @click="selectedNode=null" class="panel-close">
                <span class="material-symbols-outlined" style="font-size:18px;">close</span>
              </button>
            </div>

            <!-- Summary / Description -->
            <div class="panel-section">
              <label class="panel-label">SUMMARY</label>
              <input v-model="opSpec.summary" class="panel-input" placeholder="Short description of the operation" />
            </div>
            <div class="panel-section">
              <label class="panel-label">Description</label>
              <textarea v-model="opSpec.description" class="panel-textarea" rows="2" placeholder="Detailed description…" />
            </div>

            <!-- Query Parameters -->
            <div class="panel-section">
              <div class="flex items-center justify-between mb-2">
                <label class="panel-label" style="margin:0;">Query Parameters</label>
                <button @click="addQueryParam" class="btn-add-small">+ param</button>
              </div>
              <div v-if="!opSpec.parameters.length" class="text-xs" style="color:#a0a7b5;">No parameters</div>
              <div v-for="(p, i) in opSpec.parameters" :key="p.id" class="param-row">
                <input v-model="p.name" class="prop-input" placeholder="name" />
                <select v-model="p.type" class="prop-select">
                  <option v-for="t in OPENAPI_TYPES" :key="t" :value="t">{{ t }}</option>
                </select>
                <label class="prop-req" :title="p.required ? 'Required' : 'Optional'">
                  <input type="checkbox" v-model="p.required" class="sr-only" />
                  <span :style="{ color: p.required ? '#0058bc' : '#a0a7b5' }" class="material-symbols-outlined" style="font-size:16px;">asterisk</span>
                </label>
                <button @click="opSpec.parameters.splice(i,1)" class="panel-close">
                  <span class="material-symbols-outlined" style="font-size:14px;">close</span>
                </button>
              </div>
            </div>

            <!-- Request Body (POST/PUT/PATCH) -->
            <div v-if="canHaveBody" class="panel-section">
              <div class="flex items-center justify-between mb-2">
                <label class="panel-label" style="margin:0;">Request Body</label>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="opSpec.requestBody.enabled" class="sr-only" />
                  <span class="toggle-track" :class="{ 'toggle-track--on': opSpec.requestBody.enabled }"></span>
                </label>
              </div>
              <div v-if="opSpec.requestBody.enabled" class="space-y-2">
                <div>
                  <label class="panel-label">Content Type</label>
                  <select v-model="opSpec.requestBody.contentType" class="panel-input">
                    <option>application/json</option>
                    <option>application/x-www-form-urlencoded</option>
                    <option>multipart/form-data</option>
                  </select>
                </div>
                <div>
                  <label class="panel-label">Schema</label>
                  <select v-model="opSpec.requestBody.schemaRef" class="panel-input">
                    <option value="">— inline / none —</option>
                    <option v-for="s in components" :key="s.id" :value="s.name">#/components/schemas/{{ s.name }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Responses -->
            <div class="panel-section">
              <div class="flex items-center justify-between mb-2">
                <label class="panel-label" style="margin:0;">Responses</label>
                <button @click="addResponse" class="btn-add-small">+ response</button>
              </div>
              <div v-for="(r, i) in opSpec.responses" :key="r.id" class="response-row">
                <input v-model="r.statusCode" class="status-input" placeholder="200" maxlength="3" />
                <input v-model="r.description" class="prop-input flex-1" placeholder="Description" />
                <button @click="opSpec.responses.splice(i,1)" class="panel-close">
                  <span class="material-symbols-outlined" style="font-size:14px;">close</span>
                </button>
                <div class="w-full mt-1 pl-0">
                  <select v-model="r.schemaRef" class="panel-input" style="font-size:11px;">
                    <option value="">— inline / none —</option>
                    <option v-for="s in components" :key="s.id" :value="s.name">#/components/schemas/{{ s.name }}</option>
                  </select>
                </div>
              </div>
            </div>
          </template>

          <!-- EDGE view (path param) -->
          <template v-else-if="selectedEdge && panelView === 'edge'">
            <div class="panel-header">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined" style="font-size:18px;color:#7c3aed;">route</span>
                <span class="text-sm font-bold" style="color:#1a1b1f;">Path Parameter</span>
              </div>
              <button @click="selectedEdge=null" class="panel-close">
                <span class="material-symbols-outlined" style="font-size:18px;">close</span>
              </button>
            </div>
            <div class="panel-section">
              <p class="panel-hint" style="line-height:1.5;">Identifies a resource in the URL, e.g. <code>/users/<strong>:id</strong></code>.</p>
            </div>
            <div class="panel-section">
              <label class="panel-label">Parameter Name</label>
              <input v-model="edgeParam.name" @input="updateEdgeParam" class="panel-input" placeholder="id" />
              <p class="panel-hint">Shown as <code>:{{ edgeParam.name || 'name' }}</code></p>
            </div>
            <div class="panel-section">
              <label class="panel-label">Data Type</label>
              <select v-model="edgeParam.type" @change="updateEdgeParam" class="panel-input">
                <option v-for="t in OPENAPI_TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="panel-section">
              <label class="panel-label">Description</label>
              <textarea v-model="edgeParam.description" @input="updateEdgeParam" class="panel-textarea" rows="2" placeholder="Describe this parameter…" />
            </div>
            <div class="panel-section">
              <div class="param-preview">
                <p class="panel-label" style="margin-bottom:6px;color:#717786;">OpenAPI Preview</p>
                <pre class="param-code">{{ edgeParamPreview }}</pre>
              </div>
            </div>
            <div class="panel-section panel-section--danger">
              <button @click="clearEdgeParam" class="btn-danger">
                <span class="material-symbols-outlined" style="font-size:16px;">link_off</span>Remove Parameter
              </button>
            </div>
          </template>

        </aside>
      </Transition>

      <!-- ── BOTTOM: AI Designer panel ──────────────────── -->
      <Transition name="panel-bottom-slide">
        <aside v-if="showAiPanel" class="ai-panel" @click.stop>

          <!-- Header -->
          <div class="ai-panel-header">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined" style="font-size:18px;color:#7c3aed;">auto_awesome</span>
              <span class="text-sm font-bold" style="color:#1a1b1f;">AI Designer</span>
              <span v-if="llmPrefs.isConfigured" class="ai-model-badge">{{ llmPrefs.model }}</span>
            </div>
            <button @click="showAiPanel = false" class="panel-close">
              <span class="material-symbols-outlined" style="font-size:18px;">close</span>
            </button>
          </div>

          <!-- Not configured -->
          <div v-if="!llmPrefs.isConfigured" class="ai-empty">
            <span class="material-symbols-outlined" style="font-size:32px;color:#d4d2db;">key</span>
            <p class="text-sm font-semibold" style="color:#1a1b1f;margin:8px 0 4px;">No LLM configured</p>
            <p class="text-xs" style="color:#a0a7b5;margin-bottom:12px;">Set your API key in Settings → Preferences.</p>
            <button @click="router.push('/settings/preferences')" class="ai-setup-btn">Go to Preferences</button>
          </div>

          <!-- Chat -->
          <template v-else>
            <div ref="chatScrollRef" class="ai-messages">
              <!-- Empty state -->
              <div v-if="!aiMessages.length" class="ai-welcome">
                <span class="material-symbols-outlined" style="font-size:28px;color:#7c3aed;opacity:0.4;">auto_awesome</span>
                <p class="text-xs" style="color:#a0a7b5;margin-top:8px;text-align:center;max-width:280px;">
                  Describe the API you want to design and I'll generate the visual model for you.
                </p>
              </div>

              <!-- Messages -->
              <div v-for="(msg, i) in aiMessages" :key="i" class="ai-msg-row" :class="`ai-msg-row--${msg.role}`">
                <div class="ai-bubble" :class="`ai-bubble--${msg.role}`">{{ msg.text }}</div>
                <button v-if="msg.design" @click="applyAiDesign(msg.design)" class="ai-apply-btn">
                  <span class="material-symbols-outlined" style="font-size:15px;">auto_fix_high</span>
                  Apply to Canvas
                </button>
              </div>

              <!-- Loading -->
              <div v-if="aiLoading" class="ai-msg-row ai-msg-row--assistant">
                <div class="ai-bubble ai-bubble--assistant ai-bubble--loading">
                  <span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>
                </div>
              </div>
            </div>

            <!-- Input -->
            <div class="ai-input-row">
              <textarea
                v-model="aiInput"
                class="ai-textarea"
                rows="2"
                placeholder="Describe your API… (⌘↵ to send)"
                @keydown.meta.enter.prevent="sendAiMessage"
                @keydown.ctrl.enter.prevent="sendAiMessage"
              />
              <button @click="sendAiMessage" :disabled="aiLoading || !aiInput.trim()" class="ai-send-btn">
                <span class="material-symbols-outlined" style="font-size:18px;">send</span>
              </button>
            </div>
          </template>

        </aside>
      </Transition>

      <!-- ── RIGHT: AI Reviewer panel ──────────────────── -->
      <Transition name="panel-right-slide">
        <aside v-if="showReviewPanel" class="review-panel" @click.stop>

          <!-- Header -->
          <div class="ai-panel-header">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined" style="font-size:18px;color:#7c3aed;">rate_review</span>
              <span class="text-sm font-bold" style="color:#1a1b1f;">AI Reviewer</span>
              <span v-if="llmPrefs.isConfigured" class="ai-model-badge">{{ llmPrefs.model }}</span>
            </div>
            <button @click="showReviewPanel = false" class="panel-close">
              <span class="material-symbols-outlined" style="font-size:18px;">close</span>
            </button>
          </div>

          <!-- Not configured -->
          <div v-if="!llmPrefs.isConfigured" class="ai-empty">
            <span class="material-symbols-outlined" style="font-size:32px;color:#d4d2db;">key</span>
            <p class="text-sm font-semibold" style="color:#1a1b1f;margin:8px 0 4px;">No LLM configured</p>
            <p class="text-xs" style="color:#a0a7b5;margin-bottom:12px;">Set your API key in Settings → Preferences.</p>
            <button @click="router.push('/settings/preferences')" class="ai-setup-btn">Go to Preferences</button>
          </div>

          <!-- Review Content -->
          <template v-else>
            <div class="review-content">
              <!-- Review button -->
              <div v-if="!reviewResult && !reviewLoading" class="review-start">
                <span class="material-symbols-outlined" style="font-size:48px;color:#7c3aed;opacity:0.4;">rate_review</span>
                <p class="text-sm" style="color:#414755;margin:12px 0;text-align:center;">
                  Analyze your OpenAPI spec against RESTful best practices
                </p>
                <div class="review-criteria">
                  <div class="review-criteria-item">
                    <span class="material-symbols-outlined" style="font-size:16px;color:#7c3aed;">link</span>
                    <span>Resource URI Semantic</span>
                  </div>
                  <div class="review-criteria-item">
                    <span class="material-symbols-outlined" style="font-size:16px;color:#7c3aed;">http</span>
                    <span>HTTP Methods Usage</span>
                  </div>
                  <div class="review-criteria-item">
                    <span class="material-symbols-outlined" style="font-size:16px;color:#7c3aed;">check_circle</span>
                    <span>Status Codes</span>
                  </div>
                  <div class="review-criteria-item">
                    <span class="material-symbols-outlined" style="font-size:16px;color:#7c3aed;">error</span>
                    <span>Error Handling</span>
                  </div>
                  <div class="review-criteria-item">
                    <span class="material-symbols-outlined" style="font-size:16px;color:#7c3aed;">security</span>
                    <span>Security Headers</span>
                  </div>
                  <div class="review-criteria-item">
                    <span class="material-symbols-outlined" style="font-size:16px;color:#7c3aed;">text_fields</span>
                    <span>Naming Conventions</span>
                  </div>
                  <div class="review-criteria-item">
                    <span class="material-symbols-outlined" style="font-size:16px;color:#7c3aed;">description</span>
                    <span>Documentation Quality</span>
                  </div>
                </div>
                <button @click="runApiReview" class="ai-setup-btn" style="margin-top:16px;width:100%;">
                  Run Review
                </button>
              </div>

              <!-- Loading -->
              <div v-else-if="reviewLoading" class="review-loading">
                <span class="material-symbols-outlined animate-spin" style="font-size:32px;color:#7c3aed;">progress_activity</span>
                <p class="text-sm" style="color:#414755;margin-top:12px;">Analyzing your API...</p>
              </div>

              <!-- Review Result -->
              <div v-else-if="reviewResult" class="review-result">
                <button @click="reviewResult = ''; showReviewPanel = false" class="ai-setup-btn" style="width:100%;margin-bottom:8px;">
                  <span class="material-symbols-outlined" style="font-size:16px;">refresh</span>
                  Run New Review
                </button>
                <button v-if="!reviewSaved" @click="saveReviewReport" class="ai-setup-btn" style="width:100%;margin-bottom:12px;background:#047857;">
                  <span class="material-symbols-outlined" style="font-size:16px;">save</span>
                  Save Report
                </button>
                <div v-if="reviewSaved" class="review-saved-msg">Report saved successfully</div>
                <MarkdownViewer 
                  :content="reviewResult" 
                  title="AI Review Report"
                  :filename="`${apiName || 'api'}-review-${version}.md`"
                />
              </div>
            </div>
          </template>

        </aside>
      </Transition>

      <!-- Import confirmation modal -->
      <Transition name="modal-fade">
        <div v-if="pendingImport" class="modal-overlay" @click.self="cancelImport">
          <div class="modal-box">
            <div class="modal-icon">
              <span class="material-symbols-outlined" style="font-size:40px;color:#991b1b;">warning</span>
            </div>
            <h3 class="modal-title">Importar OpenAPI</h3>
            <p class="modal-text">Se perderá toda la información actual del canvas (nodos, conexiones, esquemas y tags). ¿Está seguro de continuar?</p>
            <div class="modal-actions">
              <button @click="cancelImport" class="modal-btn modal-btn--cancel">Cancelar</button>
              <button @click="confirmImport" class="modal-btn modal-btn--confirm">Importar</button>
            </div>
          </div>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core';
import type { Node, Edge, NodeMouseEvent, EdgeMouseEvent } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import ResourceNode from '../components/designer/ResourceNode.vue';
import MarkdownViewer from '../components/MarkdownViewer.vue';
import { useRegistryStore } from '../stores/registry';
import { useLLMPreferencesStore } from '../stores/preferences';
import yaml from 'js-yaml';

// ── Types ────────────────────────────────────────────
interface QueryParam { id: string; name: string; type: string; required: boolean; }
interface ResponseSpec { id: string; statusCode: string; description: string; schemaRef: string; }
interface OperationSpec {
  summary: string; description: string;
  parameters: QueryParam[];
  requestBody: { enabled: boolean; contentType: string; schemaRef: string; };
  responses: ResponseSpec[];
}
interface SchemaProp { id: string; name: string; type: string; required: boolean; }
interface ComponentSchema { id: string; name: string; description: string; properties: SchemaProp[]; }

const uid = () => Math.random().toString(36).slice(2, 9);

// ── Router / Store ───────────────────────────────────
const route      = useRoute();
const router     = useRouter();
const registry   = useRegistryStore();
const llmPrefs   = useLLMPreferencesStore();
const apiId    = route.params.id as string;
const version  = route.params.version as string;
const apiName  = ref('');

// ── Vue Flow ─────────────────────────────────────────
const { removeNodes, updateNode, getViewport, setViewport, fitView } = useVueFlow();
const fileInputRef = ref<HTMLInputElement | null>(null);
const nodeTypes = { resource: markRaw(ResourceNode) } as any;
const defaultEdgeOptions = {
  type: 'smoothstep', animated: false,
  markerEnd: { type: MarkerType.ArrowClosed, color: '#0058bc' },
  style: { stroke: '#0058bc', strokeWidth: 2 },
};

const ROOT_NODE: Node = {
  id: 'root', type: 'resource', position: { x: 0, y: 0 },
  data: { 
    path: '/', methods: [], operationSpecs: {}, 
    description: 'API Entry Point', operationName: '', security: '', isRoot: true, tags: [],
    title: '', contactName: '', contactEmail: '', rootContext: '',
    hasChildren: false, collapsed: false
  },
};
const nodes = ref<Node[]>([ROOT_NODE]);
const edges = ref<Edge[]>([]);

const snapToGrid = ref(false);

// ── Components catalog ───────────────────────────────
const components = ref<ComponentSchema[]>([]);
const showComponents = ref(false);
const collapsedSchemas = ref<Set<string>>(new Set());

function addSchema() {
  const schema = { id: uid(), name: 'NewSchema', description: '', properties: [] };
  components.value.push(schema);
  collapsedSchemas.value = new Set([...collapsedSchemas.value, schema.id]);
}
function removeSchema(id: string) {
  components.value = components.value.filter(s => s.id !== id);
  const next = new Set(collapsedSchemas.value); next.delete(id);
  collapsedSchemas.value = next;
}

function toggleSchema(id: string) {
  const next = new Set(collapsedSchemas.value);
  next.has(id) ? next.delete(id) : next.add(id);
  collapsedSchemas.value = next;
}

function collapseAllSchemas() {
  collapsedSchemas.value = new Set(components.value.map(s => s.id));
}
function addProp(schema: ComponentSchema) {
  schema.properties.push({ id: uid(), name: '', type: 'string', required: false });
}
function removeProp(schema: ComponentSchema, propId: string) {
  schema.properties = schema.properties.filter(p => p.id !== propId);
}

// ── Panel state ──────────────────────────────────────
type PanelView = 'node' | 'method' | 'edge';
const panelView  = ref<PanelView>('node');
const panelWidth = ref(300);
const componentsWidth = ref(280);
const isResizing = ref(false);
const isResizingLeft = ref(false);

function startResizing(e: MouseEvent) {
  e.preventDefault();
  isResizing.value = true;
  document.addEventListener('mousemove', handleResizing);
  document.addEventListener('mouseup', stopResizing);
  document.body.style.cursor = 'col-resize';
}

function handleResizing(e: MouseEvent) {
  if (!isResizing.value) return;
  const newWidth = window.innerWidth - e.clientX;
  if (newWidth >= 280 && newWidth <= 800) {
    panelWidth.value = newWidth;
  }
}

function stopResizing() {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResizing);
  document.removeEventListener('mouseup', stopResizing);
  document.body.style.cursor = '';
}

function startResizingLeft(e: MouseEvent) {
  e.preventDefault();
  isResizingLeft.value = true;
  document.addEventListener('mousemove', handleResizingLeft);
  document.addEventListener('mouseup', stopResizingLeft);
  document.body.style.cursor = 'col-resize';
}

function handleResizingLeft(e: MouseEvent) {
  if (!isResizingLeft.value) return;
  const newWidth = e.clientX;
  if (newWidth >= 200 && newWidth <= 600) {
    componentsWidth.value = newWidth;
  }
}

function stopResizingLeft() {
  isResizingLeft.value = false;
  document.removeEventListener('mousemove', handleResizingLeft);
  document.removeEventListener('mouseup', stopResizingLeft);
  document.body.style.cursor = '';
}
const selectedNode = ref<Node | null>(null);
const selectedEdge = ref<Edge | null>(null);
const selectedMethod = ref<string | null>(null);

// Reactive operation spec form (flat, synced back to node on change)
const opSpec = ref<OperationSpec>({
  summary: '', description: '',
  parameters: [],
  requestBody: { enabled: false, contentType: 'application/json', schemaRef: '' },
  responses: [],
});

// Sync opSpec changes back to the node data
watch(opSpec, () => {
  if (!selectedNode.value || !selectedMethod.value) return;
  const specs = { ...(selectedNode.value.data.operationSpecs || {}), [selectedMethod.value]: { ...opSpec.value } };
  selectedNode.value = { ...selectedNode.value, data: { ...selectedNode.value.data, operationSpecs: specs } };
  updateNode(selectedNode.value.id, { data: { ...selectedNode.value.data } });
}, { deep: true });

const OPENAPI_TYPES = ['string', 'integer', 'number', 'boolean', 'array', 'object'] as const;

const HTTP_METHODS = [
  { verb: 'GET',    color: '#15803d' },
  { verb: 'POST',   color: '#1d4ed8' },
  { verb: 'PUT',    color: '#854d0e' },
  { verb: 'PATCH',  color: '#92400e' },
  { verb: 'DELETE', color: '#991b1b' },
];

function methodColor(verb: string) {
  return HTTP_METHODS.find(m => m.verb === verb)?.color ?? '#0058bc';
}

const canHaveBody = computed(() =>
  ['POST', 'PUT', 'PATCH'].includes(selectedMethod.value ?? '')
);

// ── Node click handlers ──────────────────────────────
function onNodeClick({ node }: NodeMouseEvent) {
  selectedNode.value = node;
  selectedEdge.value = null;
  panelView.value = 'node';
}
function onEdgeClick({ edge }: EdgeMouseEvent) {
  selectedEdge.value = edge;
  selectedNode.value = null;
  panelView.value = 'edge';
  const p = edge.data?.pathParam;
  edgeParam.value = { name: p?.name ?? '', type: p?.type ?? 'string', description: p?.description ?? '' };
}
function onPaneClick() {
  selectedNode.value = null;
  selectedEdge.value = null;
}

// ── Node data helpers ────────────────────────────────
function hasMethod(verb: string) {
  return (selectedNode.value?.data.methods as string[] | undefined)?.includes(verb) ?? false;
}

function updateNodeData() {
  if (!selectedNode.value) return;
  updateNode(selectedNode.value.id, { data: { ...selectedNode.value.data } });
}

const newTag = ref('');
function addTag() {
  if (!selectedNode.value || !newTag.value.trim()) return;
  const tag = newTag.value.trim();
  if (!selectedNode.value.data.tags) selectedNode.value.data.tags = [];
  if (!selectedNode.value.data.tags.includes(tag)) {
    selectedNode.value.data.tags.push(tag);
    updateNodeData();
  }
  newTag.value = '';
}
function removeTag(index: number) {
  if (!selectedNode.value) return;
  selectedNode.value.data.tags.splice(index, 1);
  updateNodeData();
}

function defaultOpSpec(verb: string): OperationSpec {
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(verb);
  return {
    summary: '', description: '',
    parameters: [],
    requestBody: { enabled: hasBody, contentType: 'application/json', schemaRef: '' },
    responses: [
      { id: uid(), statusCode: '200', description: 'Success', schemaRef: '' },
      ...(hasBody ? [{ id: uid(), statusCode: '400', description: 'Bad Request', schemaRef: '' }] : []),
      { id: uid(), statusCode: '500', description: 'Internal Server Error', schemaRef: '' },
    ],
  };
}

function toggleMethod(verb: string) {
  if (!selectedNode.value) return;
  const methods: string[] = [...(selectedNode.value.data.methods || [])];
  const specs = { ...(selectedNode.value.data.operationSpecs || {}) };
  const i = methods.indexOf(verb);
  if (i === -1) {
    methods.push(verb);
    if (!specs[verb]) specs[verb] = defaultOpSpec(verb);
  } else {
    methods.splice(i, 1);
  }
  selectedNode.value = { ...selectedNode.value, data: { ...selectedNode.value.data, methods, operationSpecs: specs } };
  updateNode(selectedNode.value.id, { data: { ...selectedNode.value.data } });
}

function openMethodDetail(verb: string) {
  if (!selectedNode.value) return;
  selectedMethod.value = verb;
  const raw = (selectedNode.value.data.operationSpecs as Record<string, OperationSpec> | undefined)?.[verb];
  opSpec.value = raw ? { ...raw, parameters: [...(raw.parameters || [])], responses: [...(raw.responses || [])] } : defaultOpSpec(verb);
  panelView.value = 'method';
}

function addQueryParam() {
  opSpec.value.parameters.push({ id: uid(), name: '', type: 'string', required: false });
}
function addResponse() {
  opSpec.value.responses.push({ id: uid(), statusCode: '', description: '', schemaRef: '' });
}

function deleteSelectedNode() {
  if (!selectedNode.value || selectedNode.value.data.isRoot) return;
  removeNodes([selectedNode.value.id]);
  selectedNode.value = null;
}

// ── Edge param ───────────────────────────────────────
const edgeParam = ref({ name: '', type: 'string', description: '' });
const edgeParamPreview = computed(() => {
  if (!edgeParam.value.name) return '# Set a parameter name above';
  const lines = [`name: ${edgeParam.value.name}`, `in: path`, `required: true`, `schema:`, `  type: ${edgeParam.value.type}`];
  if (edgeParam.value.description) lines.push(`description: ${edgeParam.value.description}`);
  return lines.join('\n');
});

function updateEdgeParam() {
  if (!selectedEdge.value) return;
  const { name, type, description } = edgeParam.value;
  edges.value = edges.value.map(e => e.id === selectedEdge.value!.id ? {
    ...e,
    label: name ? `:${name}` : undefined,
    labelStyle: { fill: '#7c3aed', fontWeight: 700, fontSize: 11, fontFamily: 'Inter, monospace' },
    labelBgStyle: { fill: '#f5f3ff', fillOpacity: 0.95 },
    labelBgPadding: [4, 6] as [number, number],
    labelBgBorderRadius: 4,
    data: { ...e.data, pathParam: { name, type, description } },
  } : e);
}
function clearEdgeParam() {
  if (!selectedEdge.value) return;
  edges.value = edges.value.map(e => e.id === selectedEdge.value!.id
    ? { ...e, label: undefined, data: { ...e.data, pathParam: null } } : e);
  edgeParam.value = { name: '', type: 'string', description: '' };
  selectedEdge.value = null;
}

// ── Save ─────────────────────────────────────────────
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle');
let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function saveFlow() {
  saveStatus.value = 'saving';
  try {
    const vp = getViewport();
    const payload = JSON.stringify({
      type: 'api-flow',
      nodes: nodes.value,
      edges: edges.value,
      components: components.value,
      viewport: { x: vp.x, y: vp.y, zoom: vp.zoom },
    });
    await registry.saveDefinition(apiId, version, payload);

    const openApiSpec = buildOpenApiSpec();
    console.log('[ApiDesigner] Saving OpenAPI spec:', JSON.stringify(openApiSpec, null, 2));
    await registry.saveOpenApiSpec(apiId, version, openApiSpec);

    saveStatus.value = 'saved';
  } catch (err: any) {
    console.error('[ApiDesigner] Save flow error:', err);
    saveStatus.value = 'error';
  }
  finally {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveStatus.value = 'idle'; }, 3000);
  }
}

// ── Visual Interaction Handlers ──────────────────────
function handleAddChildNode(e: any) {
  const { parentId, position } = e.detail;
  const id = `resource-${uid()}`;
  const parentNode = nodes.value.find(n => n.id === parentId);
  const isParentCollapsed = parentNode?.data?.collapsed ?? false;
  
  const newNode: Node = {
    id,
    type: 'resource',
    position: { x: position.x || 0, y: position.y || 0 },
    data: { 
      path: '/new-resource', 
      methods: [], 
      operationSpecs: {}, 
      description: '',
      operationName: '',
      security: '',
      isRoot: false,
      tags: [],
      hasChildren: false,
      collapsed: false
    },
  };
  
  if (isParentCollapsed) {
    newNode.hidden = true;
  }
  
  nodes.value.push(newNode);
  
  if (parentNode) {
    // Update hasChildren on the parent node in both VueFlow and our ref
    const parentIndex = nodes.value.findIndex(n => n.id === parentId);
    if (parentIndex !== -1) {
      nodes.value[parentIndex].data.hasChildren = true;
      updateNode(parentId, { data: { ...nodes.value[parentIndex].data } });
      nodes.value = [...nodes.value];
    }
  }
  
  edges.value.push({
    id: `e-${parentId}-${id}`,
    source: parentId,
    target: id,
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#0058bc' },
    style: { stroke: '#0058bc', strokeWidth: 2 },
  });
}

function handleDeleteNodeChildren(e: any) {
  const { nodeId } = e.detail;
  const childrenEdges = edges.value.filter(ev => ev.source === nodeId);
  const childrenIds = childrenEdges.map(ev => ev.target);
  if (childrenIds.length > 0) {
    removeNodes(childrenIds);
    edges.value = edges.value.filter(ev => ev.source !== nodeId);
    const parent = nodes.value.find(n => n.id === nodeId);
    if (parent) {
      parent.data.hasChildren = false;
      parent.data.collapsed = false;
      updateNode(nodeId, { data: { ...parent.data } });
    }
  }
}

function handleToggleNodeCollapse(e: any) {
  const { nodeId, collapsed } = e.detail;
  const node = nodes.value.find(n => n.id === nodeId);
  if (node) {
    node.data.collapsed = collapsed;
    updateNode(nodeId, { data: { ...node.data } });
  }
  const visit = (pid: string) => {
    const childEdges = edges.value.filter(ev => ev.source === pid);
    for (const edge of childEdges) {
      updateNode(edge.target, { hidden: collapsed });
      visit(edge.target);
    }
  };
  visit(nodeId);
}

// ── Load ─────────────────────────────────────────────
onMounted(async () => {
  window.addEventListener('add-child-node', handleAddChildNode);
  window.addEventListener('delete-node-children', handleDeleteNodeChildren);
  window.addEventListener('toggle-node-collapse', handleToggleNodeCollapse);
  
  // Always fetch fresh to get the latest saved definition
  const api = await registry.fetchApiById(apiId) as any;
  if (api) apiName.value = api.name ?? '';
  const ver = api?.versions?.find((v: any) => v.version === version);
  const def = ver?.definition;
  if (def) {
    try {
      const parsed = typeof def === 'string' ? JSON.parse(def) : def;
      if (parsed?.type === 'api-flow' && Array.isArray(parsed.nodes)) {
        nodes.value = parsed.nodes;
        edges.value = parsed.edges ?? [];
        components.value = parsed.components ?? [];
        
        // Set hasChildren on parent nodes based on edges
        const parentIds = new Set(edges.value.map(e => e.source));
        nodes.value.forEach(n => {
          if (parentIds.has(n.id)) {
            n.data.hasChildren = true;
          }
        });
        
        collapseAllSchemas();
        // Restore saved viewport or apply 75% default
        const vp = parsed.viewport;
        await nextTick();
        setViewport(vp ? { x: vp.x, y: vp.y, zoom: vp.zoom } : { x: 0, y: 0, zoom: 0.75 });
        return;
      }
    } catch { /* fall through */ }
  }
  nodes.value = [ROOT_NODE];
  edges.value = [];
  components.value = [];
  await nextTick();
  setViewport({ x: 0, y: 0, zoom: 0.75 });
});

import { onUnmounted } from 'vue';
onUnmounted(() => {
  window.removeEventListener('add-child-node', handleAddChildNode);
  window.removeEventListener('delete-node-children', handleDeleteNodeChildren);
  window.removeEventListener('toggle-node-collapse', handleToggleNodeCollapse);
  stopResizing();
  stopResizingLeft();
});

// ── YAML export ───────────────────────────────────────
function buildOpenApiSpec() {
  const pathMap: Record<string, string> = {};
  const rootNode = nodes.value.find(n => n.data.isRoot);
  const rootContext = rootNode?.data.rootContext || '';
  
  function buildFullPath(nodeId: string, visited = new Set<string>()): string {
    if (visited.has(nodeId)) return '';
    visited.add(nodeId);
    const node = nodes.value.find(n => n.id === nodeId);
    if (!node) return '';
    const inEdge = edges.value.find(e => e.target === nodeId);
    if (!inEdge) {
      // This is a direct child of root, prepend rootContext
      const nodePath = node.data.path || '/';
      return rootContext ? `${rootContext}${nodePath}` : nodePath;
    }
    const parentPath = buildFullPath(inEdge.source, visited);
    const param = inEdge.data?.pathParam?.name ? `/{${inEdge.data.pathParam.name}}` : '';
    return `${parentPath}${param}${node.data.path !== '/' ? node.data.path : ''}`;
  }
  nodes.value.forEach(n => { pathMap[n.id] = buildFullPath(n.id); });

  const nodeParams: Record<string, any[]> = {};
  edges.value.forEach(e => {
    const p = e.data?.pathParam;
    if (!p?.name) return;
    if (!nodeParams[e.target]) nodeParams[e.target] = [];
    nodeParams[e.target].push({ name: p.name, in: 'path', required: true, schema: { type: p.type || 'string' }, ...(p.description ? { description: p.description } : {}) });
  });

  const paths: Record<string, any> = {};
  nodes.value.forEach(n => {
    if (n.data.isRoot) return;
    const fullPath = pathMap[n.id] || '/';
    const pathItem: Record<string, any> = {};
    if (nodeParams[n.id]?.length) pathItem.parameters = nodeParams[n.id];
    const opSpecs = (n.data.operationSpecs || {}) as Record<string, OperationSpec>;
    (n.data.methods as string[] || []).forEach(verb => {
      const op = opSpecs[verb] || defaultOpSpec(verb);
      const operation: Record<string, any> = {
        summary: op.summary || n.data.operationName || `${verb} ${fullPath}`,
        operationId: `${verb.toLowerCase()}_${n.id.replace(/[^a-zA-Z0-9]/g, '_')}`,
        responses: Object.fromEntries(op.responses.map(r => {
          const schemaExists = components.value.some(s => s.name === r.schemaRef);
          return [r.statusCode || '200', {
            description: r.description,
            ...(r.schemaRef && schemaExists ? { content: { 'application/json': { schema: { $ref: `#/components/schemas/${r.schemaRef}` } } } } : {}),
          }];
        })),
      };
      if (op.description) operation.description = op.description;
      if (n.data.tags?.length) operation.tags = n.data.tags;
      if (n.data.security) {
        operation.security = [{ [n.data.security]: [] }];
      }
      if (op.parameters.length) operation.parameters = op.parameters.map(p => ({ name: p.name, in: 'query', required: p.required, schema: { type: p.type } }));
      if (op.requestBody.enabled) {
        const schemaExists = components.value.some(s => s.name === op.requestBody.schemaRef);
        operation.requestBody = {
          required: true,
          content: { [op.requestBody.contentType]: { schema: op.requestBody.schemaRef && schemaExists ? { $ref: `#/components/schemas/${op.requestBody.schemaRef}` } : { type: 'object' } } },
        };
      }
      pathItem[verb.toLowerCase()] = operation;
    });
    if (Object.keys(pathItem).length) paths[fullPath] = pathItem;
  });

  const schemasObj: Record<string, any> = {};
  components.value.forEach(s => {
    schemasObj[s.name] = {
      type: 'object',
      ...(s.description ? { description: s.description } : {}),
      properties: Object.fromEntries(s.properties.map(p => [p.name, { type: p.type }])),
      required: s.properties.filter(p => p.required).map(p => p.name),
    };
  });

  const infoObj: any = { 
    title: rootNode?.data.title || apiName.value || 'API', 
    version 
  };
  if (rootNode?.data.description) infoObj.description = rootNode.data.description;
  if (rootNode?.data.contactName || rootNode?.data.contactEmail) {
    infoObj.contact = {};
    if (rootNode?.data.contactName) infoObj.contact.name = rootNode.data.contactName;
    if (rootNode?.data.contactEmail) infoObj.contact.email = rootNode.data.contactEmail;
  }
  const doc: any = { openapi: '3.1.0', info: infoObj, paths };
  const allTags = [...new Set(nodes.value.flatMap(n => n.data.tags || []))];
  if (allTags.length) doc.tags = allTags.map(name => ({ name }));
  if (Object.keys(schemasObj).length || nodes.value.some(n => n.data.security)) {
    doc.components = { 
      ...(Object.keys(schemasObj).length ? { schemas: schemasObj } : {}),
      ...(nodes.value.some(n => n.data.security) ? {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
          oauth2: { type: 'oauth2', flows: { implicit: { authorizationUrl: 'https://example.com/auth', scopes: {} } } }
        }
      } : {})
    };
  }
  return doc;
}

function exportYaml() {
  const doc = buildOpenApiSpec();
  const yamlStr = yaml.dump(doc, { indent: 2, lineWidth: -1 });
  const blob = new Blob([yamlStr], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${(apiName.value || 'api').replace(/\s+/g, '-').toLowerCase()}-v${version}.yaml`;
  a.click(); URL.revokeObjectURL(url);
}

// ── Visual Design YAML export ─────────────────────────
function exportDesignYaml() {
  const apiSlug = (apiName.value || 'api').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const filename = `${apiSlug}-${version}-DESIGN.yaml`;

  const doc: any = {
    nexusDesign: '1.0',
    meta: { api: apiName.value || '', version, exportedAt: new Date().toISOString() },
    nodes: nodes.value.map(n => {
      const out: any = {
        id: n.id,
        position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
        path: n.data.path,
      };
      if (n.data.isRoot) {
        out.isRoot = true;
        if (n.data.title) out.title = n.data.title;
        if (n.data.description) out.description = n.data.description;
        if (n.data.contactName) out.contactName = n.data.contactName;
        if (n.data.contactEmail) out.contactEmail = n.data.contactEmail;
        if (n.data.rootContext) out.rootContext = n.data.rootContext;
      }
      if (n.data.operationName) out.operationName = n.data.operationName;
      if (n.data.security)      out.security      = n.data.security;
      if (n.data.tags?.length)   out.tags          = n.data.tags;
      if (n.data.hasChildren) out.hasChildren = n.data.hasChildren;
      if (n.data.collapsed) out.collapsed = n.data.collapsed;
      const methods = (n.data.methods as string[] | undefined) ?? [];
      if (methods.length) {
        out.methods = methods.map(verb => {
          const spec: OperationSpec = (n.data.operationSpecs as any)?.[verb] ?? defaultOpSpec(verb);
          const m: any = { verb };
          if (spec.summary)     m.summary     = spec.summary;
          if (spec.description) m.description = spec.description;
          if (spec.parameters.length) m.parameters = spec.parameters.map(p => ({ name: p.name, type: p.type, required: p.required }));
          if (spec.requestBody.enabled) m.requestBody = { contentType: spec.requestBody.contentType, ...(spec.requestBody.schemaRef ? { schemaRef: spec.requestBody.schemaRef } : {}) };
          if (spec.responses.length) m.responses = spec.responses.map(r => ({ statusCode: r.statusCode, description: r.description, ...(r.schemaRef ? { schemaRef: r.schemaRef } : {}) }));
          return m;
        });
      }
      return out;
    }),
    connections: edges.value.map(e => {
      const conn: any = { id: e.id, source: e.source, target: e.target };
      if (e.sourceHandle) conn.sourceHandle = e.sourceHandle;
      if (e.targetHandle) conn.targetHandle = e.targetHandle;
      const p = e.data?.pathParam;
      if (p?.name) conn.pathParam = { name: p.name, type: p.type ?? 'string', ...(p.description ? { description: p.description } : {}) };
      return conn;
    }),
  };

  if (components.value.length) {
    doc.components = components.value.map(s => ({
      name: s.name,
      ...(s.description ? { description: s.description } : {}),
      ...(s.properties.length ? { properties: s.properties.map(p => ({ name: p.name, type: p.type, required: p.required })) } : {}),
    }));
  }

  const blob = new Blob([yaml.dump(doc, { indent: 2, lineWidth: -1 })], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── YAML/JSON import ───────────────────────────────────────
const pendingImport = ref<{ doc: any; isNexusDesign: boolean } | null>(null);

function onFileImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      let doc: any;
      const content = e.target?.result as string;
      if (file.name.endsWith('.json')) {
        doc = JSON.parse(content);
      } else {
        doc = yaml.load(content);
      }
      console.log('Imported doc:', doc);
      if (doc?.nexusDesign) {
        pendingImport.value = { doc, isNexusDesign: true };
      } else if (doc?.openapi || doc?.swagger) {
        console.log('Importing OpenAPI doc with paths:', doc.paths ? Object.keys(doc.paths).length : 0);
        pendingImport.value = { doc, isNexusDesign: false };
      } else {
        console.warn('Unrecognized file format. Has openapi:', !!doc?.openapi, 'Has swagger:', !!doc?.swagger, 'Has nexusDesign:', !!doc?.nexusDesign);
      }
    } catch (err) { 
      console.error('Import error:', err); 
    }
    if (fileInputRef.value) fileInputRef.value.value = '';
  };
  reader.readAsText(file);
}

function confirmImport() {
  if (!pendingImport.value) return;
  if (pendingImport.value.isNexusDesign) {
    importNexusDesign(pendingImport.value.doc);
  } else {
    importOpenApiDoc(pendingImport.value.doc);
  }
  pendingImport.value = null;
}

function cancelImport() {
  pendingImport.value = null;
}

function importNexusDesign(doc: any) {
  const newNodes: Node[] = (doc.nodes ?? []).map((n: any) => ({
    id: n.id,
    type: 'resource',
    position: { x: n.position?.x ?? 0, y: n.position?.y ?? 0 },
    data: {
      path: n.path ?? '/resource',
      isRoot: !!n.isRoot,
      description: n.description ?? '',
      operationName: n.operationName ?? '',
      security: n.security ?? '',
      title: n.title ?? '',
      contactName: n.contactName ?? '',
      contactEmail: n.contactEmail ?? '',
      rootContext: n.rootContext ?? '',
      methods: (n.methods ?? []).map((m: any) => m.verb),
      tags: n.tags ?? [],
      hasChildren: !!n.hasChildren,
      collapsed: !!n.collapsed,
      operationSpecs: Object.fromEntries((n.methods ?? []).map((m: any) => [m.verb, {
        summary: m.summary ?? '',
        description: m.description ?? '',
        parameters: (m.parameters ?? []).map((p: any) => ({ id: uid(), name: p.name, type: p.type ?? 'string', required: !!p.required })),
        requestBody: m.requestBody
          ? { enabled: true, contentType: m.requestBody.contentType ?? 'application/json', schemaRef: m.requestBody.schemaRef ?? '' }
          : { enabled: false, contentType: 'application/json', schemaRef: '' },
        responses: (m.responses ?? []).map((r: any) => ({ id: uid(), statusCode: r.statusCode, description: r.description ?? '', schemaRef: r.schemaRef ?? '' })),
      } satisfies OperationSpec])),
    },
  }));

  const newEdges: Edge[] = (doc.connections ?? []).map((c: any) => {
    const p = c.pathParam;
    return {
      id: c.id,
      source: c.source,
      target: c.target,
      sourceHandle: c.sourceHandle,
      targetHandle: c.targetHandle,
      type: 'smoothstep',
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#0058bc' },
      style: { stroke: '#0058bc', strokeWidth: 2 },
      ...(p?.name ? {
        label: `:${p.name}`,
        labelStyle: { fill: '#7c3aed', fontWeight: 700, fontSize: 11, fontFamily: 'Inter, monospace' },
        labelBgStyle: { fill: '#f5f3ff', fillOpacity: 0.95 },
        labelBgPadding: [4, 6] as [number, number],
        labelBgBorderRadius: 4,
        data: { pathParam: { name: p.name, type: p.type ?? 'string', description: p.description ?? '' } },
      } : {}),
    } as Edge;
  });

  // Remove all existing non-root nodes and their edges before importing
  const nonRootIds = nodes.value.filter(n => !n.data.isRoot).map(n => n.id);
  removeNodes(nonRootIds);

  // Set hasChildren on parent nodes BEFORE assigning
  const parentIds = new Set(newEdges.map(e => e.source));
  newNodes.forEach(n => {
    if (parentIds.has(n.id)) {
      n.data.hasChildren = true;
    }
  });

  nodes.value = newNodes;
  edges.value = newEdges;
  
  components.value = (doc.components ?? []).map((s: any) => ({
    id: uid(), name: s.name, description: s.description ?? '',
    properties: (s.properties ?? []).map((p: any) => ({ id: uid(), name: p.name, type: p.type ?? 'string', required: !!p.required })),
  }));
  collapseAllSchemas();
  selectedNode.value = null; selectedEdge.value = null;
}

function importOpenApiDoc(doc: any) {
  const newNodes: Node[] = []; const newEdges: Edge[] = [];
  const pathToId: Record<string, string> = {};
  
  const resolveRef = (ref: string): any => {
    if (!ref) return null;
    const parts = ref.replace('#/', '').split('/');
    let current = doc;
    for (const p of parts) current = current?.[p];
    return current;
  };
  
  const extractProperties = (schema: any, required: string[] = []): { name: string; type: string; required: boolean }[] => {
    const props: { name: string; type: string; required: boolean }[] = [];
    if (!schema) return props;
    
    if (schema.allOf) {
      for (const s of schema.allOf) {
        if (s.$ref) {
          const resolved = resolveRef(s.$ref);
          props.push(...extractProperties(resolved, required));
        } else {
          props.push(...extractProperties(s, required));
        }
      }
      return props;
    }
    if (schema.anyOf) {
      for (const s of schema.anyOf) {
        if (s.$ref) {
          const resolved = resolveRef(s.$ref);
          props.push(...extractProperties(resolved, required));
        } else {
          props.push(...extractProperties(s, required));
        }
      }
      return props;
    }
    if (schema.oneOf) {
      for (const s of schema.oneOf) {
        if (s.$ref) {
          const resolved = resolveRef(s.$ref);
          props.push(...extractProperties(resolved, required));
        } else {
          props.push(...extractProperties(s, required));
        }
      }
      return props;
    }
    
    const properties = schema.properties || {};
    for (const [pname, pschema] of Object.entries(properties)) {
      const ps = pschema as any;
      let ptype = ps.type || 'string';
      if (ps.$ref) {
        const resolved = resolveRef(ps.$ref);
        ptype = resolved?.type ||resolved?.title || pname;
      }
      if (ps.items?.$ref) {
        const resolved = resolveRef(ps.items.$ref);
        ptype = `${resolved?.type || resolved?.title || 'object'}[]`;
      }
      if (ps.items?.type === 'array') {
        ptype = `${ps.items.items?.type || 'object'}[]`;
      }
      props.push({ name: pname, type: ptype, required: required.includes(pname) });
    }
    return props;
  };
  
  const collectedSchemas: Map<string, any> = new Map();
  let anonymousSchemaCount = 0;

  const processSchema = (schema: any, name?: string): string => {
    if (!schema) return name || '';
    
    // Better name resolution to avoid "Unknown" collisions
    let refName = name || schema.title || schema.$ref?.split('/').pop();
    
    if (!refName) {
      anonymousSchemaCount++;
      refName = `Schema_${anonymousSchemaCount}`;
    }

    if (collectedSchemas.has(refName)) return refName;
    
    const required = schema.required || [];
    const props = extractProperties(schema, required);
    collectedSchemas.set(refName, { 
      id: uid(), 
      name: refName, 
      description: schema.description || '',
      properties: props.map(p => ({ id: uid(), name: p.name, type: p.type, required: p.required }))
    });
    return refName;
  };
  
  if (doc.components?.schemas) {
    for (const [name, schema] of Object.entries(doc.components.schemas)) {
      processSchema(schema, name);
    }
  }
  if (doc.components?.requestBodies) {
    for (const [, body] of Object.entries(doc.components.requestBodies)) {
      const bt = body as any;
      if (bt.content) {
        for (const [ct, content] of Object.entries(bt.content)) {
          const ctent = content as any;
          if (ctent.schema) processSchema(ctent.schema);
        }
      }
    }
  }
  
  const allSchemas = Array.from(collectedSchemas.values());
  
  // Collect root-level tags from the OpenAPI doc
  const rootTags: string[] = [];
  if (doc.tags && Array.isArray(doc.tags)) {
    doc.tags.forEach((t: any) => {
      if (typeof t === 'string' && !rootTags.includes(t)) rootTags.push(t);
      else if (t?.name && typeof t.name === 'string' && !rootTags.includes(t.name)) rootTags.push(t.name);
    });
  }

  // Pre-initialize root node so children can connect to it
  newNodes.push({
    id: 'root',
    type: 'resource',
    position: { x: 30, y: 30 },
    data: { 
      path: '/', methods: [], operationSpecs: {}, 
      description: doc.info?.description || 'API Entry Point', 
      title: doc.info?.title || '',
      contactName: doc.info?.contact?.name || '',
      contactEmail: doc.info?.contact?.email || '',
      rootContext: '',
      isRoot: true, tags: rootTags 
    },
  });
  pathToId['/'] = 'root';

  const pathKeys = Object.keys(doc.paths || {});
  console.log('Importing paths:', pathKeys.length, pathKeys);
  
  pathKeys.sort((a, b) => a.split('/').length - b.split('/').length)
    .forEach((fullPath, i) => {
      const pathItem = doc.paths[fullPath];
      const verbs = ['get','post','put','patch','delete'].filter(m => pathItem[m]).map(m => m.toUpperCase());
      const operationSpecs: Record<string, OperationSpec> = {};
      
      verbs.forEach(verb => {
        const op = pathItem[verb.toLowerCase()];
        const params = (op.parameters || []).filter((p: any) => p.in === 'query').map((p: any) => ({ 
          id: uid(), 
          name: p.name, 
          type: p.schema?.type || 'string', 
          required: !!p.required 
        }));
        
        let requestBody = { enabled: false, contentType: 'application/json', schemaRef: '' };
        if (op.requestBody) {
          const content = op.requestBody.content || {};
          const ct = Object.keys(content)[0] || 'application/json';
          const schemaRef = processSchema(content[ct]?.schema);
          requestBody = { enabled: true, contentType: ct, schemaRef };
        }
        
        const responses = Object.entries(op.responses || {}).map(([code, r]: [string, any]) => {
          let schemaRef = '';
          if (r.content) {
            const ct = Object.keys(r.content)[0];
            schemaRef = processSchema(r.content[ct]?.schema);
          }
          return { id: uid(), statusCode: code, description: r.description || '', schemaRef };
        });
        
        operationSpecs[verb] = {
          summary: op.summary || '', 
          description: op.description || '',
          parameters: params,
          requestBody,
          responses,
        };
      });
      
      const segs = fullPath.split('/').filter(Boolean);
      const parentPath = segs.length <= 1 ? '/' : '/' + segs.slice(0, -1).join('/');
      const col = segs.length - 1; 

      // If this is the root path '/', just update the existing root node
      if (fullPath === '/') {
        const firstOp = pathItem[verbs[0]?.toLowerCase()];
        const rootNode = newNodes.find(n => n.id === 'root');
        if (rootNode) {
          rootNode.data.description = firstOp?.description || 'API Entry Point';
          // Discard methods on root node as per requirement
        }
        return;
      }

      const id = `imported-${i}`;
      const siblings = newNodes.filter((n: any) => n._col === col);
      const row = siblings.length;
      const firstOp = pathItem[verbs[0]?.toLowerCase()];

      // Extract tags from the first operation - collect all unique tags across all verbs
      const allOpTags: string[] = [];
      verbs.forEach(verb => {
        const op = pathItem[verb.toLowerCase()];
        if (op?.tags && Array.isArray(op.tags)) {
          op.tags.forEach((t: string) => {
            if (!allOpTags.includes(t)) allOpTags.push(t);
          });
        }
      });

      const node: any = { 
        id, 
        type: 'resource', 
        position: { x: col * 280, y: (row + 1) * 100 }, 
        _col: col, 
        data: { 
          path: '/' + (segs[segs.length - 1] || ''), 
          methods: verbs, 
          operationSpecs, 
          description: firstOp?.description || '', 
          operationName: firstOp?.summary || '',
          security: firstOp?.security?.[0] ? Object.keys(firstOp.security[0])[0] : '',
          isRoot: false,
          tags: allOpTags,
          hasChildren: false,
          collapsed: false
        } 
      };
      newNodes.push(node);
      pathToId[fullPath] = id;
      
      if (pathToId[parentPath]) {
        const param = (pathItem.parameters || []).filter((p: any) => p.in === 'path')[0];
        newEdges.push({ 
          id: `e-${pathToId[parentPath]}-${id}`, 
          source: pathToId[parentPath], 
          target: id, 
          type: 'smoothstep', 
          markerEnd: { type: MarkerType.ArrowClosed, color: '#0058bc' }, 
          style: { stroke: '#0058bc', strokeWidth: 2 }, 
          ...(param ? { 
            label: `:${param.name}`, 
            labelStyle: { fill: '#7c3aed', fontWeight: 700, fontSize: 11 }, 
            labelBgStyle: { fill: '#f5f3ff', fillOpacity: 0.95 }, 
            labelBgPadding: [4, 6] as [number, number], 
            labelBgBorderRadius: 4, 
            data: { pathParam: { name: param.name, type: param.schema?.type || 'string', description: param.description || '' } } 
          } : {}) 
        });
      } else {
        // Top-level resource: connect directly to root node
        const param = (pathItem.parameters || []).filter((p: any) => p.in === 'path')[0];
        newEdges.push({ 
          id: `e-root-${id}`, 
          source: 'root', 
          target: id, 
          type: 'smoothstep', 
          markerEnd: { type: MarkerType.ArrowClosed, color: '#0058bc' }, 
          style: { stroke: '#0058bc', strokeWidth: 2 }, 
          ...(param ? { 
            label: `:${param.name}`, 
            labelStyle: { fill: '#7c3aed', fontWeight: 700, fontSize: 11 }, 
            labelBgStyle: { fill: '#f5f3ff', fillOpacity: 0.95 }, 
            labelBgPadding: [4, 6] as [number, number], 
            labelBgBorderRadius: 4, 
            data: { pathParam: { name: param.name, type: param.schema?.type || 'string', description: param.description || '' } } 
          } : {}) 
        });
      }
    });
  
  console.log('Created nodes:', newNodes.length, newNodes.map(n => ({ id: n.id, path: n.data.path })));
  console.log('Created edges:', newEdges.length);
  
  // Set hasChildren on parent nodes BEFORE assigning to nodes.value
  const parentIds = new Set(newEdges.map(e => e.source));
  newNodes.forEach(n => {
    if (parentIds.has(n.id)) {
      n.data.hasChildren = true;
    }
  });
  
  nodes.value = newNodes; 
  edges.value = newEdges;
  
  components.value = [...allSchemas];
  collapseAllSchemas();
  selectedNode.value = null; selectedEdge.value = null;
  nextTick(() => {
    fitView({ padding: 0.2 });
  });
}

// ── AI Designer ──────────────────────────────────────
interface AiChatMsg { role: 'user' | 'assistant'; text: string; design?: any; }

const showAiPanel   = ref(false);
const aiMessages    = ref<AiChatMsg[]>([]);
const aiInput       = ref('');
const aiLoading     = ref(false);
const chatScrollRef = ref<HTMLElement | null>(null);

const AI_SYSTEM_PROMPT = `You are an AI API Designer for Nexus API Manager.
When the user requests an API design or modifications, respond with a brief explanation followed by a JSON code block.
The JSON must use EXACTLY this structure:

\`\`\`json
{
  "type": "api-flow",
  "nodes": [
    {
      "id": "root",
      "type": "resource",
      "position": { "x": 0, "y": 0 },
      "data": {
        "path": "/resource",
        "isRoot": true,
        "description": "",
        "rootContext": "/api/v1",
        "methods": ["GET"],
        "operationSpecs": {
          "GET": {
            "summary": "", "description": "",
            "parameters": [{ "id": "p1", "name": "param", "type": "string", "required": false }],
            "requestBody": { "enabled": false, "contentType": "application/json", "schemaRef": "" },
            "responses": [{ "id": "r1", "statusCode": "200", "description": "Success", "schemaRef": "" }]
          }
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e-root-child",
      "source": "root", "target": "child",
      "sourceHandle": "bottom", "targetHandle": "top",
      "type": "smoothstep", "animated": false,
      "data": { "pathParam": { "name": "id", "type": "string", "description": "" } }
    }
  ],
  "components": [
    {
      "id": "s1", "name": "SchemaName", "description": "",
      "properties": [{ "id": "prop1", "name": "field", "type": "string", "required": false }]
    }
  ]
}
\`\`\`

Layout rules: root node at {x:0,y:0}; each child level adds 160 to y; siblings spaced 300px on x.
Use "bottom"→"top" handles for vertical trees. Always include operationSpecs for every method listed.
Omit edges/components arrays only if empty. All ids must be unique strings.`;

function buildSystemPrompt() {
  const state = JSON.stringify({ nodes: nodes.value, edges: edges.value, components: components.value });
  return `${AI_SYSTEM_PROMPT}\n\nCurrent canvas: ${state}`;
}

function parseAiContent(content: string): { text: string; design: any | null } {
  const match = content.match(/```json\s*([\s\S]*?)```/);
  if (match) {
    try {
      const design = JSON.parse(match[1]);
      if (design?.type === 'api-flow') {
        const text = content.replace(/```json[\s\S]*?```/, '').trim() || 'Design generated.';
        return { text, design };
      }
    } catch { /* not valid JSON */ }
  }
  return { text: content, design: null };
}

async function sendAiMessage() {
  const msg = aiInput.value.trim();
  if (!msg || aiLoading.value) return;
  aiInput.value = '';
  aiMessages.value.push({ role: 'user', text: msg });
  aiLoading.value = true;
  await scrollChat();

  try {
    const auth = (await import('../stores/auth')).useAuthStore();
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const history = aiMessages.value
      .slice(0, -1)                    // exclude just-added user msg (will be sent below)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

    const messages = [
      { role: 'system',    content: buildSystemPrompt() },
      ...history,
      { role: 'user',      content: msg },
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

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      aiMessages.value.push({ role: 'assistant', text: `Error: ${err.error}` });
    } else {
      const data = await res.json();
      const { text, design } = parseAiContent(data.content ?? '');
      aiMessages.value.push({ role: 'assistant', text, design: design ?? undefined });
    }
  } catch (e: any) {
    aiMessages.value.push({ role: 'assistant', text: `Error: ${e.message}` });
  } finally {
    aiLoading.value = false;
    await scrollChat();
  }
}

function applyAiDesign(design: any) {
  if (!design) return;
  nodes.value      = design.nodes      ?? [];
  edges.value      = design.edges      ?? [];
  components.value = design.components ?? [];
  collapseAllSchemas();
  selectedNode.value = null;
  selectedEdge.value = null;
}

async function scrollChat() {
  await nextTick();
  if (chatScrollRef.value) chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
}

// ── AI Reviewer ──────────────────────────────────────
const showReviewPanel = ref(false);
const reviewLoading   = ref(false);
const reviewResult    = ref('');
const reviewSaved     = ref(false);

async function runApiReview() {
  if (reviewLoading.value || !llmPrefs.isConfigured) return;
  reviewLoading.value = true;
  reviewResult.value  = '';
  reviewSaved.value   = false;

  try {
    const auth = (await import('../stores/auth')).useAuthStore();
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const spec = buildOpenApiSpec();

    const res = await fetch(`${bffBase}/ai/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        provider: llmPrefs.provider,
        apiKey: llmPrefs.currentApiKey,
        customApiUrl: llmPrefs.apiUrl,
        model: llmPrefs.model,
        spec
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      reviewResult.value = `Error: ${err.error}`;
    } else {
      const data = await res.json();
      reviewResult.value = data.content ?? 'No review content received.';
    }
  } catch (e: any) {
    reviewResult.value = `Error: ${e.message}`;
  } finally {
    reviewLoading.value = false;
  }
}

async function saveReviewReport() {
  if (!reviewResult.value || !llmPrefs.isConfigured) return;
  try {
    const auth = (await import('../stores/auth')).useAuthStore();
    const token = await auth.getToken();
    const bffBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const res = await fetch(`${bffBase}/apis/${apiId}/versions/${version}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content: reviewResult.value }),
    });

    if (!res.ok) {
      console.error('Failed to save review report');
    } else {
      reviewSaved.value = true;
      setTimeout(() => { reviewSaved.value = false; }, 3000);
    }
  } catch (e) {
    console.error('Error saving review report:', e);
  }
}

function goBack() { router.push(`/projects/${apiId}`); }
</script>

<style scoped>
.flow-canvas { width: 100%; height: 100%; background: #f4f3f8; }

/* ── Toolbar ─────────────────── */
.toolbar-icon-btn { display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;color:#414755;transition:background 0.12s,color 0.12s; }
.toolbar-icon-btn:hover,.toolbar-icon-btn--active { background:#f4f3f8;color:#0058bc; }
.toolbar-divider { width:1px;height:20px;background:#e3e2e7; }

/* ── Left components panel ───── */
.components-panel { position:absolute;top:0;left:0;bottom:0;background:#fff;border-right:1px solid #e3e2e7;display:flex;flex-direction:column;overflow-y:auto;z-index:20;box-shadow:4px 0 16px rgba(0,0,0,0.06); transition: transform 0.22s cubic-bezier(0.4,0,0.2,1); }
.components-panel:not(.panel-left-slide-enter-active):not(.panel-left-slide-leave-active) { transition: none; }

.panel-resizer-right {
  position: absolute; top: 0; right: -3px; bottom: 0; width: 6px;
  cursor: col-resize; z-index: 30; display: flex; align-items: center; justify-content: center;
}
.panel-resizer-right .panel-resizer-line {
  width: 3px; height: 100%; background: transparent; transition: background 0.15s;
}
.panel-resizer-right:hover .panel-resizer-line {
  background: #3b82f6;
}

.panel-left-slide-enter-active,.panel-left-slide-leave-active { transition:transform 0.22s cubic-bezier(0.4,0,0.2,1); }
.panel-left-slide-enter-from,.panel-left-slide-leave-to { transform:translateX(-100%); }

/* ── Right properties panel ──── */
.properties-panel { position:absolute;top:0;right:0;bottom:0;background:#fff;border-left:1px solid #e3e2e7;display:flex;flex-direction:column;overflow-y:auto;z-index:20;box-shadow:-4px 0 16px rgba(0,0,0,0.06); transition: transform 0.22s cubic-bezier(0.4,0,0.2,1); }
.properties-panel:not(.panel-slide-enter-active):not(.panel-slide-leave-active) { transition: none; } /* Disable transition during drag */

.panel-resizer {
  position: absolute; top: 0; left: -3px; bottom: 0; width: 6px;
  cursor: col-resize; z-index: 30; display: flex; align-items: center; justify-content: center;
}
.panel-resizer-line {
  width: 3px; height: 100%; background: transparent; transition: background 0.15s;
}
.panel-resizer:hover .panel-resizer-line {
  background: #3b82f6; /* Blue handle from screenshot */
}

.panel-slide-enter-active,.panel-slide-leave-active { transition:transform 0.22s cubic-bezier(0.4,0,0.2,1); }
.panel-slide-enter-from,.panel-slide-leave-to { transform:translateX(100%); }

/* ── Shared panel ────────────── */
.panel-header { display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e3e2e7;flex-shrink:0; }
.panel-close { color:#a0a7b5;transition:color 0.12s;line-height:0; }
.panel-close:hover { color:#1a1b1f; }
.panel-section { padding:14px 16px;border-bottom:1px solid #f0eff5; }
.panel-section--danger { border-bottom:none; }
.panel-label { display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#a0a7b5;margin-bottom:8px; }
.panel-input { width:100%;padding:7px 10px;border:1px solid #e3e2e7;border-radius:8px;font-size:13px;font-family:'Inter',sans-serif;color:#1a1b1f;background:#faf9fe;outline:none;transition:border-color 0.15s; }
.panel-input:focus { border-color:#0058bc; }
.panel-textarea { width:100%;padding:7px 10px;border:1px solid #e3e2e7;border-radius:8px;font-size:13px;font-family:'Inter',sans-serif;color:#1a1b1f;background:#faf9fe;outline:none;resize:vertical;transition:border-color 0.15s; }
.panel-textarea:focus { border-color:#0058bc; }
.panel-hint { margin-top:5px;font-size:11px;color:#a0a7b5; }
.panel-hint code { font-family:monospace;background:#f4f3f8;padding:1px 4px;border-radius:4px; }

/* ── Schema card ─────────────── */
.schema-card { border-bottom:1px solid #f0eff5; }
.schema-card-header { display:flex;align-items:center;gap:6px;padding:10px 16px;user-select:none;transition:background 0.1s; }
.schema-card-header:hover { background:#faf9fe; }
.schema-chevron { transition:transform 0.18s cubic-bezier(0.4,0,0.2,1); }
.schema-chevron--open { transform:rotate(90deg); }
.schema-body { padding:0 16px 12px 16px; }
.schema-name-input { flex:1;padding:4px 8px;border:1px solid #e3e2e7;border-radius:6px;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;color:#1a1b1f;background:#faf9fe;outline:none;min-width:0; }
.schema-name-input:focus { border-color:#0058bc; }
.schema-prop-count { flex-shrink:0;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;background:#eff6ff;color:#0058bc;font-family:'Inter',sans-serif; }
.prop-row,.param-row { display:flex;align-items:center;gap:4px;margin-bottom:4px;flex-wrap:wrap; }
.response-row { display:flex;align-items:center;gap:4px;margin-bottom:8px;flex-wrap:wrap; }
.prop-input { flex:1;min-width:0;padding:4px 7px;border:1px solid #e3e2e7;border-radius:6px;font-size:12px;font-family:'Inter',monospace;color:#1a1b1f;background:#faf9fe;outline:none; }
.prop-input:focus { border-color:#0058bc; }
.prop-select { padding:4px 5px;border:1px solid #e3e2e7;border-radius:6px;font-size:12px;color:#1a1b1f;background:#faf9fe;outline:none;max-width:80px; }
.prop-req { cursor:pointer;line-height:0;flex-shrink:0; }
.status-input { width:44px;flex-shrink:0;padding:4px 6px;border:1px solid #e3e2e7;border-radius:6px;font-size:12px;font-family:monospace;color:#1a1b1f;background:#faf9fe;outline:none;text-align:center; }
.status-input:focus { border-color:#0058bc; }
.btn-add { display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;font-weight:600;color:#0058bc;padding:7px 12px;border-radius:10px;border:1.5px dashed #93c5fd;background:#eff6ff;cursor:pointer;transition:background 0.12s;width:100%; }
.btn-add:hover { background:#dbeafe; }
.btn-add-small { font-size:11px;font-weight:600;color:#0058bc;cursor:pointer;padding:2px 6px;border-radius:6px;border:1px dashed #93c5fd;background:#eff6ff;transition:background 0.12s; }
.btn-add-small:hover { background:#dbeafe; }

/* ── Methods list ────────────── */
.methods-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.method-row { display:flex;align-items:center;gap:6px; }
.method-toggle { display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid #e3e2e7;color:#717786;transition:border-color 0.12s,background 0.12s;user-select:none;flex:1; }
.method-toggle--on { border-color:#0058bc;background:#eff6ff;color:#0058bc; }
.method-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0; }
.method-edit-btn { display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;color:#414755;border:1px solid #e3e2e7;background:#faf9fe;transition:background 0.12s,color 0.12s;cursor:pointer;flex-shrink:0; }
.method-edit-btn:hover { background:#eff6ff;color:#0058bc;border-color:#0058bc; }
.method-badge-lg { padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;font-family:'Inter',sans-serif; }

/* ── Toggle switch ───────────── */
.toggle-switch { cursor:pointer;line-height:0;flex-shrink:0; }
.toggle-track { display:inline-block;width:34px;height:18px;border-radius:9px;background:#d1d5db;transition:background 0.15s;position:relative; }
.toggle-track::after { content:'';position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.2); }
.toggle-track--on { background:#0058bc; }
.toggle-track--on::after { transform:translateX(16px); }

/* ── Preview code block ──────── */
.param-preview { background:#1a1b1f;border-radius:10px;padding:12px 14px; }
.param-code { font-family:'Fira Code','Cascadia Code',monospace;font-size:11px;color:#c9d1d9;margin:0;white-space:pre;line-height:1.6; }

/* ── Danger button ───────────── */
.btn-danger { display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#991b1b;padding:7px 12px;border-radius:10px;border:1.5px solid #fecaca;background:#fff;cursor:pointer;transition:background 0.12s;width:100%;justify-content:center; }
.btn-danger:hover { background:#fef2f2; }

/* ── AI toolbar button ───────── */
.ai-btn { color:#7c3aed !important; }
.ai-btn:hover,.ai-btn.toolbar-icon-btn--active { background:#f5f3ff !important;color:#7c3aed !important; }

/* ── AI panel ────────────────── */
.ai-panel {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 360px;
  background: #ffffff;
  border-top: 1px solid #e3e2e7;
  display: flex; flex-direction: column;
  z-index: 25;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
}
.panel-bottom-slide-enter-active,.panel-bottom-slide-leave-active { transition: transform 0.22s cubic-bezier(0.4,0,0.2,1); }
.panel-bottom-slide-enter-from,.panel-bottom-slide-leave-to { transform: translateY(100%); }

.ai-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #f0eff5;
  flex-shrink: 0;
}
.ai-model-badge {
  font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 10px;
  background: #f5f3ff; color: #7c3aed; font-family: 'Inter', sans-serif;
}

/* Not-configured empty state */
.ai-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px;
}
.ai-setup-btn {
  padding: 7px 18px; border-radius: 10px; font-size: 13px; font-weight: 700;
  background: #7c3aed; color: #fff; border: none; cursor: pointer; transition: opacity 0.15s;
}
.ai-setup-btn:hover { opacity: 0.85; }

/* Messages area */
.ai-messages {
  flex: 1; overflow-y: auto; padding: 12px 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.ai-welcome {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  opacity: 0.7;
}

.ai-msg-row { display: flex; flex-direction: column; gap: 4px; }
.ai-msg-row--user  { align-items: flex-end; }
.ai-msg-row--assistant { align-items: flex-start; }

.ai-bubble {
  max-width: 85%; padding: 8px 12px; border-radius: 12px;
  font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-word;
  font-family: 'Inter', sans-serif;
}
.ai-bubble--user      { background: #0058bc; color: #fff; border-radius: 12px 12px 2px 12px; }
.ai-bubble--assistant { background: #f4f3f8; color: #1a1b1f; border-radius: 12px 12px 12px 2px; }
.ai-bubble--loading   { padding: 12px 16px; display: flex; gap: 5px; align-items: center; }

/* Typing dots */
.ai-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #a0a7b5;
  animation: ai-bounce 1.2s infinite ease-in-out;
}
.ai-dot:nth-child(2) { animation-delay: 0.2s; }
.ai-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes ai-bounce {
  0%,80%,100% { transform: scale(0.7); opacity: 0.5; }
  40%          { transform: scale(1);   opacity: 1; }
}

/* Apply button */
.ai-apply-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 700;
  background: #7c3aed; color: #fff; border: none; cursor: pointer;
  transition: opacity 0.15s; align-self: flex-start; margin-top: 2px;
}
.ai-apply-btn:hover { opacity: 0.85; }

/* Input row */
.ai-input-row {
  display: flex; gap: 8px; padding: 10px 16px;
  border-top: 1px solid #f0eff5; flex-shrink: 0;
}
.ai-textarea {
  flex: 1; resize: none; padding: 8px 12px; border: 1px solid #e3e2e7;
  border-radius: 10px; font-size: 13px; font-family: 'Inter', sans-serif;
  color: #1a1b1f; background: #faf9fe; outline: none; line-height: 1.5;
  transition: border-color 0.15s;
}
.ai-textarea:focus { border-color: #7c3aed; }
.ai-send-btn {
  flex-shrink: 0; width: 38px; height: 38px; border-radius: 10px;
  background: #7c3aed; color: #fff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s; align-self: flex-end;
}
.ai-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ai-send-btn:not(:disabled):hover { opacity: 0.85; }

/* ── AI Reviewer panel ────────────────── */
.review-btn { color:#7c3aed !important; }
.review-btn:hover,.review-btn.toolbar-icon-btn--active { background:#f5f3ff !important;color:#7c3aed !important; }

.review-panel {
  position: absolute; top: 0; right: 0; bottom: 0;
  width: 420px;
  background: #ffffff;
  border-left: 1px solid #e3e2e7;
  display: flex; flex-direction: column;
  z-index: 25;
  box-shadow: -4px 0 20px rgba(0,0,0,0.08);
}
.panel-right-slide-enter-active,.panel-right-slide-leave-active { transition: transform 0.22s cubic-bezier(0.4,0,0.2,1); }
.panel-right-slide-enter-from,.panel-right-slide-leave-to { transform: translateX(100%); }

.review-content { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; }

.review-start {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 40px;
}

.review-criteria {
  display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 280px;
  margin-top: 16px;
}
.review-criteria-item {
  display: flex; align-items: center; gap: 10px;
  font-size: 12px; color: #414755;
}

.review-loading {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 60px;
}

.review-result { flex: 1; overflow-y: auto; }

.review-output {
  font-size: 12px; line-height: 1.6; color: #1a1b1f;
  white-space: pre-wrap; word-break: break-word;
  background: #faf9fe; border-radius: 10px; padding: 12px;
  border: 1px solid #e3e2e7;
}

.review-saved-msg {
  font-size: 12px; font-weight: 600; color: #047857;
  text-align: center; padding: 8px; margin-bottom: 8px;
  background: #dcfce7; border-radius: 8px;
}

/* ── Tags ─────────────────────────────────── */
.tags-container {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.tag-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 6px;
  background: #eff6ff; color: #0058bc;
  font-size: 11px; font-weight: 600;
  font-family: 'Inter', sans-serif;
}
.tag-remove {
  display: flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; border-radius: 50%;
  background: transparent; border: none; cursor: pointer;
  padding: 0; color: #0058bc;
  transition: background 0.15s;
}
.tag-remove:hover { background: rgba(0,88,188,0.15); }

/* ── Import Confirmation Modal ──────────────── */
.modal-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.modal-box {
  background: #ffffff; border-radius: 16px; padding: 32px;
  max-width: 400px; width: 90%;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  text-align: center;
}
.modal-icon { margin-bottom: 16px; }
.modal-title {
  font-size: 18px; font-weight: 700; color: #1a1b1f;
  margin: 0 0 12px;
  font-family: 'Inter', sans-serif;
}
.modal-text {
  font-size: 14px; color: #414755; line-height: 1.5;
  margin: 0 0 24px;
  font-family: 'Inter', sans-serif;
}
.modal-actions {
  display: flex; gap: 12px; justify-content: center;
}
.modal-btn {
  padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;
  font-family: 'Inter', sans-serif; cursor: pointer; transition: opacity 0.15s;
  border: none;
}
.modal-btn--cancel {
  background: #f1f1f1; color: #414755;
}
.modal-btn--cancel:hover { background: #e3e2e7; }
.modal-btn--confirm {
  background: #991b1b; color: #ffffff;
}
.modal-btn--confirm:hover { opacity: 0.85; }
.modal-fade-enter-active,.modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from,.modal-fade-leave-to { opacity: 0; }
</style>
