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
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const props = defineProps({
  element: { type: Object, required: true },
  isSelected: { type: Boolean, default: false }
})

defineEmits(['click', 'dblclick'])

function displayText(value) {
  if (!value) return ''
  if (typeof value === 'object') return value[locale.value] ?? value['pt'] ?? ''
  return value
}

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
