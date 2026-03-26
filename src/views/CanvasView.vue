<template>
  <div class="canvas-view">
    <AppHeader mode="view" />

    <CanvasBase :interactive="true">
      <component
        v-for="element in elements.elements"
        :key="element.id"
        :is="getComponent(element.type)"
        :element="element"
        :isSelected="elements.selectedId === element.id"
        @click="elements.selectElement(element.id)"
      />

      <!-- Connection lines between elements -->
      <svg class="element-connections" xmlns="http://www.w3.org/2000/svg">
        <ConnectionLine
          v-for="conn in elements.connections"
          :key="conn.id"
          :x1="conn.x1"
          :y1="conn.y1"
          :x2="conn.x2"
          :y2="conn.y2"
          :connectionTypeKey="conn.type"
          color="#b55d3a"
        />
      </svg>
    </CanvasBase>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useElementsStore } from '../stores/elements'
import { useViewportStore } from '../stores/viewport'
import { usePermissionsStore } from '../stores/permissions'
import AppHeader from '../components/Layout/AppHeader.vue'
import CanvasBase from '../components/Canvas/Render/CanvasBase.vue'
import ConnectionLine from '../components/Canvas/Render/ConnectionLine.vue'
import Card from '../components/Canvas/Render/Card.vue'
import Text from '../components/Canvas/Render/Text.vue'
import ImageEl from '../components/Canvas/Render/Image.vue'
import Link from '../components/Canvas/Render/Link.vue'

const route = useRoute()
const elements = useElementsStore()
const viewport = useViewportStore()
const permissions = usePermissionsStore()

const componentMap = { card: Card, text: Text, image: ImageEl, link: Link, button: Link }

function getComponent(type) {
  return componentMap[type] || Text
}

onMounted(async () => {
  const projectId = route.params.projectId
  await permissions.loadPermissions(projectId)
  await elements.loadElements(projectId)
  elements.subscribeToRealtime(projectId)

  if (elements.cards.length > 0) {
    const first = elements.cards[0]
    viewport.centerOn(first.position_x + first.width / 2, first.position_y + first.height / 2, 0.8)
  }
})

onUnmounted(() => {
  elements.unsubscribe()
  viewport.reset()
})
</script>

<style scoped>
.canvas-view {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.element-connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}
</style>
