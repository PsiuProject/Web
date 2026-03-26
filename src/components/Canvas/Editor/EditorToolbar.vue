<template>
  <div class="editor-toolbar" :class="{ collapsed: isCollapsed }">
    <button class="toolbar-toggle" @click="isCollapsed = !isCollapsed">
      {{ isCollapsed ? '>' : '<' }}
    </button>

    <div v-show="!isCollapsed" class="toolbar-content">
      <div class="toolbar-section">
        <span class="section-label">ADD</span>
        <button class="tool-btn" @click="addElement('card')" title="Add Card">
          <span class="tool-icon">&#9633;</span>
          <span class="tool-label">Card</span>
        </button>
        <button class="tool-btn" @click="addElement('text')" title="Add Text">
          <span class="tool-icon">T</span>
          <span class="tool-label">Text</span>
        </button>
        <button class="tool-btn" @click="addElement('image')" title="Add Image">
          <span class="tool-icon">&#9638;</span>
          <span class="tool-label">Image</span>
        </button>
        <button class="tool-btn" @click="addElement('link')" title="Add Link">
          <span class="tool-icon">&rarr;</span>
          <span class="tool-label">Link</span>
        </button>
        <button class="tool-btn" @click="addElement('button')" title="Add Button">
          <span class="tool-icon">&#9744;</span>
          <span class="tool-label">Button</span>
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
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useElementsStore } from '../../../stores/elements'
import { useViewportStore } from '../../../stores/viewport'
import { useHistoryStore } from '../../../stores/history'

const route = useRoute()
const elements = useElementsStore()
const viewport = useViewportStore()
const history = useHistoryStore()

const isCollapsed = ref(false)

function getCanvasCenter() {
  const vw = window.innerWidth / 2
  const vh = window.innerHeight / 2
  return {
    x: (vw - viewport.translateX) / viewport.zoom,
    y: (vh - viewport.translateY) / viewport.zoom
  }
}

async function addElement(type) {
  const center = getCanvasCenter()
  const projectId = route.params.projectId

  const defaults = {
    card: { width: 280, height: 370, content: { title: { pt: 'Novo Card' }, description: { pt: '' }, status: 'active' } },
    text: { width: 200, height: 60, content: { text: { pt: 'Novo texto' }, boxed: false } },
    image: { width: 300, height: 200, content: { url: '', caption: { pt: '' } } },
    link: { width: 180, height: 44, content: { url: 'https://', label: { pt: 'Link' } } },
    button: { width: 160, height: 44, content: { url: 'https://', label: { pt: 'Button' } } }
  }

  const def = defaults[type] || defaults.text
  const el = await elements.createElement(projectId, type, {
    x: center.x - def.width / 2,
    y: center.y - def.height / 2
  }, { width: def.width, height: def.height })

  if (el) {
    await elements.updateElement(el.id, { content: def.content })
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
  const el = await elements.createElement(projectId, src.type, {
    x: src.position_x + 30,
    y: src.position_y + 30
  }, { width: src.width, height: src.height })

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
}

.toolbar-toggle {
  background: rgba(20, 20, 18, 0.95);
  border: 1px solid var(--moss);
  border-left: none;
  color: var(--moss-light);
  padding: 0.5rem 0.3rem;
  cursor: pointer;
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
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
  backdrop-filter: blur(10px);
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 80vh;
  overflow-y: auto;
}

.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.section-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.55rem;
  color: var(--moss);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 0.5rem;
  margin-bottom: 0.25rem;
}

.toolbar-divider {
  height: 1px;
  background: var(--moss);
  opacity: 0.3;
  margin: 0.25rem 0;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid transparent;
  color: var(--paper);
  padding: 0.4rem 0.5rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.tool-btn:hover:not(:disabled) {
  background: rgba(106, 125, 91, 0.15);
  border-color: var(--moss);
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
  width: 1.2rem;
  text-align: center;
  font-size: 1rem;
  color: var(--stencil-orange);
}

.tool-label {
  font-size: 0.7rem;
}

.editor-toolbar.collapsed .toolbar-content {
  display: none;
}
</style>
