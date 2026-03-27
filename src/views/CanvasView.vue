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
        @click="onElementClick(element)"
        @mouseenter="hoveredElementId = element.id"
        @mouseleave="hoveredElementId = null"
      />

      <!-- Read-only comment bubbles for viewer: only show if element has comments -->
      <CommentBubble
        v-for="element in elementsWithComments"
        :key="'bubble-' + element.id"
        v-show="hoveredElementId === element.id || hasComments(element.id)"
        :element="element"
        @click="onBubbleClick"
      />
    </CanvasBase>

    <!-- Read-only thread viewer -->
    <CommentThread
      v-if="activeThread"
      :thread="activeThread"
      @close="activeThread = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useElementsStore } from '../stores/elements'
import { useViewportStore } from '../stores/viewport'
import { usePermissionsStore } from '../stores/permissions'
import { useCommentsStore } from '../stores/comments'
import AppHeader from '../components/Layout/AppHeader.vue'
import CanvasBase from '../components/Canvas/Render/CanvasBase.vue'
import CommentBubble from '../components/Canvas/Comment/CommentBubble.vue'
import CommentThread from '../components/Canvas/Comment/CommentThread.vue'
import Card from '../components/Canvas/Render/Card.vue'
import Text from '../components/Canvas/Render/Text.vue'
import ImageEl from '../components/Canvas/Render/Image.vue'
import Link from '../components/Canvas/Render/Link.vue'

const route = useRoute()
const elements = useElementsStore()
const viewport = useViewportStore()
const permissions = usePermissionsStore()
const comments = useCommentsStore()

const hoveredElementId = ref(null)
const activeThread = ref(null)

const componentMap = { card: Card, text: Text, image: ImageEl, link: Link, button: Link }
function getComponent(type) { return componentMap[type] || Text }

function hasComments(elementId) {
  return (comments.activeThreadsByElement[elementId]?.length || 0) > 0
}

// Only show bubbles for elements that have comments (for viewers)
const elementsWithComments = computed(() => {
  return elements.elements.filter(el => hasComments(el.id))
})

function onElementClick(element) {
  elements.selectElement(element.id)
  // If element has comments, show the thread
  const threads = comments.threadsByElement[element.id]
  if (threads?.length > 0) {
    activeThread.value = threads[0]
  } else {
    activeThread.value = null
  }
}

function onBubbleClick(element, threads) {
  if (threads?.length > 0) activeThread.value = threads[0]
}

onMounted(async () => {
  const projectId = route.params.projectId
  await permissions.loadPermissions(projectId)
  await elements.loadElements(projectId)
  await comments.loadComments(projectId)
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
</style>
