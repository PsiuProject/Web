<template>
  <div class="comment-marker" :class="{ active: isActive, resolved: comment.resolved }" :style="markerStyle" @click.stop="$emit('click', comment)">
    <div class="marker-avatar">
      <img v-if="avatarUrl" :src="avatarUrl" :alt="userName" />
      <span v-else>{{ userInitial }}</span>
    </div>
    <div v-if="comment.replies?.length" class="reply-count">{{ comment.replies.length }}</div>
    <div v-if="isActive" class="marker-tooltip">
      <strong>{{ userName }}</strong>
      <p>{{ comment.content }}</p>
      <span class="marker-time">{{ timeAgo(comment.created_at) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  comment: { type: Object, required: true },
  isActive: { type: Boolean, default: false }
})

defineEmits(['click'])

const avatarUrl = computed(() => props.comment.user?.raw_user_meta_data?.avatar_url)
const userName = computed(() => {
  const meta = props.comment.user?.raw_user_meta_data
  return meta?.full_name || meta?.name || props.comment.user?.email?.split('@')[0] || '?'
})
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

const markerStyle = computed(() => ({
  left: `${props.comment.position_x}px`,
  top: `${props.comment.position_y}px`
}))

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}
</script>

<style scoped>
.comment-marker {
  position: absolute;
  z-index: 100;
  cursor: pointer;
  transition: transform 0.15s;
}

.comment-marker:hover {
  transform: scale(1.15);
  z-index: 200;
}

.comment-marker.active {
  z-index: 300;
}

.marker-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50% 50% 50% 0;
  background: var(--terracotta);
  border: 2px solid var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--paper);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.comment-marker.resolved .marker-avatar {
  background: var(--moss);
  opacity: 0.6;
}

.marker-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reply-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--stencil-orange);
  color: var(--ink);
  font-family: 'Space Mono', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: rgba(20, 20, 18, 0.98);
  border: 1px solid var(--moss);
  padding: 0.75rem;
  min-width: 200px;
  max-width: 300px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.15s ease;
}

.marker-tooltip strong {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  color: var(--paper);
  display: block;
  margin-bottom: 0.25rem;
}

.marker-tooltip p {
  font-size: 0.8rem;
  color: var(--paper);
  opacity: 0.85;
  margin: 0;
  line-height: 1.4;
}

.marker-time {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: var(--moss-light);
  display: block;
  margin-top: 0.4rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
