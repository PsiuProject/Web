<template>
  <div
    class="inline-edit"
    :class="{ editing: isEditing, 'read-only': !canEdit }"
    @mouseenter="showPencil = canEdit"
    @mouseleave="showPencil = false"
  >
    <!-- Display mode -->
    <component
      v-if="!isEditing"
      :is="tag"
      :class="displayClass"
      @click.stop="canEdit && startEdit()"
    >
      {{ modelValue || placeholder }}
      <button
        v-if="showPencil && canEdit"
        class="edit-pencil"
        @click.stop="startEdit()"
        :title="'Edit'"
      >&#9998;</button>
    </component>

    <!-- Edit mode -->
    <div v-else class="edit-container" @click.stop>
      <textarea
        v-if="multiline"
        ref="inputRef"
        :value="editValue"
        @input="editValue = $event.target.value"
        @blur="finishEdit"
        @keydown.escape="cancelEdit"
        @keydown.enter.ctrl="finishEdit"
        class="edit-input edit-textarea"
        :placeholder="placeholder"
        rows="3"
      />
      <input
        v-else
        ref="inputRef"
        :type="inputType"
        :value="editValue"
        @input="editValue = $event.target.value"
        @blur="finishEdit"
        @keydown.escape="cancelEdit"
        @keydown.enter="finishEdit"
        class="edit-input"
        :placeholder="placeholder"
      />
    </div>

    <!-- Being edited by another user indicator -->
    <div v-if="editedBy" class="edited-by-indicator">
      <span class="edited-by-dot"></span>
      {{ editedBy }}
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  tag: { type: String, default: 'span' },
  displayClass: { type: String, default: '' },
  placeholder: { type: String, default: 'Click to edit...' },
  multiline: { type: Boolean, default: false },
  inputType: { type: String, default: 'text' },
  canEdit: { type: Boolean, default: false },
  editedBy: { type: String, default: null }
})

const emit = defineEmits(['save', 'editing', 'cancel'])

const isEditing = ref(false)
const showPencil = ref(false)
const inputRef = ref(null)
const originalValue = ref('')
const editValue = ref('')

async function startEdit() {
  if (!props.canEdit) return
  originalValue.value = props.modelValue
  editValue.value = props.modelValue
  isEditing.value = true
  emit('editing', true)
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function finishEdit() {
  isEditing.value = false
  emit('editing', false)
  if (editValue.value !== originalValue.value) {
    emit('save', editValue.value)
  }
}

function cancelEdit() {
  editValue.value = originalValue.value
  isEditing.value = false
  emit('editing', false)
  emit('cancel')
}
</script>

<style scoped>
.inline-edit {
  position: relative;
  display: inline-block;
  width: 100%;
}

.inline-edit:not(.read-only):hover {
  cursor: text;
}

.edit-pencil {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 95, 31, 0.15);
  border: 1px solid rgba(255, 95, 31, 0.3);
  color: var(--stencil-orange);
  width: 22px;
  height: 22px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 6px;
  vertical-align: middle;
  transition: all 0.2s;
  opacity: 0;
  animation: pencilFadeIn 0.2s forwards;
}

@keyframes pencilFadeIn {
  to { opacity: 1; }
}

.edit-pencil:hover {
  background: rgba(255, 95, 31, 0.3);
  border-color: var(--stencil-orange);
  transform: scale(1.1);
}

.edit-container {
  width: 100%;
}

.edit-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--terracotta);
  color: var(--paper);
  padding: 6px 8px;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  outline: none;
  box-shadow: 0 0 0 2px rgba(181, 93, 58, 0.2);
}

.edit-textarea {
  resize: vertical;
  min-height: 60px;
}

.edited-by-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.65rem;
  color: var(--stencil-orange);
  margin-top: 2px;
  font-family: 'Space Mono', monospace;
}

.edited-by-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--stencil-orange);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
