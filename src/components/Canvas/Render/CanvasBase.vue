<template>
  <div
    ref="viewportRef"
    class="canvas-viewport"
    :class="{ dragging: viewport.isDragging, zooming: viewport.isZooming }"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
    @wheel="onWheel"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @dragover.prevent
    @drop.prevent="onCanvasDrop"
  >
    <div
      class="canvas-container"
      :class="{ 'smooth-zoom': viewport.isZooming }"
      :style="{ transform: viewport.canvasTransform }"
    >
      <Grid />

      <svg class="connections-layer">
        <ConnectionLine
          v-for="conn in elements.connections"
          :key="conn.id"
          :x1="conn.x1"
          :y1="conn.y1"
          :x2="conn.x2"
          :y2="conn.y2"
          :connectionTypeKey="conn.type"
        />
      </svg>

      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useViewportStore } from '../../../stores/viewport'
import { useElementsStore } from '../../../stores/elements'
import Grid from './Grid.vue'
import ConnectionLine from './ConnectionLine.vue'

const props = defineProps({
  interactive: { type: Boolean, default: true }
})

const emit = defineEmits(['canvas-click', 'canvas-drop'])

const viewport = useViewportStore()
const elements = useElementsStore()
const viewportRef = ref(null)

function onMouseDown(e) {
  if (!props.interactive) return
  if (
    e.target.closest('.canvas-element') ||
    e.target.closest('.comment-bubble') ||
    e.target.closest('.resize-handle') ||
    e.target.closest('.connection-port')
  )
    return

  // Don't start viewport drag if in connection dragging mode
  const canvasEdit = document.querySelector('.canvas-edit')
  if (canvasEdit && canvasEdit.classList.contains('dragging-connection')) return

  emit('canvas-click')
  viewport.updateMouse(e.clientX, e.clientY)
  viewport.setStart(e.clientX, e.clientY)
  viewport.setDragging(true)
}

function onMouseMove(e) {
  if (!props.interactive) return
  // Don't pan viewport if in connection dragging mode
  const canvasEdit = document.querySelector('.canvas-edit')
  if (canvasEdit && canvasEdit.classList.contains('dragging-connection')) return

  viewport.updateMouse(e.clientX, e.clientY)
  if (viewport.isDragging) {
    viewport.updateTranslate(e.clientX, e.clientY)
  }
}

function onMouseUp() {
  if (!props.interactive) return
  viewport.setDragging(false)
}

function onMouseLeave() {
  if (!props.interactive) return
  viewport.setDragging(false)
}

function onCanvasDrop(e) {
  const cellData = e.dataTransfer.getData('cell-data')
  if (!cellData) return
  try {
    const cell = JSON.parse(cellData)
    const sourceCardId = e.dataTransfer.getData('source-card-id')
    const sourceCellIdx = parseInt(e.dataTransfer.getData('cell-idx'))
    const x = (e.clientX - viewport.translateX) / viewport.zoom
    const y = (e.clientY - viewport.translateY) / viewport.zoom
    emit('canvas-drop', { cell, x, y, sourceCardId, sourceCellIdx })
  } catch {}
}

function onWheel(e) {
  if (!props.interactive) return
  e.preventDefault()
  viewport.adjustZoom(e.deltaY, e.clientX, e.clientY)
}

function onTouchStart(e) {
  if (!props.interactive) return
  // Prevent default only for multi-touch (pinch)
  if (e.touches.length === 2) {
    e.preventDefault()
  }
  viewport.onTouchStart(e)
}

function onTouchMove(e) {
  if (!props.interactive) return
  // Always prevent default on touch move to avoid browser scrolling/zooming
  e.preventDefault()
  viewport.onTouchMove(e)
}

function onTouchEnd(e) {
  if (!props.interactive) return
  viewport.onTouchEnd(e)
}
</script>

<style scoped>
.canvas-viewport {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--charcoal);
  cursor: grab;
  touch-action: none; /* Prevent browser handling of touch gestures */
}

.canvas-viewport.dragging {
  cursor: grabbing;
}

.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: 0 0;
  will-change: transform;
}

.canvas-container.smooth-zoom {
  transition: transform 0.1s ease-out;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: visible;
}
</style>
