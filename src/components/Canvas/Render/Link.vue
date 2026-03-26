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
  </a>
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
