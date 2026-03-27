<template>
  <div
    class="connection-port"
    :class="[
      `port-${side}`,
      { 
        'port-active': isActive, 
        'port-highlight': isHighlighted,
        'port-valid-target': isValidTarget,
        'port-invalid-target': isInvalidTarget
      }
    ]"
    :style="portStyle"
    @click="onClick"
    @mousedown.stop="onDragStart"
    @mouseenter="onHover"
    @mouseleave="onLeave"
    draggable="false"
    @dragstart.prevent
  >
    <div class="port-inner" :style="innerStyle"></div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  side: {
    type: String,
    required: true,
    validator: (v) => ['top', 'bottom', 'left', 'right'].includes(v)
  },
  element: {
    type: Object,
    required: true
  },
  color: {
    type: String,
    default: '#b55d3a'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  isHighlighted: {
    type: Boolean,
    default: false
  },
  isValidTarget: {
    type: Boolean,
    default: false
  },
  isInvalidTarget: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'drag-start', 'hover', 'leave'])

const isHovered = ref(false)
const isActive = ref(false)
const dragStartPosition = ref(null)  // Track where mousedown occurred
const wasDragOperation = ref(false)  // Track if mouse moved enough to be a drag
const DRAG_THRESHOLD = 5  // Pixels of movement to consider it a drag vs click

const portStyle = computed(() => {
  const baseStyles = {
    opacity: props.isVisible ? 1 : 0,
    transition: 'all 0.2s ease',
    pointerEvents: 'auto'
  }

  // Position at center of each edge
  const positionStyles = {
    top: {
      left: '50%',
      top: '0',
      transform: 'translate(-50%, -50%)'
    },
    bottom: {
      left: '50%',
      bottom: '0',
      transform: 'translate(-50%, 50%)'
    },
    left: {
      left: '0',
      top: '50%',
      transform: 'translate(-50%, -50%)'
    },
    right: {
      right: '0',
      top: '50%',
      transform: 'translate(50%, -50%)'
    }
  }

  return {
    ...baseStyles,
    ...positionStyles[props.side]
  }
})

const innerStyle = computed(() => ({
  backgroundColor: props.color,
  boxShadow: isHovered.value || props.isHighlighted 
    ? `0 0 8px ${props.color}, 0 0 16px ${props.color}` 
    : `0 0 4px ${props.color}`
}))

function onClick(e) {
  // Don't trigger click if this was a drag operation (mouse moved during mousedown)
  if (wasDragOperation.value) {
    wasDragOperation.value = false
    dragStartPosition.value = null
    return
  }
  dragStartPosition.value = null
  isActive.value = !isActive.value
  emit('click', { side: props.side, element: props.element })
}

function onDragStart(e) {
  if (e.button !== 0) return
  console.log('[ConnectionPort] Drag started:', props.side, props.element.id)
  // Store the drag start position
  dragStartPosition.value = { x: e.clientX, y: e.clientY }
  wasDragOperation.value = false  // Reset until we detect movement
  emit('drag-start', { side: props.side, element: props.element, color: props.color })
}

function onHover() {
  isHovered.value = true
  emit('hover', { side: props.side, element: props.element })
}

function onLeave() {
  isHovered.value = false
  // Reset state if mouse leaves
  dragStartPosition.value = null
  wasDragOperation.value = false
  emit('leave', { side: props.side, element: props.element })
}

// Global mouseup handler to reset state
function onMouseUp() {
  dragStartPosition.value = null
  wasDragOperation.value = false
}

// Global mousemove handler to detect drag vs click
function onMouseMove(e) {
  if (dragStartPosition.value) {
    const dx = e.clientX - dragStartPosition.value.x
    const dy = e.clientY - dragStartPosition.value.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // If moved more than threshold, mark as drag operation
    if (distance > DRAG_THRESHOLD) {
      wasDragOperation.value = true
    }
  }
}

onMounted(() => {
  document.addEventListener('mouseup', onMouseUp)
  document.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('mousemove', onMouseMove)
})
</script>

<style scoped>
.connection-port {
  position: absolute;
  z-index: 100;
  cursor: crosshair;
}

.port-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.connection-port:hover .port-inner {
  transform: scale(1.4);
}

.connection-port.port-highlight .port-inner {
  transform: scale(1.3);
  animation: portPulse 1.5s ease-in-out infinite;
}

.connection-port.port-valid-target .port-inner {
  background-color: #4ade80 !important;
  box-shadow: 0 0 8px #4ade80, 0 0 16px #4ade80 !important;
  animation: validPulse 1s ease-in-out infinite;
}

.connection-port.port-invalid-target .port-inner {
  background-color: #f87171 !important;
  box-shadow: 0 0 8px #f87171, 0 0 16px #f87171 !important;
}

@keyframes portPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

@keyframes validPulse {
  0%, 100% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(1.4);
  }
}
</style>
