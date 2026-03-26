<template>
  <div class="canvas-present">
    <button class="exit-present" @click="$router.back()">
      ✕ Exit Presentation
    </button>
    
    <CanvasBase :interactive="true">
      <component
        v-for="element in elements.elements"
        :key="element.id"
        :is="getComponent(element.type)"
        :element="element"
      />
    </CanvasBase>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useElementsStore } from '../stores/elements'
import { useViewportStore } from '../stores/viewport'
import CanvasBase from '../components/Canvas/Render/CanvasBase.vue'
import Card from '../components/Canvas/Render/Card.vue'
import Text from '../components/Canvas/Render/Text.vue'
import Image from '../components/Canvas/Render/Image.vue'
import Link from '../components/Canvas/Render/Link.vue'

const route = useRoute()
const elements = useElementsStore()
const viewport = useViewportStore()

const componentMap = {
  card: Card,
  text: Text,
  image: Image,
  link: Link,
  button: Link
}

function getComponent(type) {
  return componentMap[type] || Text
}

onMounted(async () => {
  const projectId = route.params.projectId
  await elements.loadElements(projectId)
  
  // Center on first card
  if (elements.cards.length > 0) {
    const firstCard = elements.cards[0]
    viewport.centerOn(
      firstCard.position_x + firstCard.width / 2,
      firstCard.position_y + firstCard.height / 2,
      1
    )
  }
})

onUnmounted(() => {
  viewport.reset()
})
</script>

<style scoped>
.canvas-present {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: var(--charcoal);
}

.exit-present {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  padding: 0.5rem 1rem;
  background: rgba(20, 20, 18, 0.9);
  border: 1px solid var(--moss);
  color: var(--paper);
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.2s;
}

.exit-present:hover {
  opacity: 1;
}
</style>
