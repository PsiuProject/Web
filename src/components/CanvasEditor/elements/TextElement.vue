<template>
  <div class="element-text" v-html="html || text"></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: { type: Object, required: true }
})

const text = computed(() => props.content?.text)
const html = computed(() => props.content?.html)
</script>

<style scoped>
.element-text {
  width: 100%;
  height: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--paper);
  font-size: 0.9rem;
  line-height: 1.6;
}
</style>
