<template>
  <div 
    ref="viewportRef"
    class="canvas-viewport"
    :class="{ 'dragging': viewport.isDragging, 'zooming': viewport.isZooming }"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
    @wheel="onWheel"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
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
          :type="conn.type"
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

const emit = defineEmits(['canvas-click'])

const viewport = useViewportStore()
const elements = useElementsStore()
const viewportRef = ref(null)

function onMouseDown(e) {
  if (!props.interactive) return
  if (e.target.closest('.canvas-element')) return
  
  emit('canvas-click')
  viewport.updateMouse(e.clientX, e.clientY)
  viewport.setStart(e.clientX, e.clientY)
  viewport.setDragging(true)
}

function onMouseMove(e) {
  if (!props.interactive) return
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

function onWheel(e) {
  if (!props.interactive) return
  e.preventDefault()
  viewport.adjustZoom(e.deltaY, e.clientX, e.clientY)
}

function onTouchStart(e) {
  if (!props.interactive) return
  viewport.onTouchStart(e)
}

function onTouchMove(e) {
  if (!props.interactive) return
  viewport.onTouchMove(e)
}

function onTouchEnd() {
  if (!props.interactive) return
  viewport.onTouchEnd()
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
}
</style>
