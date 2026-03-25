<template>
  <div class="element-card" :class="'status-' + status">
    <div class="card-status-tag">{{ status || 'active' }}</div>
    <h3 class="card-title">{{ title || 'Untitled Card' }}</h3>
    <p class="card-description">{{ description || '' }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: { type: Object, required: true }
})

const title = computed(() => props.content?.title)
const description = computed(() => props.content?.description)
const status = computed(() => props.content?.status || 'active')
</script>

<style scoped>
.element-card {
  width: 100%;
  height: 100%;
  background: rgba(20, 20, 18, 0.95);
  border: 1px solid var(--moss);
  padding: 16px;
  overflow: hidden;
}

.card-status-tag {
  display: inline-block;
  padding: 4px 8px;
  font-size: 0.6rem;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 8px;
  font-family: 'Space Mono', monospace;
}

.status-active .card-status-tag { background: rgba(255, 95, 31, 0.2); color: #ff5f1f; }
.status-pipeline .card-status-tag { background: rgba(106, 125, 91, 0.2); color: #6a7d5b; }
.status-done .card-status-tag { background: rgba(181, 93, 58, 0.2); color: #b55d3a; }

.card-title {
  font-size: 1rem;
  font-weight: bold;
  color: var(--paper);
  margin-bottom: 8px;
}

.card-description {
  font-size: 0.8rem;
  color: var(--paper);
  opacity: 0.8;
  line-height: 1.4;
}
</style>
