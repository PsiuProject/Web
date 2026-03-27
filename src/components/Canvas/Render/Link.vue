<template>
  <a
    class="canvas-element canvas-link"
    :class="{ selected: isSelected, button: element.type === 'button' }"
    :style="linkStyle"
    :href="element.content?.url"
    target="_blank"
    rel="noopener noreferrer"
    @click.stop="$emit('click', element)"
    @dblclick.prevent="$emit('dblclick', element)"
  >
    {{ displayText(element.content?.label) || element.content?.url }}

    <!-- Connection ports (visible in connection mode) - TOP and BOTTOM only for buttons/links -->
    <template v-if="showPorts">
      <ConnectionPort
        v-for="side in ['top', 'bottom']"
        :key="`port-${side}`"
        :side="side"
        :element="element"
        :color="portColor"
        :is-highlighted="
          highlightedPort?.elementId === element.id && highlightedPort?.side === side
        "
        @mousedown.stop
        @click="$emit('port-click', { element, side })"
        @drag-start="$emit('port-drag-start', { element, side, color: portColor })"
        @hover="$emit('port-hover', { element, side })"
        @leave="$emit('port-leave', { element, side })"
      />
    </template>
  </a>
</template>

<script setup>
import { computed } from 'vue'
import { useI18nStore } from '../../../stores/i18n-store'
import ConnectionPort from './ConnectionPort.vue'

const props = defineProps({
  element: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false },
  showPorts: { type: Boolean, default: false },
  highlightedPort: { type: Object, default: null }
})

defineEmits(['click', 'dblclick', 'port-click', 'port-drag-start', 'port-hover', 'port-leave'])

const i18nStore = useI18nStore()

function displayText(value) {
  if (!value) return ''
  if (typeof value === 'object') return value[i18nStore.currentLocale] ?? value['pt'] ?? ''
  return value
}

// Port color based on connection type or default
const portColor = computed(() => {
  return props.element.color || '#b55d3a'
})

const linkStyle = computed(() => {
  const el = props.element
  const style = el.style || {}

  // Build transform string with rotation and scale
  let transform = `rotate(${el.rotation || 0}deg)`
  if (style.scaleX && style.scaleX !== 1) {
    transform = `scaleX(${style.scaleX}) ${transform}`
  }
  if (style.scaleY && style.scaleY !== 1) {
    transform = `scaleY(${style.scaleY}) ${transform}`
  }

  // Build border radius CSS
  let borderRadius = '0'
  if (style.borderRadius) {
    if (typeof style.borderRadius === 'number') {
      borderRadius = `${style.borderRadius}px`
    } else if (typeof style.borderRadius === 'object') {
      const { topLeft = 0, topRight = 0, bottomRight = 0, bottomLeft = 0 } = style.borderRadius
      borderRadius = `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`
    } else if (typeof style.borderRadius === 'string') {
      borderRadius = style.borderRadius
    }
  }

  // Build box-shadow CSS
  let boxShadow = 'none'
  if (style.shadow) {
    const { x = 0, y = 4, blur = 8, spread = 0, color = '#000000', opacity = 0.25 } = style.shadow
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    boxShadow = `${x}px ${y}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  // Build border CSS
  const borderWidth = style.borderWidth || 0
  const borderColor = style.borderColor || 'var(--moss)'
  const borderStyle = style.borderStyle || 'solid'
  const border = borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none'

  return {
    left: `${el.position_x}px`,
    top: `${el.position_y}px`,
    width: `${el.width}px`,
    minHeight: `${el.height}px`,
    fontSize: `${el.font_size || 14}px`,
    color: el.text_color || 'var(--moss-light)',
    backgroundColor: el.background || 'transparent',
    borderColor: borderColor,
    transform: transform,
    zIndex: el.z_index || 0,
    opacity: style.opacity ?? 1,
    borderRadius: borderRadius,
    boxShadow: boxShadow,
    border: border
  }
})
</script>

<style scoped>
.canvas-link {
  position: absolute;
  padding: 0.5rem 1rem;
  text-decoration: none;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.canvas-link:hover {
  border-color: var(--moss-light);
  background: rgba(106, 125, 91, 0.1);
}

.canvas-link.button {
  background: var(--moss);
  color: var(--paper);
  border-color: var(--moss);
}

.canvas-link.button:hover {
  background: var(--moss-light);
}

.canvas-link.selected {
  outline: 2px solid var(--terracotta);
  outline-offset: 2px;
}
</style>
