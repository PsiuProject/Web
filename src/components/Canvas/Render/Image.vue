<template>
  <div
    class="canvas-element canvas-image"
    :class="{ selected: isSelected }"
    :style="imageStyle"
    @click="$emit('click', element)"
    @dblclick="$emit('dblclick', element)"
  >
    <img
      v-if="element.content?.url"
      :src="element.content.url"
      :alt="displayText(element.content?.caption)"
    />
    <div v-if="element.content?.caption" class="image-caption">
      {{ displayText(element.content.caption) }}
    </div>

    <!-- Connection ports (visible in connection mode) - ALL 4 SIDES for images -->
    <template v-if="showPorts">
      <ConnectionPort
        v-for="side in ['top', 'right', 'bottom', 'left']"
        :key="side"
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
  </div>
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

const imageStyle = computed(() => {
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
    height: `${el.height}px`,
    transform: transform,
    zIndex: el.z_index || 0,
    opacity: style.opacity ?? 1,
    borderRadius: borderRadius,
    boxShadow: boxShadow,
    border: border,
    objectFit: style.objectFit || 'cover'
  }
})
</script>

<style scoped>
.canvas-image {
  position: absolute;
  cursor: pointer;
  overflow: hidden;
  border: 1px solid var(--moss);
}

.canvas-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.canvas-image.selected {
  outline: 2px solid var(--terracotta);
  outline-offset: 2px;
}

.image-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(20, 20, 18, 0.9);
  padding: 0.5rem;
  font-size: 0.75rem;
  color: var(--moss-light);
}
</style>
