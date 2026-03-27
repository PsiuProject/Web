<template>
  <!-- Bubble anchored to element right edge, in canvas coordinate space -->
  <div
    class="comment-bubble"
    :class="{
      'has-comments': hasComments,
      'resolved': allResolved,
      'can-add': canAdd && !hasComments,
      'viewer-only': viewerOnly && !hasComments
    }"
    :style="bubbleStyle"
    @click.stop="onClick"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <!-- If element has comments: show first commenter avatar -->
    <template v-if="hasComments">
      <img v-if="firstAvatarUrl" :src="firstAvatarUrl" class="bubble-avatar" />
      <span v-else class="bubble-initial">{{ firstInitial }}</span>
      <span v-if="totalCount > 1" class="bubble-count">{{ totalCount }}</span>
    </template>
    <!-- If commenter role and no comments yet: show animated + -->
    <template v-else-if="canAdd">
      <span class="bubble-plus">+</span>
    </template>

    <!-- Animated pulse ring for add state -->
    <span v-if="canAdd && !hasComments" class="bubble-ring" />
    <span v-if="canAdd && !hasComments" class="bubble-ring bubble-ring-delayed" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePermissionsStore } from '../../../stores/permissions'
import { useCommentsStore } from '../../../stores/comments'
import { useViewportStore } from '../../../stores/viewport'

const props = defineProps({
  element: { type: Object, required: true }
})

const emit = defineEmits(['click'])

const permissions = usePermissionsStore()
const comments = useCommentsStore()
const viewport = useViewportStore()
const hovered = ref(false)

const threads = computed(() => comments.activeThreadsByElement[props.element.id] || [])
const hasComments = computed(() => threads.value.length > 0)
const allResolved = computed(() => hasComments.value && threads.value.every(t => t.resolved))
const totalCount = computed(() => threads.value.length)
const canAdd = computed(() => permissions.canComment)
const viewerOnly = computed(() => permissions.isViewerOnly)

const firstThread = computed(() => threads.value[0])
const firstAvatarUrl = computed(() => firstThread.value?.user?.raw_user_meta_data?.avatar_url)
const firstInitial = computed(() => {
  const meta = firstThread.value?.user?.raw_user_meta_data
  const name = meta?.full_name || meta?.name || firstThread.value?.user?.email || '?'
  return name.charAt(0).toUpperCase()
})

// Position bubble at right edge of element, vertically centered
// This recalculates when element position changes
const bubbleStyle = computed(() => {
  const el = props.element
  const x = el.position_x + el.width + 8
  const y = el.position_y + el.height / 2 - 16
  return {
    left: `${x}px`,
    top: `${y}px`,
    // Only show if: commenter (always) or viewer with existing comments
    display: (canAdd.value || hasComments.value) ? 'flex' : 'none'
  }
})

function onClick() {
  emit('click', props.element, threads.value)
}
</script>

<style scoped>
.comment-bubble {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--terracotta);
  border: 2px solid var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 200;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
  overflow: visible;
}

.comment-bubble:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 16px rgba(181,93,58,0.5);
}

.comment-bubble.has-comments {
  background: var(--terracotta);
}

.comment-bubble.resolved {
  background: var(--moss);
  opacity: 0.6;
}

.comment-bubble.viewer-only {
  display: none !important;
}

.comment-bubble.can-add {
  background: linear-gradient(135deg, var(--terracotta) 0%, var(--stencil-orange) 100%);
  animation: bubbleIdle 3s ease-in-out infinite;
}

@keyframes bubbleIdle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.comment-bubble.can-add:hover {
  animation: none;
  transform: scale(1.2);
}

.bubble-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.bubble-initial {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--paper);
}

.bubble-plus {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--paper);
  line-height: 1;
}

.bubble-count {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--stencil-orange);
  color: var(--ink);
  font-family: 'Space Mono', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid var(--ink);
}

/* Animated pulse rings for "add comment" state */
.bubble-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--terracotta);
  animation: bubblePulse 2s ease-out infinite;
  pointer-events: none;
}

.bubble-ring-delayed {
  animation-delay: 1s;
}

@keyframes bubblePulse {
  0% { opacity: 0.7; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.8); }
}
</style>
