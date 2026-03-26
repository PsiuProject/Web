<template>
  <div
    class="canvas-element canvas-text"
    :class="{ 'with-box': element.content?.boxed, selected: isSelected }"
    :style="textStyle"
    @click="$emit('click', element)"
    @dblclick="$emit('dblclick', element)"
  >
    {{ displayText(element.content?.text) }}
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

const textStyle = computed(() => ({
  left: `${props.element.position_x}px`,
  top: `${props.element.position_y}px`,
  width: `${props.element.width}px`,
  minHeight: `${props.element.height}px`,
  fontSize: `${props.element.font_size || 14}px`,
  color: props.element.text_color || 'var(--paper)',
  backgroundColor: props.element.background || 'transparent',
  borderColor: props.element.border_color || 'var(--moss)',
  transform: `rotate(${props.element.rotation || 0}deg)`,
  zIndex: props.element.z_index || 0
}))
</script>

<style scoped>
.canvas-text {
  position: absolute;
  padding: 0.5rem;
  cursor: pointer;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.canvas-text.with-box {
  background: rgba(20, 20, 18, 0.9);
  border: 1px solid;
}

.canvas-text.selected {
  outline: 2px solid var(--terracotta);
  outline-offset: 2px;
}
</style>
