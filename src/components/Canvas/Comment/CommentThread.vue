<template>
  <aside class="comment-thread" v-if="thread">
    <div class="thread-header">
      <div class="thread-title">
        <span class="thread-on">on {{ targetLabel }}</span>
        <span v-if="thread.resolved" class="resolved-badge">Resolved</span>
        <span v-if="thread.deleted" class="deleted-badge">Deleted</span>
      </div>
      <div class="thread-actions">
        <!-- Resolve button: any commenter can resolve -->
        <button v-if="permissions.canComment && !thread.resolved && !thread.deleted" class="resolve-btn" @click="resolve" title="Mark as resolved">
          <span class="resolve-icon">&#10003;</span> Resolve
        </button>
        <!-- Delete button: only project owner (canDelete) can permanently delete -->
        <button v-if="permissions.canDelete && !thread.deleted" class="delete-thread-btn" @click="deleteThread" title="Permanently delete thread">
          <span>&#128465;</span>
        </button>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
    </div>

    <!-- Comments list -->
    <div class="thread-messages" ref="messagesRef">
      <!-- Root comment -->
      <div class="message root-message" :class="{ resolved: thread.resolved, deleted: thread.deleted }">
        <div class="message-header">
          <div class="message-avatar">
            <img v-if="thread.user?.raw_user_meta_data?.avatar_url" :src="thread.user.raw_user_meta_data.avatar_url" />
            <span v-else>{{ getInitial(thread.user) }}</span>
          </div>
          <div class="message-meta">
            <strong>{{ getName(thread.user) }}</strong>
            <span class="message-time">{{ formatTime(thread.created_at) }}</span>
          </div>
          <button v-if="!thread.deleted && permissions.canComment" class="reply-msg-btn" @click="setReplyTarget(thread)" title="Reply to this">&#8617;</button>
          <button v-if="permissions.canDelete && !thread.deleted" class="delete-msg-btn" @click="deleteComment(thread.id)" title="Delete">&times;</button>
        </div>
        <p class="message-content" :class="{ 'deleted-text': thread.deleted }">
          {{ thread.deleted ? '[deleted]' : thread.content }}
        </p>
        <div v-if="!thread.deleted && thread.attachment_url" class="message-attachment">
          <img v-if="thread.attachment_type === 'image'" :src="thread.attachment_url" class="attachment-image" />
          <a v-else :href="thread.attachment_url" target="_blank" rel="noopener" class="attachment-link">
            {{ thread.attachment_type === 'document' ? 'View Document' : thread.attachment_url }}
          </a>
        </div>
      </div>

      <!-- Replies -->
      <div v-for="reply in thread.replies" :key="reply.id" class="message reply-message" :class="{ resolved: thread.resolved, deleted: reply.deleted }">
        <!-- Reply-to indicator -->
        <div v-if="reply.reply_to_id" class="reply-to-preview">
          <span class="reply-to-label">&#8617; replying to</span>
          <span class="reply-to-text">{{ getReplyToText(reply.reply_to_id) }}</span>
        </div>
        <div class="message-header">
          <div class="message-avatar small">
            <img v-if="reply.user?.raw_user_meta_data?.avatar_url" :src="reply.user.raw_user_meta_data.avatar_url" />
            <span v-else>{{ getInitial(reply.user) }}</span>
          </div>
          <div class="message-meta">
            <strong>{{ getName(reply.user) }}</strong>
            <span class="message-time">{{ formatTime(reply.created_at) }}</span>
          </div>
          <button v-if="!reply.deleted && permissions.canComment" class="reply-msg-btn" @click="setReplyTarget(reply)" title="Reply to this">&#8617;</button>
          <button v-if="permissions.canDelete && !reply.deleted" class="delete-msg-btn" @click="deleteComment(reply.id)" title="Delete">&times;</button>
        </div>
        <p class="message-content" :class="{ 'deleted-text': reply.deleted }">
          {{ reply.deleted ? '[deleted]' : reply.content }}
        </p>
        <div v-if="!reply.deleted && reply.attachment_url" class="message-attachment">
          <img v-if="reply.attachment_type === 'image'" :src="reply.attachment_url" class="attachment-image" />
          <a v-else :href="reply.attachment_url" target="_blank" rel="noopener" class="attachment-link">{{ reply.attachment_url }}</a>
        </div>
      </div>
    </div>

    <!-- Reply input (only for commenters+) -->
    <div v-if="permissions.canComment && !thread.deleted" class="reply-box">
      <!-- Reply-to indicator -->
      <div v-if="replyTarget" class="replying-to-bar">
        <span>&#8617; Replying to <strong>{{ getName(replyTarget.user) }}</strong>: "{{ truncate(replyTarget.content, 40) }}"</span>
        <button @click="replyTarget = null">&times;</button>
      </div>
      <div class="reply-attachments" v-if="attachment">
        <div class="attachment-preview">
          <span>{{ attachment.name }}</span>
          <button @click="attachment = null">&times;</button>
        </div>
      </div>
      <div class="reply-input-row">
        <button class="attach-btn" @click="triggerFileInput" title="Attach">+</button>
        <input type="file" ref="fileInputRef" @change="handleAttach" accept="image/*,.pdf,.doc,.docx" class="hidden-input" />
        <textarea
          v-model="replyText"
          @keydown.enter.exact.prevent="sendReply"
          :placeholder="replyTarget ? `Reply to ${getName(replyTarget.user)}...` : 'Reply to thread...'"
          rows="1"
        />
        <button class="send-btn" :disabled="!replyText.trim() && !attachment" @click="sendReply">
          &rarr;
        </button>
      </div>
    </div>

    <!-- Resolved state notice for viewers -->
    <div v-if="thread.resolved && !permissions.canComment" class="resolved-notice">
      This thread has been resolved.
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCommentsStore } from '../../../stores/comments'
import { useAuthStore } from '../../../stores/auth'
import { usePermissionsStore } from '../../../stores/permissions'
import { useElementsStore } from '../../../stores/elements'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'

const props = defineProps({
  thread: { type: Object, default: null }
})

const emit = defineEmits(['close'])

const route = useRoute()
const comments = useCommentsStore()
const auth = useAuthStore()
const permissions = usePermissionsStore()
const elements = useElementsStore()

const replyText = ref('')
const replyTarget = ref(null) // specific message being replied to
const attachment = ref(null)
const messagesRef = ref(null)
const fileInputRef = ref(null)

const targetLabel = computed(() => {
  if (!props.thread?.element_id) return 'Canvas'
  const el = elements.elements.find(e => e.id === props.thread.element_id)
  if (!el) return 'Element'
  if (el.type === 'card') {
    const title = el.content?.title
    if (typeof title === 'object') return title.pt || title.en || 'Card'
    return title || 'Card'
  }
  return el.type.charAt(0).toUpperCase() + el.type.slice(1)
})

function getInitial(user) {
  const name = user?.raw_user_meta_data?.full_name || user?.email || '?'
  return name.charAt(0).toUpperCase()
}

function getName(user) {
  const meta = user?.raw_user_meta_data
  return meta?.full_name || meta?.name || user?.email?.split('@')[0] || 'Anonymous'
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diff = Date.now() - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString()
}

function truncate(text, len) {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '…' : text
}

function getReplyToText(replyToId) {
  const all = [props.thread, ...(props.thread?.replies || [])]
  const msg = all.find(m => m.id === replyToId)
  return msg ? truncate(msg.content, 40) : '...'
}

function setReplyTarget(msg) {
  replyTarget.value = msg
  nextTick(() => {
    const ta = messagesRef.value?.closest('.comment-thread')?.querySelector('textarea')
    ta?.focus()
  })
}

async function sendReply() {
  if (!replyText.value.trim() && !attachment.value) return
  const projectId = route.params.projectId

  let attachData = null
  if (attachment.value) {
    attachData = { type: attachment.value.type, url: attachment.value.url }
  }

  const parentId = props.thread.id
  const replyToId = replyTarget.value?.id || null

  const newReply = await comments.addComment(
    projectId,
    replyText.value.trim(),
    props.thread.element_id,
    parentId,
    attachData,
    replyToId
  )

  replyText.value = ''
  attachment.value = null
  replyTarget.value = null

  nextTick(() => {
    if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  })
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleAttach(e) {
  const file = e.target.files?.[0]
  if (!file || !isSupabaseConfigured) return

  const projectId = route.params.projectId
  const ext = file.name.split('.').pop()
  const path = `comments/${projectId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('uploads').upload(path, file, { contentType: file.type })
  if (error) { console.error('[Upload] Failed:', error.message); return }

  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
  if (urlData?.publicUrl) {
    attachment.value = {
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      url: urlData.publicUrl
    }
  }
}

async function resolve() {
  if (props.thread?.id) await comments.resolveComment(props.thread.id)
}

async function deleteComment(id) {
  await comments.deleteComment(id)
  if (id === props.thread?.id) emit('close')
}

async function deleteThread() {
  if (props.thread?.id) {
    await comments.deleteComment(props.thread.id)
    emit('close')
  }
}

watch(() => props.thread, () => {
  nextTick(() => {
    if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  })
}, { deep: true })
</script>

<style scoped>
.comment-thread {
  position: fixed;
  right: 0;
  top: 60px;
  bottom: 0;
  width: 360px;
  background: rgba(20, 20, 18, 0.98);
  border-left: 1px solid var(--moss);
  z-index: 950;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.thread-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--moss);
}

.thread-title { display: flex; align-items: center; gap: 0.5rem; }

.thread-on {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  color: var(--moss-light);
  text-transform: uppercase;
}

.resolved-badge {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: var(--moss);
  background: rgba(106, 125, 91, 0.2);
  padding: 0.15rem 0.5rem;
  border-radius: 2px;
  text-transform: uppercase;
}

.deleted-badge {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: rgba(255,80,80,0.7);
  background: rgba(255,80,80,0.1);
  padding: 0.15rem 0.5rem;
  border-radius: 2px;
  text-transform: uppercase;
}

.thread-actions { display: flex; gap: 0.5rem; align-items: center; }

.resolve-btn {
  background: rgba(106, 125, 91, 0.2);
  border: 1px solid var(--moss);
  color: var(--moss-light);
  padding: 0.25rem 0.75rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.15s;
}
.resolve-btn:hover { background: var(--moss); color: var(--paper); }

.delete-thread-btn {
  background: transparent;
  border: 1px solid rgba(255,80,80,0.3);
  color: rgba(255,80,80,0.6);
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}
.delete-thread-btn:hover { background: rgba(255,80,80,0.15); color: #ff5050; }

.close-btn {
  background: transparent;
  border: none;
  color: var(--moss-light);
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0;
}
.close-btn:hover { color: var(--paper); }

.thread-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message { display: flex; flex-direction: column; gap: 0.4rem; }

.message.resolved { opacity: 0.5; }
.message.deleted { opacity: 0.4; }

.reply-message {
  padding-left: 1rem;
  border-left: 2px solid rgba(106, 125, 91, 0.3);
}

.reply-to-preview {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.5rem;
  background: rgba(106, 125, 91, 0.08);
  border-left: 2px solid var(--moss);
  margin-bottom: 0.25rem;
}

.reply-to-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: var(--moss-light);
}

.reply-to-text {
  font-size: 0.75rem;
  color: var(--paper);
  opacity: 0.7;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-header { display: flex; align-items: center; gap: 0.5rem; }

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--terracotta);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--paper);
  overflow: hidden;
  flex-shrink: 0;
}
.message-avatar.small { width: 22px; height: 22px; font-size: 0.55rem; }
.message-avatar img { width: 100%; height: 100%; object-fit: cover; }

.message-meta { display: flex; align-items: baseline; gap: 0.5rem; flex: 1; min-width: 0; }
.message-meta strong { font-family: 'Space Mono', monospace; font-size: 0.75rem; color: var(--paper); }
.message-time { font-family: 'Space Mono', monospace; font-size: 0.6rem; color: var(--moss-light); }

.reply-msg-btn {
  background: transparent;
  border: none;
  color: var(--moss-light);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0 0.2rem;
  opacity: 0;
  transition: opacity 0.15s;
}
.message:hover .reply-msg-btn { opacity: 1; }
.reply-msg-btn:hover { color: var(--terracotta); }

.delete-msg-btn {
  background: transparent;
  border: none;
  color: rgba(255, 50, 50, 0.5);
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.message:hover .delete-msg-btn { opacity: 1; }

.message-content {
  font-size: 0.85rem;
  color: var(--paper);
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}
.message-content.deleted-text { color: var(--moss-light); font-style: italic; }

.message-attachment { margin-top: 0.25rem; }
.attachment-image { max-width: 100%; max-height: 200px; object-fit: contain; border: 1px solid var(--moss); border-radius: 4px; }
.attachment-link { font-family: 'Space Mono', monospace; font-size: 0.7rem; color: var(--stencil-orange); text-decoration: underline; }

.reply-box { border-top: 1px solid var(--moss); padding: 0.75rem; }

.replying-to-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(106, 125, 91, 0.1);
  border-left: 2px solid var(--terracotta);
  padding: 0.3rem 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: var(--paper);
}
.replying-to-bar button {
  background: transparent;
  border: none;
  color: var(--moss-light);
  cursor: pointer;
  font-size: 1rem;
}

.reply-attachments { margin-bottom: 0.5rem; }
.attachment-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(106, 125, 91, 0.1);
  padding: 0.3rem 0.5rem;
  font-size: 0.7rem;
  color: var(--moss-light);
  border: 1px solid var(--moss);
}
.attachment-preview button { background: transparent; border: none; color: var(--moss-light); cursor: pointer; font-size: 1rem; }

.reply-input-row { display: flex; gap: 0.4rem; align-items: flex-end; }

.attach-btn {
  background: transparent;
  border: 1px solid var(--moss);
  color: var(--moss-light);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  flex-shrink: 0;
  transition: all 0.15s;
}
.attach-btn:hover { border-color: var(--terracotta); color: var(--terracotta); }

.hidden-input { position: absolute; opacity: 0; width: 0; height: 0; }

.reply-input-row textarea {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--moss);
  color: var(--paper);
  padding: 0.4rem 0.6rem;
  font-family: inherit;
  font-size: 0.85rem;
  resize: none;
  min-height: 32px;
  max-height: 120px;
  line-height: 1.4;
}
.reply-input-row textarea:focus { outline: none; border-color: var(--terracotta); }

.send-btn {
  background: var(--terracotta);
  border: none;
  color: var(--paper);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  flex-shrink: 0;
  transition: all 0.15s;
}
.send-btn:hover:not(:disabled) { background: var(--stencil-orange); }
.send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.resolve-icon {
  margin-right: 4px;
}

.resolved-notice {
  padding: 1rem;
  text-align: center;
  background: rgba(106, 125, 91, 0.1);
  color: var(--moss-light);
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  border-top: 1px solid var(--moss);
}
</style>
