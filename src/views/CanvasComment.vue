<template>
  <div class="canvas-comment">
    <AppHeader mode="comment" />

    <CanvasBase :interactive="true" @canvas-click="onCanvasClick">
      <component
        v-for="element in elements.elements"
        :key="element.id"
        :is="getComponent(element.type)"
        :element="element"
        :isSelected="elements.selectedId === element.id"
        @click="onElementClick(element)"
      />

      <!-- Comment Markers -->
      <CommentMarker
        v-for="thread in visibleThreads"
        :key="thread.id"
        :comment="thread"
        :isActive="activeThread?.id === thread.id"
        @click="openThread(thread)"
      />

      <!-- Connection lines -->
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

    <!-- New comment button (appears when element selected) -->
    <button
      v-if="elements.selectedId && !activeThread && permissions.canComment"
      class="new-comment-btn"
      @click="startNewComment"
    >
      + New Comment
    </button>

    <!-- Comment Thread sidebar -->
    <CommentThread
      v-if="activeThread"
      :thread="activeThread"
      @close="activeThread = null"
    />

    <!-- New comment input (modal) -->
    <div v-if="showNewComment" class="new-comment-overlay" @click.self="showNewComment = false">
      <div class="new-comment-form">
        <h3>New Comment</h3>
        <p class="comment-target">on {{ targetLabel }}</p>
        <textarea
          v-model="newCommentText"
          placeholder="Write a comment..."
          rows="3"
          ref="commentInputRef"
        />
        <div class="comment-form-actions">
          <button class="cancel-btn" @click="showNewComment = false">Cancel</button>
          <button class="submit-btn" :disabled="!newCommentText.trim()" @click="submitComment">
            Comment
          </button>
        </div>
      </div>
    </div>
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
import ConnectionLine from '../components/Canvas/Render/ConnectionLine.vue'
import CommentMarker from '../components/Canvas/Comment/CommentMarker.vue'
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

const componentMap = { card: Card, text: Text, image: ImageEl, link: Link, button: Link }

function getComponent(type) {
  return componentMap[type] || Text
}

const visibleThreads = computed(() => {
  return Object.values(comments.threadsByElement).flat()
})

const targetLabel = computed(() => {
  if (!elements.selectedId) return 'Canvas'
  const el = elements.selectedElement
  if (!el) return 'Element'
  if (el.type === 'card') {
    const title = el.content?.title
    if (typeof title === 'object') return title.pt || title.en || 'Card'
    return title || 'Card'
  }
  return el.type.charAt(0).toUpperCase() + el.type.slice(1)
})

function onCanvasClick() {
  elements.clearSelection()
  activeThread.value = null
}

function onElementClick(element) {
  elements.selectElement(element.id)

  // Show existing comments or nothing
  const threads = comments.threadsByElement[element.id]
  if (threads && threads.length > 0) {
    activeThread.value = threads[0]
  } else {
    activeThread.value = null
  }
}

function openThread(thread) {
  activeThread.value = thread
}

function startNewComment() {
  showNewComment.value = true
  newCommentText.value = ''
  nextTick(() => commentInputRef.value?.focus())
}

async function submitComment() {
  if (!newCommentText.value.trim()) return

  const projectId = route.params.projectId
  const elementId = elements.selectedId
  const el = elements.selectedElement

  // Position the comment near the element
  const posX = el ? el.position_x + el.width + 10 : 0
  const posY = el ? el.position_y : 0

  const comment = await comments.addComment(projectId, newCommentText.value.trim(), elementId)

  if (comment) {
    // Update position
    const { supabase, isSupabaseConfigured } = await import('../lib/supabase')
    if (isSupabaseConfigured) {
      await supabase.from('canvas_comments').update({ position_x: posX, position_y: posY }).eq('id', comment.id)
      comment.position_x = posX
      comment.position_y = posY
    }

    showNewComment.value = false
    newCommentText.value = ''

    // Open the thread for the new comment
    const threads = comments.threadsByElement[elementId]
    if (threads?.length > 0) {
      activeThread.value = threads[threads.length - 1]
    }
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

.element-connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.new-comment-btn {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--terracotta);
  border: none;
  color: var(--paper);
  padding: 0.75rem 2rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  z-index: 800;
  box-shadow: 0 4px 16px rgba(181, 93, 58, 0.4);
  transition: all 0.2s;
}

.new-comment-btn:hover {
  background: var(--stencil-orange);
  transform: translateX(-50%) translateY(-2px);
}

.new-comment-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 960;
}

.new-comment-form {
  background: rgba(20, 20, 18, 0.98);
  border: 1px solid var(--moss);
  padding: 1.5rem;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.new-comment-form h3 {
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
  color: var(--paper);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 0.25rem 0;
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
}

.new-comment-form textarea:focus {
  outline: none;
  border-color: var(--terracotta);
}

.comment-form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  justify-content: flex-end;
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
}

.submit-btn:hover:not(:disabled) {
  background: var(--stencil-orange);
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
