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
        :is-highlighted="highlightedPort?.elementId === element.id && highlightedPort?.side === side"
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

const linkStyle = computed(() => ({
  left: `${props.element.position_x}px`,
  top: `${props.element.position_y}px`,
  width: `${props.element.width}px`,
  minHeight: `${props.element.height}px`,
  fontSize: `${props.element.font_size || 14}px`,
  color: props.element.text_color || 'var(--moss-light)',
  backgroundColor: props.element.background || 'transparent',
  borderColor: props.element.border_color || 'var(--moss)',
  transform: `rotate(${props.element.rotation || 0}deg)`,
  zIndex: props.element.z_index || 0
}))
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
