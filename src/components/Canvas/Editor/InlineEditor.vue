<template>
  <div
    v-if="isEditing"
    class="inline-editor-overlay"
    @click.self="save"
  >
    <div class="inline-editor" :style="editorStyle">
      <textarea
        ref="inputRef"
        v-model="editValue"
        @keydown.escape="cancel"
        @keydown.ctrl.enter="save"
        @keydown.meta.enter="save"
        :placeholder="placeholder"
        spellcheck="false"
      />
      <div class="editor-actions">
        <button class="save-btn" @click="save">Save</button>
        <button class="cancel-btn" @click="cancel">Cancel</button>
        <span class="hint">Ctrl+Enter to save</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useI18nStore } from '../../../stores/i18n-store'

const i18nStore = useI18nStore()

const props = defineProps({
  element: { type: Object, default: null },
  field: { type: String, default: 'text' },
  isEditing: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Type here...' }
})

const emit = defineEmits(['save', 'cancel'])

const inputRef = ref(null)
const editValue = ref('')

function getTextValue(content, field) {
  if (!content) return ''
  const val = content[field]
  if (!val) return ''
  if (typeof val === 'object') return val[i18nStore.currentLocale] ?? val.pt ?? val.en ?? ''
  return val
}

watch(() => props.isEditing, (val) => {
  if (val && props.element) {
    editValue.value = getTextValue(props.element.content, props.field)
    nextTick(() => {
      inputRef.value?.focus()
      inputRef.value?.select()
    })
  }
})

const editorStyle = computed(() => {
  if (!props.element) return {}
  return {
    minWidth: `${Math.max(200, props.element.width)}px`,
    minHeight: `${Math.max(60, props.element.height)}px`
  }
})

function save() {
  const currentContent = props.element?.content || {}
  const fieldVal = currentContent[props.field]
  let updated

  if (typeof fieldVal === 'object' && fieldVal !== null) {
    updated = { ...fieldVal, [locale.value]: editValue.value }
  } else {
    updated = { [locale.value]: editValue.value }
  }

  emit('save', { field: props.field, value: updated })
}

function cancel() {
  emit('cancel')
}
</script>

<style scoped>
.inline-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 950;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.inline-editor {
  background: rgba(20, 20, 18, 0.98);
  border: 2px solid var(--terracotta);
  padding: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 600px;
  width: 90vw;
}

.inline-editor textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--moss);
  color: var(--paper);
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 100px;
  width: 100%;
}

.inline-editor textarea:focus {
  outline: none;
  border-color: var(--terracotta);
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.save-btn {
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

.save-btn:hover {
  background: var(--stencil-orange);
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

.cancel-btn:hover {
  border-color: var(--moss-light);
}

.hint {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: var(--moss-light);
  margin-left: auto;
}
</style>
