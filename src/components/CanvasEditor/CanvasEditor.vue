<template>
  <div class="canvas-editor" :class="{ 'editing': isEditing }">
    <!-- Editor Toolbar -->
    <EditorToolbar
      v-if="canEdit"
      :activeTool="activeTool"
      :zoom="zoom"
      :selectedConnectionType="selectedConnectionType"
      :canUndo="canUndo"
      :canRedo="canRedo"
      :canSave="true"
      @update:activeTool="activeTool = $event"
      @update:selectedConnectionType="selectedConnectionType = $event"
      @save="saveCanvas"
      @undo="undo"
      @redo="redo"
      @export="exportCanvas('png')"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @zoom-reset="resetZoom"
      @quick-add-card="quickAddCard"
    />

    <!-- Canvas Area -->
    <div 
      ref="canvasRef"
      class="editor-canvas"
      :class="{ 'tool-select': activeTool === 'select', 'tool-drag': isDragging }"
      @mousedown="onCanvasMouseDown"
      @mousemove="onCanvasMouseMove"
      @mouseup="onCanvasMouseUp"
      @mouseleave="onCanvasMouseLeave"
      @wheel="onWheel"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <!-- Grid Background -->
      <div class="canvas-grid" :style="gridStyle"></div>

      <!-- Connection Lines Layer -->
      <svg class="connections-layer">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#b55d3a" />
          </marker>
        </defs>
        
        <g v-for="connection in connections" :key="connection.id">
          <line
            :x1="connection.x1"
            :y1="connection.y1"
            :x2="connection.x2"
            :y2="connection.y2"
            :stroke="connection.color"
            :stroke-width="3"
            :stroke-dasharray="getStrokePattern(connection.type)"
            :marker-end="getArrowMarker(connection.type)"
            class="connection-line"
            :class="{ selected: selectedElementId === connection.id }"
            @click="selectElement(connection)"
          />
          <foreignObject
            :x="(connection.x1 + connection.x2) / 2 - 50"
            :y="(connection.y1 + connection.y2) / 2 - 12"
            width="100"
            height="24"
            v-if="showConnectionLabels"
          >
            <div class="connection-label">{{ getConnectionLabel(connection.type) }}</div>
          </foreignObject>
        </g>
      </svg>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading canvas...</div>
      </div>

      <!-- Elements Layer -->
      <div
        v-for="element in elements"
        :key="element.id"
        class="canvas-element"
        :class="[
          `type-${element.type}`,
          { selected: selectedElementId === element.id },
          { 'selected-multi': selectedElements.has(element.id) },
          { dragging: draggingElementId === element.id }
        ]"
        :style="getElementStyle(element)"
        @mousedown.stop="onElementMouseDown($event, element)"
        @dblclick.stop="editElement(element)"
      >
        <!-- Render element content based on type -->
        <component 
          :is="getElementComponent(element.type)" 
          :content="element.content"
        />

        <!-- Resize handles (when selected and can edit) -->
        <div v-if="selectedElementId === element.id && canEdit" class="resize-handles">
          <div class="resize-handle nw" @mousedown.stop="startResize($event, element, 'nw')"></div>
          <div class="resize-handle ne" @mousedown.stop="startResize($event, element, 'ne')"></div>
          <div class="resize-handle sw" @mousedown.stop="startResize($event, element, 'sw')"></div>
          <div class="resize-handle se" @mousedown.stop="startResize($event, element, 'se')"></div>
        </div>

        <!-- Delete button (when selected and can edit) -->
        <button 
          v-if="selectedElementId === element.id && canEdit"
          class="delete-element-btn"
          @click.stop="deleteElement(element)"
        >×</button>
      </div>

      <!-- Drag preview for new elements -->
      <div
        v-if="isCreatingElement"
        class="drag-preview"
        :style="dragPreviewStyle"
      >
        <div class="preview-placeholder">+ {{ activeTool }}</div>
      </div>
    </div>

    <!-- Properties Panel (when element is selected) -->
    <PropertiesPanel
      v-if="selectedElement && canEdit"
      :element="selectedElement"
      @update="updateElement"
      @close="selectedElement = null"
    />

    <!-- Edit mode indicator -->
    <div v-if="!canEdit" class="read-only-badge">
      👁️ {{ $t('editor.readOnly') }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import { useGalleryStore } from '../../stores/gallery'
import { useRealtimeStore } from '../../stores/realtimeStore'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import EditorToolbar from './EditorToolbar.vue'
import { useCanvasElements } from './composables/useCanvasElements'
import { useCanvasHistory } from './composables/useCanvasHistory'
import { useCanvasZoom } from './composables/useCanvasZoom'
import { CONNECTION_TYPES, getStrokePattern, hasArrow } from './utils/connectionTypes'

// Import element components
import CardElement from './elements/CardElement.vue'
import TextElement from './elements/TextElement.vue'
import ImageElement from './elements/ImageElement.vue'
import LinkElement from './elements/LinkElement.vue'
import NoteElement from './elements/NoteElement.vue'

const { t } = useI18n()
const auth = useAuthStore()
const galleryStore = useGalleryStore()
const realtimeStore = useRealtimeStore()

const props = defineProps({
  projectId: { type: String, required: true },
  canEdit: { type: Boolean, default: false }
})

// Use composables
const {
  elements,
  connections,
  selectedElement,
  selectedElementId,
  selectedElements,
  selectElement,
  createElement,
  updateElement: updateElementBase,
  deleteElement: deleteElementBase,
  duplicateElement,
  buildConnections,
  loadElements: loadElementsBase,
  saveElements,
  getDefaultContent,
  getDefaultSize,
  getConnectionColor,
  clearSelection
} = useCanvasElements(props.projectId)

const {
  addToHistory,
  undo: undoHistory,
  redo: redoHistory,
  canUndo,
  canRedo
} = useCanvasHistory(elements, saveElements)

const {
  zoom,
  isDragging,
  gridStyle,
  zoomIn,
  zoomOut,
  resetZoom,
  startDrag,
  updateDrag,
  endDrag,
  onTouchStart,
  onTouchMove,
  onTouchEnd
} = useCanvasZoom(1)

// Component state
const canvasRef = ref(null)
const isEditing = ref(false)
const activeTool = ref('select')
const selectedConnectionType = ref('subProject')
const draggingElementId = ref(null)
const isCreatingElement = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragCurrentPos = ref({ x: 0, y: 0 })
const resizingElement = ref(null)
const resizeHandle = ref(null)
const showConnectionLabels = ref(true)
const isLoading = ref(true)
const saveTimer = ref(null)
const isShiftPressed = ref(false)

// Computed
const dragPreviewStyle = computed(() => ({
  left: `${dragCurrentPos.value.x}px`,
  top: `${dragCurrentPos.value.y}px`,
  transform: `scale(${zoom.value})`
}))

// Element component mapping
function getElementComponent(type) {
  const components = {
    card: CardElement,
    text: TextElement,
    image: ImageElement,
    link: LinkElement,
    note: NoteElement
  }
  return components[type] || TextElement
}

// Styles
function getElementStyle(element) {
  return {
    left: `${element.position_x}px`,
    top: `${element.position_y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    transform: `rotate(${element.rotation || 0}deg) scale(${zoom.value})`,
    zIndex: element.z_index || 0
  }
}

function getArrowMarker(type) {
  return hasArrow(type) ? 'url(#arrowhead)' : ''
}

function getConnectionLabel(type) {
  const connType = CONNECTION_TYPES.find(ct => ct.name === type)
  return t(connType?.label_key || type)
}

// Mouse handlers
function onCanvasMouseDown(e) {
  if (e.button !== 0) return
  
  isShiftPressed.value = e.shiftKey
  dragStartPos.value = { x: e.clientX, y: e.clientY }
  
  if (activeTool.value !== 'select') {
    isCreatingElement.value = true
  } else {
    if (!isShiftPressed.value) {
      clearSelection()
    }
    startDrag(e.clientX, e.clientY)
  }
}

function onCanvasMouseMove(e) {
  dragCurrentPos.value = { x: e.clientX, y: e.clientY }
  
  if (isCreatingElement.value) {
    // Update drag preview position
  } else if (draggingElementId.value) {
    // Move element
    const element = elements.value.find(el => el.id === draggingElementId.value)
    if (element) {
      const dx = (e.movementX || 0) / zoom.value
      const dy = (e.movementY || 0) / zoom.value
      element.position_x += dx
      element.position_y += dy
    }
  } else if (resizingElement.value) {
    handleResize(e)
  }
}

function onCanvasMouseUp(e) {
  if (isCreatingElement.value) {
    createNewElement(dragCurrentPos.value)
  }
  
  isCreatingElement.value = false
  endDrag()
  draggingElementId.value = null
  resizingElement.value = null
}

function onCanvasMouseLeave() {
  isCreatingElement.value = false
  endDrag()
}

function onElementMouseDown(e, element) {
  if (e.button !== 0) return
  
  e.stopPropagation()
  
  if (isShiftPressed.value) {
    toggleMultiSelect(element)
  } else {
    selectElement(element)
    
    if (activeTool.value === 'select') {
      draggingElementId.value = element.id
    }
  }
}

function toggleMultiSelect(element) {
  if (selectedElements.value.has(element.id)) {
    selectedElements.value.delete(element.id)
    if (selectedElementId.value === element.id) {
      selectedElementId.value = null
      selectedElement.value = null
    }
  } else {
    selectedElements.value.add(element.id)
    selectElement(element)
  }
}

// Zoom
function onWheel(e) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(0.25, Math.min(3, zoom.value + delta))
    
    if (canvasRef.value) {
      const rect = canvasRef.value.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      const scaleChange = newZoom / zoom.value
      zoom.value = newZoom
      
      canvasRef.value.scrollLeft += mouseX * (scaleChange - 1)
      canvasRef.value.scrollTop += mouseY * (scaleChange - 1)
    }
  }
}

// Element operations
function createNewElement(position) {
  const newElement = createElement(activeTool.value, position, zoom.value)
  addToHistory('create', newElement.id, null, newElement)
  activeTool.value = 'select'
  saveCanvas()
}

function updateElement(element) {
  updateElementBase(element)
  saveCanvas()
}

function deleteElement(element) {
  addToHistory('delete', element.id, element, null)
  deleteElementBase(element)
  saveCanvas()
}

function editElement(element) {
  if (!props.canEdit) return
  selectElement(element)
}

// Resize
function startResize(e, element, handle) {
  resizingElement.value = element
  resizeHandle.value = handle
}

function handleResize(e) {
  if (!resizingElement.value) return
  
  const el = resizingElement.value
  const dx = (e.movementX || 0) / zoom.value
  const dy = (e.movementY || 0) / zoom.value
  
  if (resizeHandle.value.includes('e')) {
    el.width += dx
  }
  if (resizeHandle.value.includes('w')) {
    el.width -= dx
    el.position_x += dx
  }
  if (resizeHandle.value.includes('s')) {
    el.height += dy
  }
  if (resizeHandle.value.includes('n')) {
    el.height -= dy
    el.position_y += dy
  }
  
  el.width = Math.max(100, Math.min(2000, el.width))
  el.height = Math.max(50, Math.min(2000, el.height))
}

// Quick add card
function quickAddCard(status) {
  activeTool.value = 'card'
}

// Save/Load
async function loadElements() {
  isLoading.value = true
  
  if (!isSupabaseConfigured) {
    console.warn('[CanvasEditor] Supabase not configured - running in offline mode')
    isLoading.value = false
    return
  }
  
  try {
    await loadElementsBase()
  } catch (err) {
    console.error('[CanvasEditor] Load failed:', err.message)
  } finally {
    isLoading.value = false
  }
}

async function saveCanvas() {
  if (!isSupabaseConfigured || !props.canEdit) return
  
  clearTimeout(saveTimer.value)
  saveTimer.value = setTimeout(async () => {
    try {
      await saveElements()
    } catch (err) {
      console.error('[CanvasEditor] Save failed:', err.message)
    }
  }, 1000)
}

// Undo/Redo
async function undo() {
  await undoHistory()
  buildConnections()
}

async function redo() {
  await redoHistory()
  buildConnections()
}

// Keyboard shortcuts
function handleKeyDown(e) {
  if (e.key === 'Shift') {
    isShiftPressed.value = true
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  }
  
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    redo()
  }
  
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      deleteSelectedElements()
    }
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    e.preventDefault()
    selectAllElements()
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault()
    duplicateSelected()
  }
}

function handleKeyUp(e) {
  if (e.key === 'Shift') {
    isShiftPressed.value = false
  }
}

function deleteSelectedElements() {
  const toDelete = Array.from(selectedElements.value)
  toDelete.forEach(id => {
    const element = elements.value.find(el => el.id === id)
    if (element) {
      deleteElement(element)
    }
  })
}

function selectAllElements() {
  elements.value.forEach(el => {
    selectedElements.value.add(el.id)
  })
  if (elements.value.length > 0) {
    selectedElement.value = elements.value[elements.value.length - 1]
    selectedElementId.value = elements.value[elements.value.length - 1].id
  }
}

function duplicateSelected() {
  if (selectedElements.value.size === 0) return
  
  selectedElements.value.forEach(id => {
    const original = elements.value.find(el => el.id === id)
    if (original) {
      const duplicate = duplicateElement(original)
      addToHistory('create', duplicate.id, null, duplicate)
    }
  })
  
  saveCanvas()
}

// Expose methods
defineExpose({
  saveCanvas,
  loadElements,
  zoomIn,
  zoomOut,
  resetZoom,
  undo,
  redo,
  exportCanvas
})

// Export canvas
async function exportCanvas(format = 'png', quality = 1) {
  try {
    const loadingEl = document.createElement('div')
    loadingEl.className = 'export-loading'
    loadingEl.innerHTML = '<div>Exporting canvas...</div>'
    document.body.appendChild(loadingEl)
    
    const svgContent = generateCanvasSVG()
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `canvas-${props.projectId}-${Date.now()}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    document.body.removeChild(loadingEl)
    console.log('[CanvasEditor] Exported canvas as', format)
  } catch (err) {
    console.error('[CanvasEditor] Export failed:', err.message)
  }
}

function generateCanvasSVG() {
  const width = 2000
  const height = 2000
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
  svg += `<rect width="100%" height="100%" fill="#141412"/>`
  
  svg += `<defs>`
  svg += `<pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">`
  svg += `<path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(106,125,91,0.2)" stroke-width="1"/>`
  svg += `</pattern>`
  svg += `</defs>`
  svg += `<rect width="100%" height="100%" fill="url(#grid)"/>`
  
  elements.value.forEach(el => {
    if (el.type === 'card') {
      svg += `<rect x="${el.position_x}" y="${el.position_y}" width="${el.width}" height="${el.height}" 
                   fill="rgba(20,20,18,0.95)" stroke="#6a7d5b" stroke-width="1"/>`
      svg += `<text x="${el.position_x + 10}" y="${el.position_y + 30}" 
                   fill="#fefefe" font-family="monospace" font-size="14">
              ${el.content?.title || 'Untitled'}
              </text>`
    } else if (el.type === 'text') {
      svg += `<text x="${el.position_x}" y="${el.position_y}" 
                   fill="#fefefe" font-family="monospace" font-size="12">
              ${el.content?.text || ''}
              </text>`
    }
  })
  
  connections.value.forEach(conn => {
    svg += `<line x1="${conn.x1}" y1="${conn.y1}" x2="${conn.x2}" y2="${conn.y2}" 
               stroke="${conn.color}" stroke-width="3"/>`
  })
  
  svg += `</svg>`
  return svg
}

// Real-time sync
function subscribeToCanvasChanges() {
  if (!isSupabaseConfigured || !supabase) return
  
  const channel = supabase
    .channel(`canvas-elements-${props.projectId}`)
    .on('postgres_changes', 
      {
        event: '*',
        schema: 'public',
        table: 'canvas_elements',
        filter: `project_id=eq.${props.projectId}`
      },
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload
        
        if (newRecord?.created_by === auth.userId) return
        
        if (eventType === 'INSERT') {
          const exists = elements.value.find(el => el.id === newRecord.id)
          if (!exists) {
            elements.value.push(newRecord)
            buildConnections()
          }
        } else if (eventType === 'UPDATE') {
          const idx = elements.value.findIndex(el => el.id === newRecord.id)
          if (idx >= 0) {
            elements.value[idx] = newRecord
            buildConnections()
          }
        } else if (eventType === 'DELETE') {
          elements.value = elements.value.filter(el => el.id !== oldRecord.id)
          selectedElements.value.delete(oldRecord.id)
          buildConnections()
        }
      }
    )
    .subscribe()
  
  console.log('[CanvasEditor] Subscribed to realtime changes')
}

// Lifecycle
onMounted(() => {
  loadElements()
  isEditing.value = true
  
  if (auth.isLoggedIn) {
    realtimeStore.joinChannel(`canvas-${props.projectId}`, {
      id: auth.userId,
      name: auth.userName,
      avatar: auth.userAvatar
    })
    
    subscribeToCanvasChanges()
  }
  
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  isEditing.value = false
  clearTimeout(saveTimer.value)
  
  realtimeStore.leaveChannel()
  
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.canvas-editor {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.editor-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: auto;
  cursor: crosshair;
}

.editor-canvas.tool-select {
  cursor: default;
}

.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(106, 125, 91, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(106, 125, 91, 0.1) 1px, transparent 1px);
  pointer-events: none;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.connection-line {
  pointer-events: stroke;
  cursor: pointer;
  transition: stroke-width 0.2s;
}

.connection-line:hover {
  stroke-width: 5;
}

.connection-line.selected {
  stroke-width: 5;
  filter: drop-shadow(0 0 3px currentColor);
}

.connection-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: var(--paper);
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 3px;
  text-align: center;
}

.canvas-element {
  position: absolute;
  transition: box-shadow 0.2s;
}

.canvas-element.selected {
  outline: 2px solid var(--terracotta);
  outline-offset: 2px;
}

.canvas-element.dragging {
  opacity: 0.8;
  cursor: grabbing;
}

.canvas-element.selected-multi {
  outline: 2px dashed var(--terracotta);
  outline-offset: 2px;
  background: rgba(255, 95, 31, 0.05);
}

.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--terracotta);
  border: 1px solid var(--paper);
  pointer-events: auto;
  cursor: nwse-resize;
}

.resize-handle.nw { top: -5px; left: -5px; cursor: nwse-resize; }
.resize-handle.ne { top: -5px; right: -5px; cursor: nesw-resize; }
.resize-handle.sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
.resize-handle.se { bottom: -5px; right: -5px; cursor: nwse-resize; }

.delete-element-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  background: #ef4444;
  border: 1px solid var(--paper);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  z-index: 10;
}

.drag-preview {
  position: absolute;
  width: 200px;
  height: 150px;
  border: 2px dashed var(--terracotta);
  background: rgba(255, 95, 31, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.preview-placeholder {
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  color: var(--terracotta);
  text-transform: uppercase;
}

.read-only-badge {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid var(--moss);
  padding: 8px 16px;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--moss-light);
  text-transform: uppercase;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(20, 20, 18, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(106, 125, 91, 0.2);
  border-top-color: var(--moss);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  color: var(--moss-light);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.export-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: var(--paper);
  font-family: 'Space Mono', monospace;
  font-size: 1.2rem;
  text-transform: uppercase;
}
</style>
