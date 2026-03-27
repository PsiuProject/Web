<template>
  <div class="canvas-edit" :class="{ 'dragging-connection': isDraggingConnection }">
    <AppHeader mode="edit" />
    <EditorToolbar @connection-mode-change="onConnectionModeChange" />

    <CanvasBase
      :interactive="true"
      @canvas-click="onCanvasClick"
      @canvas-drop="onCanvasDrop"
      @contextmenu.prevent="onCanvasRightClick"
    >
      <component
        v-for="element in elements.elements"
        :key="element.id"
        :is="getComponent(element.type)"
        :element="element"
        :isSelected="elements.selectedId === element.id"
        :isEditMode="true"
        :showPorts="isConnectionMode"
        :highlightedPort="highlightedPort"
        @click="onElementClick(element)"
        @dblclick="onElementDoubleClick(element)"
        @mousedown.stop="onElementDragStart($event, element)"
        @dragstart="onElementNativeDragStart($event, element)"
        @mouseenter="onElementHover(element)"
        @mouseleave="onElementLeave()"
        @port-click="onPortClick"
        @port-drag-start="onPortDragStart"
        @port-hover="onPortHover"
        @port-leave="onPortLeave"
      />

      <!-- Connection lines layer - must be AFTER elements so it's on top -->
      <svg class="connections-layer-svg">
        <g v-for="conn in elements.manualConnections" :key="conn.id">
          <ConnectionLine
            :x1="conn.x1"
            :y1="conn.y1"
            :x2="conn.x2"
            :y2="conn.y2"
            :color="conn.color || '#b55d3a'"
            :connection-type-key="getConnectionTypeKey(conn.connection_type)"
            :connection-id="conn.id"
            animation-style="liquid"
            @right-click="onConnectionRightClick"
            @click="onConnectionClick"
          />
        </g>
        <!-- Temporary dragging line -->
        <g v-if="isDraggingConnection && dragConnectionLine">
          <ConnectionLine
            :x1="dragConnectionLine.x1"
            :y1="dragConnectionLine.y1"
            :x2="dragConnectionLine.x2"
            :y2="dragConnectionLine.y2"
            :color="dragConnectionLine.color"
            is-dragging
            animation-style="glowing"
          />
        </g>
      </svg>
    </CanvasBase>

    <PropertiesPanel v-if="elements.selectedElement" />

    <!-- Connection type picker popup (for LEFT-CLICK config) -->
    <ConnectionTypePicker
      :is-visible="showConnectionPicker"
      :position="pickerPosition"
      :initial-type="selectedConnectionType"
      :initial-color="selectedConnectionColor"
      @apply="onConnectionTypeApply"
      @close="onConnectionPickerClose"
    />

    <!-- Context menu for RIGHT-CLICK element insertion -->
    <ContextMenu
      v-if="connectionContextMenuVisible"
      :is-visible="connectionContextMenuVisible"
      :x="connectionContextMenuPosition.x"
      :y="connectionContextMenuPosition.y"
      :items="connectionContextMenuItems"
      :title="'Insert Element'"
      @update:is-visible="connectionContextMenuVisible = $event"
      @action="handleConnectionContextMenuAction"
    />

    <!-- Canvas context menu -->
    <ContextMenu
      :is-visible="canvasContextMenuVisible"
      :x="canvasContextMenuPosition.x"
      :y="canvasContextMenuPosition.y"
      :items="canvasContextMenuItems"
      :title="canvasContextMenuTitle"
      @update:is-visible="
        (val) => {
          if (!val) hideCanvasContextMenu()
        }
      "
      @action="handleCanvasContextMenuAction"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useElementsStore } from '../stores/elements'
import { useViewportStore } from '../stores/viewport'
import { usePermissionsStore } from '../stores/permissions'
import { useHistoryStore } from '../stores/history'
import { useI18nStore } from '../stores/i18n-store'
import { getErrorMessage } from '../lib/errorMessages'
import AppHeader from '../components/Layout/AppHeader.vue'
import CanvasBase from '../components/Canvas/Render/CanvasBase.vue'
import EditorToolbar from '../components/Canvas/Editor/EditorToolbar.vue'
import PropertiesPanel from '../components/Canvas/Editor/PropertiesPanel.vue'
import Card from '../components/Canvas/Render/Card.vue'
import Text from '../components/Canvas/Render/Text.vue'
import ImageEl from '../components/Canvas/Render/Image.vue'
import Link from '../components/Canvas/Render/Link.vue'
import ConnectionLine from '../components/Canvas/Render/ConnectionLine.vue'
import ConnectionTypePicker from '../components/Canvas/Editor/ConnectionTypePicker.vue'
import ContextMenu from '../components/UI/ContextMenu.vue'
import { MenuItems } from '../composables/useContextMenu'

const route = useRoute()
const router = useRouter()
const elements = useElementsStore()
const viewport = useViewportStore()
const permissions = usePermissionsStore()
const history = useHistoryStore()
const i18nStore = useI18nStore()

const componentMap = { card: Card, text: Text, image: ImageEl, link: Link, button: Link }
function getComponent(type) {
  return componentMap[type] || Text
}

// Helper to get localized error messages
function t(key, params = {}) {
  return getErrorMessage(key.category, key.message, i18nStore.currentLocale, params)
}

// Connection mode state
const isConnectionMode = ref(false)
const isDraggingConnection = ref(false)
const dragConnectionStart = ref(null) // { element, side, color }
const dragConnectionLine = ref(null) // { x1, y1, x2, y2, color }
const highlightedPort = ref(null) // { elementId, side }
const hoveredElement = ref(null) // Element currently hovered for connection ports
const showConnectionPicker = ref(false)
const pickerPosition = ref({ x: 0, y: 0 })
const selectedConnectionType = ref('subProject')
const selectedConnectionColor = ref('#b55d3a')
const pendingPortData = ref(null)

// Connection context menu (for RIGHT-CLICK)
const connectionContextMenuVisible = ref(false)
const connectionContextMenuPosition = ref({ x: 0, y: 0 })
const connectionContextMenuItems = ref([])

// Canvas context menu state
const canvasContextMenuVisible = ref(false)
const canvasContextMenuPosition = ref({ x: 0, y: 0 })
const canvasContextMenuItems = ref([])
const canvasContextMenuTitle = ref('')

function onCanvasRightClick(e) {
  e.preventDefault()
  canvasContextMenuPosition.value = { x: e.clientX, y: e.clientY }
  canvasContextMenuItems.value = MenuItems.canvas(permissions)
  canvasContextMenuTitle.value = 'Canvas'
  canvasContextMenuVisible.value = true
}

function hideCanvasContextMenu() {
  canvasContextMenuVisible.value = false
}

function handleCanvasContextMenuAction(action) {
  switch (action) {
    case 'add-text':
      addElementAtMouse('text')
      break
    case 'add-image':
      addElementAtMouse('image')
      break
    case 'add-button':
      addElementAtMouse('button')
      break
    case 'add-link':
      addElementAtMouse('link')
      break
    case 'add-card':
      addElementAtMouse('card')
      break
    case 'toggle-grid':
      viewport.toggleGrid()
      break
    case 'center-view':
      // Center on all elements or reset if empty
      if (elements.elements.length > 0) {
        // Calculate center of all elements
        const bounds = elements.elements.reduce(
          (acc, el) => ({
            minX: Math.min(acc.minX, el.position_x),
            minY: Math.min(acc.minY, el.position_y),
            maxX: Math.max(acc.maxX, el.position_x + el.width),
            maxY: Math.max(acc.maxY, el.position_y + el.height)
          }),
          { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
        )

        const centerX = (bounds.minX + bounds.maxX) / 2
        const centerY = (bounds.minY + bounds.maxY) / 2
        viewport.centerOn(centerX, centerY, 0.8)
      } else {
        // Reset to default view if no elements
        viewport.reset()
      }
      break
    case 'clear-all':
      if (confirm(t({ category: 'general', message: 'confirmation.clearAll' }))) {
        elements.elements.forEach((el) => {
          history.push({ action: 'delete', elementId: el.id, state: { ...el } })
          elements.deleteElement(el.id)
        })
      }
      break
  }
}

async function addElementAtMouse(type) {
  const projectId = route.params.projectId
  const canvasPos = {
    x: (canvasContextMenuPosition.value.x - viewport.translateX) / viewport.zoom,
    y: (canvasContextMenuPosition.value.y - viewport.translateY) / viewport.zoom
  }

  const defaults = {
    text: { w: 200, h: 60 },
    image: { w: 300, h: 200 },
    button: { w: 160, h: 44 },
    link: { w: 180, h: 44 },
    card: { w: 250, h: 300 }
  }
  const def = defaults[type] || { w: 200, h: 60 }

  const placeholderContent = {
    text: {
      text: { pt: 'Novo texto', en: 'New text' },
      boxed: false
    },
    image: {
      url: '',
      caption: { pt: 'Legenda da imagem', en: 'Image caption' }
    },
    button: {
      url: 'https://',
      label: { pt: 'Botão', en: 'Button' },
      color: '#b55d3a'
    },
    link: {
      url: 'https://',
      label: { pt: 'Link', en: 'Link' }
    },
    card: {
      title: { pt: 'Novo Card', en: 'New Card' },
      description: { pt: '', en: '' },
      status: 'active',
      cells: []
    }
  }

  // Create element with proper async handling to avoid race conditions
  const el = await elements.createElement(
    projectId,
    type,
    {
      x: canvasPos.x - def.w / 2,
      y: canvasPos.y - def.h / 2
    },
    { width: def.w, height: def.h }
  )

  if (el) {
    try {
      await elements.updateElement(el.id, { content: placeholderContent[type] || {} })
      elements.selectElement(el.id)
      history.push({ action: 'create', elementId: el.id, state: el })
    } catch (error) {
      console.error('[CanvasEdit] Failed to update element content:', error)
      // Rollback: delete the created element if content update fails
      await elements.deleteElement(el.id)
    }
  }
}

function getConnectionTypeKey(type) {
  if (!type) return 'connections.subProject'
  return `connections.${type}`
}

function onCanvasClick() {
  elements.clearSelection()
}

function onConnectionModeChange(isConnection) {
  isConnectionMode.value = isConnection
  console.log('[CanvasEdit] Connection mode:', isConnection)
  // Clear any active dragging state when mode changes
  if (!isConnection) {
    isDraggingConnection.value = false
    dragConnectionLine.value = null
    dragConnectionStart.value = null
    highlightedPort.value = null
  }
}

function onElementClick(element) {
  elements.selectElement(element.id)
}
function onElementDoubleClick(element) {
  elements.selectElement(element.id)
}

function onElementHover(element) {
  if (isConnectionMode.value) {
    hoveredElement.value = element
  }
}

function onElementLeave() {
  hoveredElement.value = null
  if (!isDraggingConnection.value) {
    highlightedPort.value = null
  }
}

// Native drag for card-cell-to-canvas
function onElementNativeDragStart(e, element) {
  e.dataTransfer.setData('canvas-element-id', element.id)
  e.dataTransfer.effectAllowed = 'move'
}

async function onCanvasDrop({ cell, x, y, sourceCardId, sourceCellIdx }) {
  const projectId = route.params.projectId
  const typeMap = { text: 'text', image: 'image', button: 'button', link: 'link' }
  const type = typeMap[cell.type] || 'text'
  const defaults = {
    text: { w: 200, h: 60 },
    image: { w: 300, h: 200 },
    button: { w: 160, h: 44 },
    link: { w: 180, h: 44 }
  }
  const def = defaults[type] || { w: 200, h: 60 }

  try {
    const el = await elements.createElement(
      projectId,
      type,
      { x: x - def.w / 2, y: y - def.h / 2 },
      { width: def.w, height: def.h }
    )
    if (!el) {
      console.error('[CanvasEdit] Failed to create element from dropped cell')
      return
    }

    const content = {}
    if (type === 'text') content.text = cell.text || { pt: '' }
    if (type === 'image') content.url = cell.url || ''
    if (type === 'button' || type === 'link') {
      content.label = cell.text || { pt: '' }
      content.url = cell.url || ''
    }

    await elements.updateElement(el.id, {
      content,
      font_size: cell.fontSize,
      text_color: cell.color
    })
    elements.selectElement(el.id)

    // Remove cell from source card
    if (sourceCardId && !isNaN(sourceCellIdx)) {
      const srcCard = elements.elements.find((e) => e.id === sourceCardId)
      if (srcCard) {
        const newCells = (srcCard.content?.cells || []).filter((_, i) => i !== sourceCellIdx)
        await elements.updateElement(sourceCardId, {
          content: { ...srcCard.content, cells: newCells }
        })
      }
    }
  } catch (error) {
    console.error('[CanvasEdit] Error dropping cell:', error)
  }
}

// Element drag logic
let draggedElement = null
let dragStartPos = { x: 0, y: 0 }
let dragStartElementPos = { x: 0, y: 0 }
let hasMoved = false

function onElementDragStart(e, element) {
  if (e.button !== 0) return
  // Don't drag if clicking inside a contenteditable
  if (e.target.contentEditable === 'true') return

  draggedElement = element
  dragStartPos = { x: e.clientX, y: e.clientY }
  dragStartElementPos = { x: element.position_x, y: element.position_y }
  hasMoved = false
  elements.selectElement(element.id)

  const onMove = (moveE) => {
    if (!draggedElement) return
    const dx = (moveE.clientX - dragStartPos.x) / viewport.zoom
    const dy = (moveE.clientY - dragStartPos.y) / viewport.zoom
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true
    if (hasMoved) {
      elements.updateElement(draggedElement.id, {
        position_x: dragStartElementPos.x + dx,
        position_y: dragStartElementPos.y + dy
      })
    }
  }

  const onEnd = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
    if (hasMoved && draggedElement) {
      history.push({
        action: 'update',
        elementId: draggedElement.id,
        state: { position_x: dragStartElementPos.x, position_y: dragStartElementPos.y }
      })
    }
    draggedElement = null
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
}

function onKeyDown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    history.undo()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
    e.preventDefault()
    history.redo()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault()
    history.redo()
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && elements.selectedId) {
    // Don't delete if editing text
    if (document.activeElement?.contentEditable === 'true') return
    if (
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA'
    )
      return
    // Delete selected connection if one is selected
    if (elements.selectedConnectionId) {
      elements.deleteConnection(elements.selectedConnectionId)
      return
    }
    e.preventDefault()
    const el = elements.selectedElement
    if (el) {
      history.push({ action: 'delete', elementId: el.id, state: { ...el } })
      elements.deleteElement(el.id)
    }
  }
  if (e.key === 'Escape') {
    elements.clearSelection()
    isDraggingConnection.value = false
    dragConnectionLine.value = null
    dragConnectionStart.value = null
    highlightedPort.value = null
    // Exit connection mode when pressing ESC
    isConnectionMode.value = false
  }
}

function onConnectionTypeApply({ type, color }) {
  if (pendingPortData.value) {
    // Update the port/connection with selected type and color
    selectedConnectionType.value = type
    selectedConnectionColor.value = color
    // TODO: Store this as default for new connections or update existing connection
  }
}

function onConnectionRightClick({ connectionId, x, y }) {
  console.log('[RIGHT-CLICK] Connection clicked:', connectionId)
  // RIGHT-CLICK: Show context menu to insert element
  const conn = elements.connections.find((c) => c.id === connectionId)
  if (!conn) {
    console.error('[RIGHT-CLICK] Connection not found:', connectionId)
    return
  }

  // Use manualConnections for proper coordinates
  const manualConn = elements.manualConnections.find((c) => c.id === connectionId)

  // Store connection data for insertion
  pendingPortData.value = {
    connectionId,
    connection: conn,
    insertPoint: manualConn
      ? {
          x: (manualConn.x1 + manualConn.x2) / 2,
          y: (manualConn.y1 + manualConn.y2) / 2
        }
      : { x: 0, y: 0 }
  }

  console.log('[RIGHT-CLICK] Insert point:', pendingPortData.value.insertPoint)

  // Set context menu position at mouse
  connectionContextMenuPosition.value = { x, y }

  // Create menu items for different element types
  connectionContextMenuItems.value = [
    { label: 'Insert Card', icon: '▦', action: 'insert-card' },
    { label: 'Insert Text', icon: 'T', action: 'insert-text' },
    { label: 'Insert Image', icon: '📷', action: 'insert-image' },
    { separator: true },
    { label: 'Cancel', icon: '×', action: 'cancel', danger: true }
  ]

  console.log('[RIGHT-CLICK] Opening context menu')
  connectionContextMenuVisible.value = true
}

function onConnectionClick({ connectionId }) {
  console.log('[LEFT-CLICK] Connection clicked:', connectionId)
  // LEFT-CLICK: Open connection config picker
  const conn = elements.connections.find((c) => c.id === connectionId)
  if (!conn) {
    console.error(
      '[LEFT-CLICK] Connection not found:',
      connectionId,
      'Available:',
      elements.connections.map((c) => c.id)
    )
    return
  }

  console.log('[LEFT-CLICK] Found connection:', conn)
  selectedConnectionType.value = conn.connection_type || 'subProject'
  selectedConnectionColor.value = conn.color || '#b55d3a'
  pendingPortData.value = { connectionId }

  // Position picker at connection midpoint (in screen coordinates)
  // Use manualConnections computed property which has x1, y1, x2, y2
  const manualConn = elements.manualConnections.find((c) => c.id === connectionId)
  if (manualConn && manualConn.x1 && manualConn.y1) {
    const midX = (manualConn.x1 + manualConn.x2) / 2
    const midY = (manualConn.y1 + manualConn.y2) / 2
    pickerPosition.value = {
      x: midX * viewport.zoom + viewport.translateX,
      y: midY * viewport.zoom + viewport.translateY
    }
    console.log('[LEFT-CLICK] Picker positioned at:', pickerPosition.value)
  } else {
    // Fallback: use element positions
    const sourceEl = elements.elements.find((el) => el.id === conn.source_element_id)
    const targetEl = elements.elements.find((el) => el.id === conn.target_element_id)
    if (sourceEl && targetEl) {
      const midX = (sourceEl.position_x + targetEl.position_x) / 2
      const midY = (sourceEl.position_y + targetEl.position_y) / 2
      pickerPosition.value = {
        x: midX * viewport.zoom + viewport.translateX,
        y: midY * viewport.zoom + viewport.translateY
      }
      console.log('[LEFT-CLICK] Fallback picker position:', pickerPosition.value)
    } else {
      console.error('[LEFT-CLICK] Cannot calculate picker position')
      return
    }
  }

  console.log('[LEFT-CLICK] Opening picker...')
  showConnectionPicker.value = true

  // Debug after next tick
  setTimeout(() => {
    console.log('[LEFT-CLICK] After timeout, showConnectionPicker =', showConnectionPicker.value)
  }, 100)
}

function handleConnectionContextMenuAction(action) {
  if (!pendingPortData.value?.connection) return

  const conn = pendingPortData.value.connection
  const position = pendingPortData.value.insertPoint

  switch (action) {
    case 'insert-card':
      insertElementBetweenConnection(conn, position, 'card')
      break
    case 'insert-text':
      insertElementBetweenConnection(conn, position, 'text')
      break
    case 'insert-image':
      insertElementBetweenConnection(conn, position, 'image')
      break
    case 'cancel':
      // Do nothing, just close menu
      break
  }

  connectionContextMenuVisible.value = false
  pendingPortData.value = null
}

function insertElementBetweenConnection(connection, position, elementType = 'card') {
  console.log('[INSERT] Inserting', elementType, 'at', position, 'for connection', connection.id)

  const projectId = route.params.projectId

  // Create element at the midpoint
  const size =
    elementType === 'card'
      ? { w: 250, h: 300 }
      : elementType === 'text'
        ? { w: 200, h: 60 }
        : elementType === 'image'
          ? { w: 300, h: 200 }
          : { w: 160, h: 44 }

  elements
    .createElement(
      projectId,
      elementType,
      {
        x: position.x - (elementType === 'card' ? 125 : size.w / 2),
        y: position.y - (elementType === 'card' ? 150 : size.h / 2)
      },
      { width: size.w, height: size.h }
    )
    .then((newElement) => {
      if (!newElement) {
        console.error('[INSERT] Failed to create element')
        return
      }

      console.log('[INSERT] Created element:', newElement.id)

      // Get the source and target elements from the connection
      const sourceElement = elements.elements.find((el) => el.id === connection.source_element_id)
      const targetElement = elements.elements.find((el) => el.id === connection.target_element_id)

      if (!sourceElement || !targetElement) {
        console.error('[INSERT] Source or target element not found')
        return
      }

      // Store connection data before deleting
      const connType = connection.connection_type || 'subProject'
      const connColor = connection.color || '#b55d3a'
      const connSourceSide = connection.source_side || 'right'
      const connTargetSide = connection.target_side || 'left'

      console.log('[INSERT] Deleting old connection:', connection.id)
      // Delete old connection FIRST
      elements.deleteConnection(connection.id)

      // Determine appropriate port sides based on relative positions
      const getSourceSide = (from, to) => {
        const dx = to.position_x - from.position_x
        const dy = to.position_y - from.position_y
        if (Math.abs(dx) > Math.abs(dy)) {
          return dx > 0 ? 'right' : 'left'
        } else {
          return dy > 0 ? 'bottom' : 'top'
        }
      }

      // Wait for Vue reactivity and DOM update
      setTimeout(() => {
        try {
          console.log('[INSERT] Creating first connection...')
          // Connection from source to new element
          const sourceSide = getSourceSide(sourceElement, newElement)
          const newElementSide1 = getOppositeSide(sourceSide)

          const conn1 = elements.createManualConnection(
            sourceElement.id,
            sourceSide,
            newElement.id,
            newElementSide1,
            connType,
            connColor
          )
          console.log('[INSERT] First connection created:', conn1?.id)

          console.log('[INSERT] Creating second connection...')
          // Connection from new element to target
          const targetSide = getSourceSide(targetElement, newElement)
          const newElementSide2 = getOppositeSide(targetSide)

          const conn2 = elements.createManualConnection(
            newElement.id,
            newElementSide2,
            targetElement.id,
            targetSide,
            connType,
            connColor
          )
          console.log('[INSERT] Second connection created:', conn2?.id)
          console.log('[INSERT] Total connections now:', elements.connections.length)

          // Select the new element
          elements.selectElement(newElement.id)
        } catch (err) {
          console.error('[INSERT] Error creating connections:', err)
          // Try to restore original connection
          elements.createConnection({
            source_element_id: sourceElement.id,
            target_element_id: targetElement.id,
            source_side: connSourceSide,
            target_side: connTargetSide,
            x1: position.x,
            y1: position.y,
            x2: position.x,
            y2: position.y,
            connection_type: connType,
            color: connColor
          })
        }
      }, 200)
    })
}

function getOppositeSide(side) {
  switch (side) {
    case 'top':
      return 'bottom'
    case 'bottom':
      return 'top'
    case 'left':
      return 'right'
    case 'right':
      return 'left'
    default:
      return side
  }
}

function onConnectionPickerClose() {
  showConnectionPicker.value = false

  if (pendingPortData.value?.connectionId) {
    // Update the connection with selected type and color
    elements.updateConnection(pendingPortData.value.connectionId, {
      connection_type: selectedConnectionType.value,
      color: selectedConnectionColor.value
    })
  }

  pendingPortData.value = null
}

// Connection port handlers
function onPortClick({ element, side }) {
  // Only show config on single click (not drag)
  const pendingPort = pendingPortData.value
  if (pendingPort && pendingPort.element?.id === element.id && pendingPort.side === side) {
    // Same port clicked again - show config
    selectedConnectionType.value = element.connection_type || 'subProject'
    selectedConnectionColor.value = element.color || '#b55d3a'

    const portPos = getPortPosition(element, side)
    pickerPosition.value = {
      x: portPos.x * viewport.zoom + viewport.translateX,
      y: portPos.y * viewport.zoom + viewport.translateY
    }
    showConnectionPicker.value = true
  }
}

function onPortDragStart({ element, side, color }) {
  console.log('[CanvasEdit] Port drag start:', element.id, side, color)
  isDraggingConnection.value = true
  document.body.classList.add('dragging-connection')
  const portPos = getPortPosition(element, side)

  // Start from the actual port position
  dragConnectionStart.value = { element, side, color }

  dragConnectionLine.value = {
    x1: portPos.x,
    y1: portPos.y,
    x2: portPos.x,
    y2: portPos.y,
    color: color || '#b55d3a'
  }
}

function onPortHover({ element, side }) {
  if (isDraggingConnection.value && dragConnectionStart.value) {
    // Don't highlight if hovering over same element
    if (dragConnectionStart.value.element.id !== element.id) {
      highlightedPort.value = { elementId: element.id, side }
    }
  }
}

function onPortLeave() {
  highlightedPort.value = null
}

function getPortPosition(element, side) {
  // Port position based on element type and side
  switch (side) {
    case 'top':
      return {
        x: element.position_x + element.width / 2,
        y: element.position_y
      }
    case 'bottom':
      return {
        x: element.position_x + element.width / 2,
        y: element.position_y + element.height
      }
    case 'left':
      return {
        x: element.position_x,
        y: element.position_y + element.height / 2
      }
    case 'right':
      return {
        x: element.position_x + element.width,
        y: element.position_y + element.height / 2
      }
    default:
      return { x: element.position_x + element.width / 2, y: element.position_y }
  }
}

// Get available port sides based on element type
function getElementPortSides(element) {
  const type = element.type

  // Text and button/link elements only have top and bottom ports
  if (type === 'text' || type === 'button' || type === 'link') {
    return ['top', 'bottom']
  }

  // Image and card elements have all 4 sides
  return ['top', 'right', 'bottom', 'left']
}

// Mouse move handler for dragging connection line
function onMouseMove(e) {
  if (isDraggingConnection.value && dragConnectionStart.value) {
    e.preventDefault()
    const canvasPos = {
      x: (e.clientX - viewport.translateX) / viewport.zoom,
      y: (e.clientY - viewport.translateY) / viewport.zoom
    }

    const startPort = getPortPosition(
      dragConnectionStart.value.element,
      dragConnectionStart.value.side
    )
    dragConnectionLine.value = {
      ...dragConnectionLine.value,
      x2: canvasPos.x,
      y2: canvasPos.y
    }

    // Check for nearby ports with improved magnetic detection
    // Use clamped zoom scaling for consistent feel across zoom levels
    const baseRadius = 50
    const zoomFactor = Math.log2(viewport.zoom + 1) / Math.log2(2) // Logarithmic scaling
    const clampedZoomFactor = Math.max(0.5, Math.min(2, zoomFactor)) // Clamp between 0.5x and 2x
    const detectionRadius = baseRadius / clampedZoomFactor
    let foundPort = null
    let minDistance = Infinity

    for (const element of elements.elements) {
      if (element.id === dragConnectionStart.value.element.id) continue

      // Determine which sides this element type has ports on
      const availableSides = getElementPortSides(element)

      // Check all available sides
      for (const side of availableSides) {
        const portPos = getPortPosition(element, side)
        const dx = canvasPos.x - portPos.x
        const dy = canvasPos.y - portPos.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Find the closest port within detection radius
        if (distance < detectionRadius && distance < minDistance) {
          minDistance = distance
          foundPort = { elementId: element.id, side }
        }
      }
    }

    // Apply stronger magnetic snap when very close (< 20px)
    const snapThreshold = 20 / clampedZoomFactor
    if (minDistance < snapThreshold && foundPort) {
      // Snap the drag line to the port position
      const snappedPort = getPortPosition(
        elements.elements.find((el) => el.id === foundPort.elementId),
        foundPort.side
      )
      dragConnectionLine.value = {
        ...dragConnectionLine.value,
        x2: snappedPort.x,
        y2: snappedPort.y
      }
    }

    highlightedPort.value = foundPort
  }
}

function onMouseUp(e) {
  if (isDraggingConnection.value && dragConnectionStart.value) {
    e.preventDefault()
    // Check if dropped on a valid port
    if (
      highlightedPort.value &&
      highlightedPort.value.elementId !== dragConnectionStart.value.element.id
    ) {
      const targetElement = elements.elements.find(
        (el) => el.id === highlightedPort.value.elementId
      )
      if (targetElement) {
        // Create connection
        elements.createConnection({
          source_element_id: dragConnectionStart.value.element.id,
          target_element_id: targetElement.id,
          source_side: dragConnectionStart.value.side,
          target_side: highlightedPort.value.side,
          connection_type: selectedConnectionType.value,
          color: dragConnectionStart.value.color
        })
      }
    }

    // Reset drag state
    isDraggingConnection.value = false
    dragConnectionLine.value = null
    dragConnectionStart.value = null
    highlightedPort.value = null
    document.body.classList.remove('dragging-connection')
  }
}

onMounted(async () => {
  const projectId = route.params.projectId
  await permissions.loadPermissions(projectId)
  if (!permissions.canEdit) {
    router.replace({ name: 'canvas-view', params: { projectId } })
    return
  }
  await elements.loadElements(projectId)
  elements.subscribeToRealtime(projectId)
  history.clear()
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)

  if (elements.cards.length > 0) {
    const first = elements.cards[0]
    viewport.centerOn(first.position_x + first.width / 2, first.position_y + first.height / 2, 0.8)
  }
})

onUnmounted(() => {
  elements.unsubscribe()
  viewport.reset()
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped>
.canvas-edit {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.connections-layer-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
  overflow: visible;
  display: block;
}

.dragging-connection {
  cursor: crosshair !important;
}
</style>
