<template>
  <div
    class="canvas-element canvas-image"
    :class="{ selected: isSelected }"
    :style="imageStyle"
    @click="$emit('click', element)"
    @dblclick="$emit('dblclick', element)"
  >
    <img v-if="element.content?.url" :src="element.content.url" :alt="displayText(element.content?.caption)" />
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
        :is-highlighted="highlightedPort?.elementId === element.id && highlightedPort?.side === side"
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

const imageStyle = computed(() => ({
  left: `${props.element.position_x}px`,
  top: `${props.element.position_y}px`,
  width: `${props.element.width}px`,
  height: `${props.element.height}px`,
  transform: `rotate(${props.element.rotation || 0}deg)`,
  zIndex: props.element.z_index || 0
}))
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
