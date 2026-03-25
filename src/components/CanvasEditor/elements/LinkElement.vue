<template>
  <a :href="url" target="_blank" rel="noopener noreferrer" class="element-link">
    <span class="link-icon">&#128279;</span>
    {{ label || url }}
  </a>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: { type: Object, required: true }
})

const url = computed(() => props.content?.url)
const label = computed(() => props.content?.label)
</script>

<style scoped>
.element-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(106, 125, 91, 0.15);
  border: 1px solid var(--moss);
  color: var(--paper);
  text-decoration: none;
  font-size: 0.85rem;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.element-link:hover {
  background: rgba(106, 125, 91, 0.3);
}

.link-icon {
  font-size: 1rem;
}
</style>
