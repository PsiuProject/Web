<template>
  <div class="element-image-container">
    <img 
      :src="url" 
      :alt="caption || 'Image'" 
      class="element-image"
      @error="onImageError"
    />
    <div v-if="caption" class="image-caption">{{ caption }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: { type: Object, required: true }
})

const url = computed(() => props.content?.url)
const caption = computed(() => props.content?.caption)

function onImageError(e) {
  e.target.src = '' // Clear broken image
}
</script>

<style scoped>
.element-image-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.element-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: var(--paper);
  font-size: 0.75rem;
  padding: 4px 8px;
}

.element-image:not([src]),
.element-image[src=""] {
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.element-image:not([src])::after,
.element-image[src=""]::after {
  content: 'Image not loaded';
  color: var(--moss-light);
  font-size: 0.75rem;
  font-family: 'Space Mono', monospace;
}
</style>
