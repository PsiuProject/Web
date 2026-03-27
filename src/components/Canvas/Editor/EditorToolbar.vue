<template>
  <div
    class="editor-toolbar"
    :class="{ collapsed: isCollapsed }"
    @contextmenu.prevent="onToolbarRightClick"
  >
    <button class="toolbar-toggle" @click="isCollapsed = !isCollapsed">
      {{ isCollapsed ? '>' : '<' }}
    </button>

    <div v-show="!isCollapsed" class="toolbar-content">
      <div class="toolbar-section">
        <span class="section-label">ADD</span>
        <button
          v-for="tool in tools"
          :key="tool.type"
          class="tool-btn"
          :class="{ active: placementMode === tool.type }"
          @click="activatePlacement(tool.type)"
          :title="tool.label"
        >
          <span class="tool-icon" v-html="tool.icon"></span>
          <span class="tool-label">{{ tool.label }}</span>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-section">
        <span class="section-label">HISTORY</span>
        <button class="tool-btn" :disabled="!history.canUndo" @click="history.undo()" title="Undo">
          <span class="tool-icon">&#8617;</span>
          <span class="tool-label">Undo</span>
        </button>
        <button class="tool-btn" :disabled="!history.canRedo" @click="history.redo()" title="Redo">
          <span class="tool-icon">&#8618;</span>
          <span class="tool-label">Redo</span>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-section">
        <span class="section-label">ACTIONS</span>
        <button
          v-if="elements.selectedId"
          class="tool-btn danger"
          @click="deleteSelected"
          title="Delete Selected"
        >
          <span class="tool-icon">&times;</span>
          <span class="tool-label">Delete</span>
        </button>
        <button
          v-if="elements.selectedId"
          class="tool-btn"
          @click="duplicateSelected"
          title="Duplicate Selected"
        >
          <span class="tool-icon">&#8962;</span>
          <span class="tool-label">Clone</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Toolbar context menu -->
  <ContextMenu
    :is-visible="toolbarContextMenuVisible"
    :x="toolbarContextMenuPosition.x"
    :y="toolbarContextMenuPosition.y"
    :items="toolbarContextMenuItems"
    :title="toolbarContextMenuTitle"
    @update:is-visible="toolbarContextMenuVisible = $event"
    @action="handleToolbarContextMenuAction"
  />

  <!-- Placement mode cursor overlay -->
  <Teleport to="body">
    <div
      v-if="placementMode && placementMode !== 'connection'"
      class="placement-overlay"
      :style="cursorStyle"
      @mousedown.prevent="onPlacementMouseDown"
      @mousemove="onPlacementMouseMove"
      @mouseup="onPlacementMouseUp"
      @keydown.escape="cancelPlacement"
      tabindex="0"
      ref="overlayRef"
    >
      <!-- Ghost preview while dragging -->
      <div v-if="isDragging && dragRect" class="placement-ghost" :style="ghostStyle">
        <span class="ghost-label">{{ placementMode }}</span>
      </div>
      <!-- Cursor icon label -->
      <div class="cursor-label" :style="labelStyle">
        <span class="cursor-icon" v-html="currentTool?.icon"></span>
        <span>{{ currentTool?.label }}</span>
        <span class="cursor-hint">click or drag</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useElementsStore } from '../../../stores/elements'
import { useViewportStore } from '../../../stores/viewport'
import { useHistoryStore } from '../../../stores/history'
import ContextMenu from '../../UI/ContextMenu.vue'
import { useContextMenu } from '../../../composables/useContextMenu'

const route = useRoute()
const elements = useElementsStore()
const viewport = useViewportStore()
const history = useHistoryStore()

const emit = defineEmits(['connection-mode-change'])

const { MenuItems } = useContextMenu()

// Toolbar context menu
const toolbarContextMenuVisible = ref(false)
const toolbarContextMenuPosition = ref({ x: 0, y: 0 })
const toolbarContextMenuItems = ref([])
const toolbarContextMenuTitle = 'Toolbar'

function onToolbarRightClick(e) {
  e.preventDefault()
  toolbarContextMenuPosition.value = { x: e.clientX, y: e.clientY }
  toolbarContextMenuItems.value = MenuItems.toolbar()
  toolbarContextMenuVisible.value = true
}

function handleToolbarContextMenuAction(action) {
  switch (action) {
    case 'customize-toolbar':
      // Toggle toolbar customization mode
      console.log('Customize toolbar')
      break
    case 'show-shortcuts':
      // Show keyboard shortcuts help
      console.log('Show shortcuts')
      break
    case 'reset-layout':
      // Reset toolbar to default position
      isCollapsed.value = false
      console.log('Reset layout')
      break
  }
}

const isCollapsed = ref(false)
const placementMode = ref(null)
const overlayRef = ref(null)
const mousePos = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref(null)
const dragRect = ref(null)

const tools = [
  { type: 'card', label: 'Card', icon: '&#9633;' },
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'image', label: 'Image', icon: '&#9638;' },
  { type: 'link', label: 'Link', icon: '&rarr;' },
  { type: 'button', label: 'Button', icon: '&#9744;' },
  { type: 'connection', label: 'Connection', icon: '&#8627;' }
]

const currentTool = computed(() => tools.find((t) => t.type === placementMode.value))

// Emit connection mode state to parent
watch(
  placementMode,
  (newMode) => {
    const isConnection = newMode === 'connection'
    emit('connection-mode-change', isConnection)
  },
  { immediate: true }
)

const cursorStyle = computed(() => {
  // Custom cursor based on tool type
  const cursorMap = {
    card: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23b55d3a' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3C/svg%3E\") 12 12, crosshair",
    text: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23b55d3a' stroke-width='2'%3E%3Cpath d='M4 7V4h16v3M9 20h6M12 4v16'/%3E%3C/svg%3E\") 12 12, text",
    image:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23b55d3a' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E\") 12 12, crosshair",
    link: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23b55d3a' stroke-width='2'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/%3E%3C/svg%3E\") 12 12, pointer",
    button:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23b55d3a' stroke-width='2'%3E%3Crect x='3' y='8' width='18' height='8' rx='2'/%3E%3C/svg%3E\") 12 12, crosshair",
    connection:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M12 2v4m0 12v4M2 12h4m12 0h4'/%3E%3C/svg%3E\") 12 12, crosshair"
  }
  return {
    cursor: cursorMap[placementMode.value] || 'crosshair'
  }
})

const labelStyle = computed(() => ({
  left: `${mousePos.value.x + 16}px`,
  top: `${mousePos.value.y + 16}px`
}))

const ghostStyle = computed(() => {
  if (!dragRect.value) return {}
  return {
    left: `${dragRect.value.x}px`,
    top: `${dragRect.value.y}px`,
    width: `${dragRect.value.w}px`,
    height: `${dragRect.value.h}px`
  }
})

function activatePlacement(type) {
  placementMode.value = type
  // Don't focus overlay for connection mode - it doesn't use the overlay
  if (type !== 'connection') {
    nextTick(() => overlayRef.value?.focus())
  }
}

function cancelPlacement() {
  placementMode.value = null
  isDragging.value = false
  dragStart.value = null
  dragRect.value = null
}

function onPlacementMouseMove(e) {
  mousePos.value = { x: e.clientX, y: e.clientY }
  if (isDragging.value && dragStart.value) {
    const x = Math.min(e.clientX, dragStart.value.x)
    const y = Math.min(e.clientY, dragStart.value.y)
    const w = Math.abs(e.clientX - dragStart.value.x)
    const h = Math.abs(e.clientY - dragStart.value.y)
    dragRect.value = { x, y, w, h }
  }
}

function onPlacementMouseDown(e) {
  if (e.button !== 0) return
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  dragRect.value = null
}

async function onPlacementMouseUp(e) {
  if (!isDragging.value) return
  isDragging.value = false

  const type = placementMode.value

  // Connection tool doesn't create elements, just activates connection mode
  // Don't cancel placement for connection mode - it stays active until ESC or another tool is selected
  if (type === 'connection') {
    // Keep connection mode active - don't call cancelPlacement()
    return
  }

  const capturedRect = dragRect.value // capture before cancelPlacement clears it
  cancelPlacement()

  const hasDragged = capturedRect && (capturedRect.w > 10 || capturedRect.h > 10)

  const toCanvas = (sx, sy) => ({
    x: (sx - viewport.translateX) / viewport.zoom,
    y: (sy - viewport.translateY) / viewport.zoom
  })

  let pos, size

  if (hasDragged) {
    const tl = toCanvas(capturedRect.x, capturedRect.y)
    const br = toCanvas(capturedRect.x + capturedRect.w, capturedRect.y + capturedRect.h)
    pos = tl
    const rawW = Math.max(50, br.x - tl.x)
    const rawH = Math.max(30, br.y - tl.y)
    size =
      type === 'image' ? { width: rawW, height: rawW * (9 / 16) } : { width: rawW, height: rawH }
  } else {
    const center = toCanvas(e.clientX, e.clientY)
    const defaults = {
      card: { width: 280, height: 370 },
      text: { width: 200, height: 60 },
      image: { width: 300, height: 200 },
      link: { width: 180, height: 44 },
      button: { width: 160, height: 44 }
    }
    const def = defaults[type] || { width: 200, height: 100 }
    pos = { x: center.x - def.width / 2, y: center.y - def.height / 2 }
    size = def
  }

  const defaultContent = {
    card: {
      title: { pt: 'Novo Card', en: 'New Card' },
      description: { pt: '', en: '' },
      status: 'active',
      cells: []
    },
    text: { text: { pt: 'Novo texto', en: 'New text' }, boxed: false },
    image: { url: '', caption: { pt: '', en: '' } },
    link: { url: 'https://', label: { pt: 'Link', en: 'Link' } },
    button: { url: 'https://', label: { pt: 'Botão', en: 'Button' } }
  }

  const projectId = route.params.projectId
  const el = await elements.createElement(projectId, type, pos, size)
  if (el) {
    await elements.updateElement(el.id, { content: defaultContent[type] || {} })
    elements.selectElement(el.id)
    history.push({ action: 'create', elementId: el.id, state: el })
  }
}

async function deleteSelected() {
  if (!elements.selectedId) return
  const el = elements.selectedElement
  history.push({ action: 'delete', elementId: el.id, state: { ...el } })
  await elements.deleteElement(elements.selectedId)
}

async function duplicateSelected() {
  if (!elements.selectedElement) return
  const src = elements.selectedElement
  const projectId = route.params.projectId
  const el = await elements.createElement(
    projectId,
    src.type,
    {
      x: src.position_x + 30,
      y: src.position_y + 30
    },
    { width: src.width, height: src.height }
  )

  if (el) {
    await elements.updateElement(el.id, { content: src.content, style: src.style })
    elements.selectElement(el.id)
    history.push({ action: 'create', elementId: el.id, state: el })
  }
}
</script>

<style scoped>
.editor-toolbar {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 900;
  display: flex;
  align-items: stretch;
  max-height: 96vh;
}

.toolbar-toggle {
  background: rgba(20, 20, 18, 0.95);
  border: 1px solid var(--moss);
  border-left: none;
  color: var(--moss-light);
  padding: 0.5rem 0.3rem;
  cursor: pointer;
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.65rem, 1.2vw, 0.85rem);
  display: flex;
  align-items: center;
  transition: all 0.2s;
}
.toolbar-toggle:hover {
  background: rgba(106, 125, 91, 0.2);
  color: var(--paper);
}

.toolbar-content {
  background: rgba(20, 20, 18, 0.95);
  border: 1px solid var(--moss);
  border-left: none;
  backdrop-filter: blur(clamp(8px, 1.2vh, 10px));
  padding: clamp(0.5rem, 1vh, 0.75rem) clamp(0.3rem, 0.5vw, 0.5rem);
  display: flex;
  flex-direction: column;
  gap: clamp(0.3rem, 0.5vh, 0.5rem);
  max-height: 96vh;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: clamp(120px, 15vw, 180px);
  max-width: clamp(140px, 18vw, 220px);
}

.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: clamp(0.15rem, 0.3vh, 0.25rem);
  min-width: 0;
}

.section-label {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.45rem, 0.8vw, 0.55rem);
  color: var(--moss);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 clamp(0.3rem, 0.5vw, 0.5rem);
  margin-bottom: clamp(0.15rem, 0.3vh, 0.25rem);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-divider {
  height: clamp(1px, 0.2vh, 2px);
  background: var(--moss);
  opacity: 0.3;
  margin: clamp(0.15rem, 0.3vh, 0.25rem) 0;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: clamp(0.3rem, 0.5vw, 0.5rem);
  background: transparent;
  border: 1px solid transparent;
  color: var(--paper);
  padding: clamp(0.3rem, 0.5vh, 0.4rem) clamp(0.4rem, 0.6vw, 0.5rem);
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.6rem, 1vw, 0.75rem);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex-shrink: 1;
}
.tool-btn:hover:not(:disabled) {
  background: rgba(106, 125, 91, 0.15);
  border-color: var(--moss);
}
.tool-btn.active {
  background: rgba(181, 93, 58, 0.2);
  border-color: var(--terracotta);
  color: var(--terracotta);
}
.tool-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.tool-btn.danger:hover:not(:disabled) {
  background: rgba(255, 50, 50, 0.15);
  border-color: rgba(255, 50, 50, 0.3);
  color: #ff4444;
}

.tool-icon {
  width: clamp(1rem, 1.5vw, 1.2rem);
  text-align: center;
  font-size: clamp(0.9rem, 1.3vw, 1rem);
  color: var(--stencil-orange);
  flex-shrink: 0;
}
.tool-label {
  font-size: clamp(0.55rem, 0.9vw, 0.7rem);
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.editor-toolbar.collapsed .toolbar-content {
  display: none;
}

/* Placement overlay */
.placement-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  outline: none;
}

.cursor-label {
  position: fixed;
  display: flex;
  align-items: center;
  gap: clamp(0.3rem, 0.5vw, 0.4rem);
  background: rgba(20, 20, 18, 0.9);
  border: 1px solid var(--terracotta);
  padding: clamp(0.25rem, 0.4vh, 0.3rem) clamp(0.5rem, 0.7vw, 0.6rem);
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.6rem, 0.75vw, 0.7rem);
  color: var(--paper);
  pointer-events: none;
  border-radius: clamp(2px, 0.3vw, 3px);
  white-space: nowrap;
}

.cursor-icon {
  color: var(--stencil-orange);
}

.cursor-hint {
  color: var(--moss-light);
  font-size: clamp(0.5rem, 0.65vw, 0.6rem);
  margin-left: clamp(0.2rem, 0.3vw, 0.25rem);
}

.placement-ghost {
  position: fixed;
  border: clamp(2px, 0.3vw, 3px) dashed var(--terracotta);
  background: rgba(181, 93, 58, 0.1);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ghost-label {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.65rem, 0.8vw, 0.75rem);
  color: var(--terracotta);
  text-transform: uppercase;
  opacity: 0.7;
}
</style>
