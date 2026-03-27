<template>
  <div class="canvas-comment">
    <AppHeader mode="comment" />

    <CanvasBase :interactive="true" @canvas-click="onCanvasClick">
      <!-- Canvas elements -->
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

      <!-- Comment bubbles anchored to each element -->
      <!-- Show on hover for commenter, or if has comments for anyone -->
      <CommentBubble
        v-for="element in elements.elements"
        :key="'bubble-' + element.id"
        v-show="shouldShowBubble(element.id)"
        :element="element"
        @click="onBubbleClick"
      />
    </CanvasBase>

    <!-- Comment Thread sidebar -->
    <CommentThread v-if="activeThread" :thread="activeThread" @close="activeThread = null" />

    <!-- New comment input (inline popover near element) -->
    <Teleport to="body">
      <div v-if="showNewComment" class="new-comment-overlay" @click.self="showNewComment = false">
        <div class="new-comment-form" :style="newCommentFormStyle">
          <div class="comment-form-header">
            <h3>New Comment</h3>
            <button class="close-form-btn" @click="showNewComment = false">&times;</button>
          </div>
          <p class="comment-target">on {{ targetLabel }}</p>
          <textarea
            v-model="newCommentText"
            placeholder="Write a comment..."
            rows="3"
            ref="commentInputRef"
            @keydown.ctrl.enter="submitComment"
            @keydown.meta.enter="submitComment"
          />
          <div class="comment-form-actions">
            <span class="hint">Ctrl+Enter to submit</span>
            <div class="action-btns">
              <button class="cancel-btn" @click="showNewComment = false">Cancel</button>
              <button class="submit-btn" :disabled="!newCommentText.trim()" @click="submitComment">
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useElementsStore } from '../stores/elements'
import { useCommentsStore } from '../stores/comments'
import { useViewportStore } from '../stores/viewport'
import { usePermissionsStore } from '../stores/permissions'
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
const comments = useCommentsStore()
const viewport = useViewportStore()
const permissions = usePermissionsStore()

const activeThread = ref(null)
const showNewComment = ref(false)
const newCommentText = ref('')
const commentInputRef = ref(null)
const hoveredElementId = ref(null)
const pendingElementId = ref(null)

const componentMap = { card: Card, text: Text, image: ImageEl, link: Link, button: Link }
function getComponent(type) {
  return componentMap[type] || Text
}

function hasComments(elementId) {
  return (comments.activeThreadsByElement[elementId]?.length || 0) > 0
}

// Show bubble if: hovered + commenter role, OR element has comments
function shouldShowBubble(elementId) {
  const isHovered = hoveredElementId.value === elementId
  const elementHasComments = hasComments(elementId)
  // Always show if has comments
  if (elementHasComments) return true
  // Show + bubble on hover only if user can comment
  if (isHovered && permissions.canComment) return true
  return false
}

const targetLabel = computed(() => {
  if (!pendingElementId.value) return 'Canvas'
  const el = elements.elements.find((e) => e.id === pendingElementId.value)
  if (!el) return 'Element'
  if (el.type === 'card') {
    const title = el.content?.title
    if (typeof title === 'object') return title.pt || title.en || 'Card'
    return title || 'Card'
  }
  return el.type.charAt(0).toUpperCase() + el.type.slice(1)
})

// Position the new comment form near the element
const newCommentFormStyle = computed(() => {
  if (!pendingElementId.value)
    return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  const el = elements.elements.find((e) => e.id === pendingElementId.value)
  if (!el) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  // Convert canvas coords to screen coords
  const screenX =
    el.position_x * viewport.zoom + viewport.translateX + el.width * viewport.zoom + 50
  const screenY = el.position_y * viewport.zoom + viewport.translateY
  return {
    position: 'fixed',
    left: `${Math.min(screenX, window.innerWidth - 420)}px`,
    top: `${Math.max(70, Math.min(screenY, window.innerHeight - 300))}px`,
    transform: 'none'
  }
})

function onCanvasClick() {
  elements.clearSelection()
  activeThread.value = null
}

function onElementClick(element) {
  elements.selectElement(element.id)
  const threads = comments.threadsByElement[element.id]
  if (threads?.length > 0) {
    activeThread.value = threads[0]
  } else {
    activeThread.value = null
  }
}

function onBubbleClick(element, threads) {
  if (threads?.length > 0) {
    // Open existing thread
    activeThread.value = threads[0]
  } else if (permissions.canComment) {
    // Start new comment
    pendingElementId.value = element.id
    showNewComment.value = true
    newCommentText.value = ''
    nextTick(() => commentInputRef.value?.focus())
  }
}

async function submitComment() {
  if (!newCommentText.value.trim()) return
  const projectId = route.params.projectId
  const elementId = pendingElementId.value

  const comment = await comments.addComment(projectId, newCommentText.value.trim(), elementId)

  if (comment) {
    showNewComment.value = false
    newCommentText.value = ''
    const threads = comments.threadsByElement[elementId]
    if (threads?.length > 0) activeThread.value = threads[threads.length - 1]
  }
}

onMounted(async () => {
  const projectId = route.params.projectId
  await permissions.loadPermissions(projectId)
  await elements.loadElements(projectId)
  await comments.loadComments(projectId)
  elements.subscribeToRealtime(projectId)
  comments.subscribeToRealtime(projectId)

  if (elements.cards.length > 0) {
    const first = elements.cards[0]
    viewport.centerOn(first.position_x + first.width / 2, first.position_y + first.height / 2, 0.8)
  }
})

onUnmounted(() => {
  elements.unsubscribe()
  comments.unsubscribe()
  viewport.reset()
})
</script>

<style scoped>
.canvas-comment {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.new-comment-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 960;
  pointer-events: all;
  backdrop-filter: blur(2px);
}

.new-comment-form {
  background: rgba(20, 20, 18, 0.98);
  border: 1px solid var(--moss);
  padding: 1.25rem;
  width: 380px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border-radius: 4px;
}

.comment-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.new-comment-form h3 {
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
  color: var(--paper);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0;
}

.close-form-btn {
  background: transparent;
  border: none;
  color: var(--moss-light);
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.close-form-btn:hover {
  color: var(--paper);
}

.comment-target {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--moss-light);
  margin: 0 0 1rem 0;
}

.new-comment-form textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--moss);
  color: var(--paper);
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
  border-radius: 2px;
}
.new-comment-form textarea:focus {
  outline: none;
  border-color: var(--terracotta);
}

.comment-form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
}

.hint {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: var(--moss-light);
}

.action-btns {
  display: flex;
  gap: 0.5rem;
}

.cancel-btn {
  background: transparent;
  border: 1px solid var(--moss);
  color: var(--paper);
  padding: 0.4rem 1rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  cursor: pointer;
  text-transform: uppercase;
  border-radius: 2px;
  transition: all 0.15s;
}
.cancel-btn:hover {
  background: rgba(106, 125, 91, 0.1);
}

.submit-btn {
  background: var(--terracotta);
  border: none;
  color: var(--ink);
  padding: 0.4rem 1rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  border-radius: 2px;
  transition: all 0.15s;
}
.submit-btn:hover:not(:disabled) {
  background: var(--stencil-orange);
}
.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
