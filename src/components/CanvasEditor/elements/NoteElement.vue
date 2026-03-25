<template>
  <div class="element-note">
    <div class="note-content">{{ text }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: { type: Object, required: true }
})

const text = computed(() => props.content?.text)
</script>

<style scoped>
.element-note {
  width: 100%;
  height: 100%;
  background: #fef3c7;
  padding: 12px;
  color: #1f2937;
  font-size: 0.9rem;
  writing-mode: vertical-rl;
}

.note-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
