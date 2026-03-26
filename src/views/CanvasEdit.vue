<template>
  <div class="canvas-edit">
    <AppHeader mode="edit" />
    <EditorToolbar />

    <CanvasBase :interactive="true" @canvas-click="onCanvasClick">
      <component
        v-for="element in elements.elements"
        :key="element.id"
        :is="getComponent(element.type)"
        :element="element"
        :isSelected="elements.selectedId === element.id"
        @click="onElementClick(element)"
        @dblclick="onElementDoubleClick(element)"
        @mousedown.stop="onElementDragStart($event, element)"
      />

      <!-- Connection lines -->
      <svg class="element-connections" xmlns="http://www.w3.org/2000/svg">
        <ConnectionLine
          v-for="conn in elements.connections"
          :key="conn.id"
          :x1="conn.x1"
          :y1="conn.y1"
          :x2="conn.x2"
          :y2="conn.y2"
          :connectionTypeKey="conn.type"
          color="#b55d3a"
        />
      </svg>
    </CanvasBase>

    <PropertiesPanel v-if="elements.selectedElement" />

    <InlineEditor
      v-if="editingElement"
      :element="editingElement"
      :field="editingField"
      :isEditing="!!editingElement"
      @save="onInlineSave"
      @cancel="editingElement = null"
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
import AppHeader from '../components/Layout/AppHeader.vue'
import CanvasBase from '../components/Canvas/Render/CanvasBase.vue'
import ConnectionLine from '../components/Canvas/Render/ConnectionLine.vue'
import EditorToolbar from '../components/Canvas/Editor/EditorToolbar.vue'
import PropertiesPanel from '../components/Canvas/Editor/PropertiesPanel.vue'
import InlineEditor from '../components/Canvas/Editor/InlineEditor.vue'
import Card from '../components/Canvas/Render/Card.vue'
import Text from '../components/Canvas/Render/Text.vue'
import ImageEl from '../components/Canvas/Render/Image.vue'
import Link from '../components/Canvas/Render/Link.vue'

const route = useRoute()
const router = useRouter()
const elements = useElementsStore()
const viewport = useViewportStore()
const permissions = usePermissionsStore()
const history = useHistoryStore()

const editingElement = ref(null)
const editingField = ref('text')

const componentMap = { card: Card, text: Text, image: ImageEl, link: Link, button: Link }

function getComponent(type) {
  return componentMap[type] || Text
}

function onCanvasClick() {
  elements.clearSelection()
}

function onElementClick(element) {
  elements.selectElement(element.id)
}

function onElementDoubleClick(element) {
  // Determine which field to edit based on type
  const fieldMap = {
    card: 'title',
    text: 'text',
    image: 'caption',
    link: 'label',
    button: 'label'
  }
  editingField.value = fieldMap[element.type] || 'text'
  editingElement.value = element
}

function onInlineSave({ field, value }) {
  if (!editingElement.value) return
  const prevContent = { ...editingElement.value.content }
  const newContent = { ...editingElement.value.content, [field]: value }
  history.push({ action: 'update', elementId: editingElement.value.id, state: { content: prevContent } })
  elements.updateElement(editingElement.value.id, { content: newContent })
  editingElement.value = null
}

// Element drag logic
let draggedElement = null
let dragStartPos = { x: 0, y: 0 }
let dragStartElementPos = { x: 0, y: 0 }
let hasMoved = false

function onElementDragStart(e, element) {
  if (e.button !== 0) return
  draggedElement = element
  dragStartPos = { x: e.clientX, y: e.clientY }
  dragStartElementPos = { x: element.position_x, y: element.position_y }
  hasMoved = false

  elements.selectElement(element.id)

  const onMove = (moveE) => {
    if (!draggedElement) return

    const dx = (moveE.clientX - dragStartPos.x) / viewport.zoom
    const dy = (moveE.clientY - dragStartPos.y) / viewport.zoom

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true
    }

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
        state: {
          position_x: dragStartElementPos.x,
          position_y: dragStartElementPos.y
        }
      })
    }
    draggedElement = null
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
}

// Keyboard shortcuts
function onKeyDown(e) {
  // Ctrl+Z / Cmd+Z = undo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    history.undo()
  }
  // Ctrl+Shift+Z / Cmd+Shift+Z = redo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
    e.preventDefault()
    history.redo()
  }
  // Ctrl+Y = redo
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault()
    history.redo()
  }
  // Delete / Backspace
  if ((e.key === 'Delete' || e.key === 'Backspace') && elements.selectedId && !editingElement.value) {
    e.preventDefault()
    const el = elements.selectedElement
    if (el) {
      history.push({ action: 'delete', elementId: el.id, state: { ...el } })
      elements.deleteElement(el.id)
    }
  }
  // Escape
  if (e.key === 'Escape') {
    if (editingElement.value) {
      editingElement.value = null
    } else {
      elements.clearSelection()
    }
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

  if (elements.cards.length > 0) {
    const first = elements.cards[0]
    viewport.centerOn(first.position_x + first.width / 2, first.position_y + first.height / 2, 0.8)
  }
})

onUnmounted(() => {
  elements.unsubscribe()
  viewport.reset()
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.canvas-edit {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.element-connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}
</style>
