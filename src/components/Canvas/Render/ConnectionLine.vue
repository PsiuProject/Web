<template>
  <g 
    class="connection-group"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @mousemove="updateMousePosition"
    @contextmenu.prevent.stop="onRightClick"
  >
    <!-- Invisible wider line for easier hover/click detection -->
    <path
      :d="pathData"
      stroke="transparent"
      stroke-width="60"
      fill="none"
      style="cursor: pointer;"
      @click.stop="onClick"
      @contextmenu.stop
    />
    
    <!-- Main flat modern dotted line - always animated -->
    <path
      :d="pathData"
      :stroke="lineColor"
      stroke-width="4"
      fill="none"
      stroke-linecap="round"
      :stroke-dasharray="dotPattern"
      class="connection-line-dotted connection-line-animated"
    />
    
    <!-- Connection dots at endpoints (subtle) -->
    <circle
      :cx="x1"
      :cy="y1"
      r="5"
      :fill="lineColor"
      class="connection-dot"
    />
    <circle
      :cx="x2"
      :cy="y2"
      r="5"
      :fill="lineColor"
      class="connection-dot"
    />
    
    <!-- Tooltip at mouse position -->
    <g v-if="isHovered && connectionTypeKey" class="connection-tooltip" :transform="tooltipTransform">
      <rect
        x="-80"
        y="-18"
        :width="tooltipWidth"
        height="36"
        fill="rgba(13, 13, 13, 0.95)"
        :stroke="lineColor"
        stroke-width="1"
        rx="8"
        filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))"
      />
      <text
        text-anchor="middle"
        dominant-baseline="central"
        fill="#e2ded0"
        font-size="14"
        font-family="'Space Mono', monospace"
        style="pointer-events: none; letter-spacing: 0.04em; font-weight: 700;"
      >
        {{ connectionLabel }}
      </text>
    </g>
  </g>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  x1: { type: Number, required: true },
  y1: { type: Number, required: true },
  x2: { type: Number, required: true },
  y2: { type: Number, required: true },
  connectionTypeKey: { type: String, default: 'connections.subProject' },
  color: { type: String, default: '#b55d3a' },
  isDragging: { type: Boolean, default: false },
  animationStyle: { type: String, default: 'flat' },
  connectionId: { type: String, default: null }
})

const emit = defineEmits(['right-click', 'click'])

// Always animate - increased speed for subtle effect
const animationDuration = computed(() => {
  const length = Math.sqrt(Math.pow(props.x2 - props.x1, 2) + Math.pow(props.y2 - props.y1, 2))
  return Math.max(1, length / 100).toFixed(2) + 's'
})

const isHovered = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)

// Dynamic dot pattern based on line length
const dotPattern = computed(() => {
  return '8 8' // 8px dots, 8px gaps
})

// Store mouse position on hover for tooltip
function updateMousePosition(e) {
  const svg = e.currentTarget.closest('svg')
  if (svg) {
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
    mouseX.value = svgP.x
    mouseY.value = svgP.y
  }
}

// Add mouse move listener to track position
onMounted(() => {
  // Tooltip follows mouse dynamically
})

// Smooth curve path calculation
const pathData = computed(() => {
  const dx = props.x2 - props.x1
  const dy = props.y2 - props.y1
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Simpler, flatter curve
  const controlOffset = Math.min(50, distance * 0.2)
  
  // Cubic bezier for smooth S-curve
  const cx1 = props.x1 + (dx * 0.5)
  const cy1 = props.y1
  const cx2 = props.x1 + (dx * 0.5)
  const cy2 = props.y2
  
  return `M ${props.x1} ${props.y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${props.x2} ${props.y2}`
})

// Tooltip follows mouse position dynamically
const tooltipTransform = computed(() => {
  if (mouseX.value && mouseY.value) {
    // Position tooltip centered above the mouse cursor
    return `translate(${mouseX.value}, ${mouseY.value - 50})`
  }
  // Fallback to midpoint if no mouse position
  const midX = (props.x1 + props.x2) / 2
  const midY = (props.y1 + props.y2) / 2
  return `translate(${midX}, ${midY - 50})`
})

const tooltipWidth = computed(() => {
  const label = connectionLabel.value || ''
  // Dynamic width based on text length, minimum 160px for better visibility
  return Math.max(180, label.length * 11 + 60)
})

const lineColor = computed(() => props.color)

// Get connection label from translation key
const connectionLabel = computed(() => {
  if (!props.connectionTypeKey) return ''
  // Extract just the type from 'connections.subProject' format
  const parts = props.connectionTypeKey.split('.')
  const type = parts[parts.length - 1]
  // Return the translated label or the type itself
  try {
    return t(`connections.${type}`) || type
  } catch (e) {
    return type
  }
})

function onRightClick(e) {
  console.log('[ConnectionLine] RIGHT-CLICK emitted:', props.connectionId)
  e.preventDefault()
  e.stopPropagation()
  emit('right-click', {
    connectionId: props.connectionId,
    x: e.clientX,
    y: e.clientY
  })
}

function onClick(e) {
  console.log('[ConnectionLine] LEFT-CLICK emitted:', props.connectionId)
  e.stopPropagation()
  emit('click', {
    connectionId: props.connectionId
  })
}
</script>

<style scoped>
.connection-group {
  pointer-events: auto;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.connection-line-dotted {
  transition: stroke-width 0.2s ease, opacity 0.2s ease;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.8;
}

.connection-line-animated {
  animation: dottedFlow v-bind(animationDuration) linear infinite;
  stroke-width: 5;
  opacity: 1;
}

.connection-dot {
  transition: r 0.2s ease;
  opacity: 0.8;
}

.connection-group:hover .connection-dot {
  r: 7;
  opacity: 1;
}

/* Dotted flow animation */
@keyframes dottedFlow {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -32;
  }
}

.connection-tooltip {
  pointer-events: none;
  animation: tooltipFadeIn 0.15s ease-out;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(-45px);
  }
}
</style>
