<template>
  <Teleport to="body">
    <Transition name="picker-fade">
      <div
        v-if="isVisible"
        class="connection-type-picker"
        :style="pickerStyle"
        @click.stop
        @keydown.escape="close"
      >
        <div class="picker-header">
          <span class="picker-title">{{ t('connections.selectType') }}</span>
          <button class="picker-close" @click="close">&times;</button>
        </div>

        <div class="picker-types">
          <button
            v-for="type in connectionTypes"
            :key="type.key"
            class="type-btn"
            :class="{ active: selectedType === type.key }"
            @click="selectType(type.key, type.color)"
          >
            <span class="type-color-dot" :style="{ backgroundColor: type.color }"></span>
            <span class="type-label">{{ t(type.label) }}</span>
          </button>
        </div>

        <div class="picker-divider"></div>

        <div class="picker-custom">
          <label class="custom-label">{{ t('connections.customColor') }}</label>
          <div class="color-input-wrapper">
            <input
              ref="colorInput"
              type="color"
              :value="customColor"
              @input="onCustomColorChange"
              class="color-picker"
            />
            <span class="color-value">{{ customColor }}</span>
          </div>
        </div>

        <div class="picker-actions">
          <button class="btn-cancel" @click="close">{{ t('common.cancel') }}</button>
          <button class="btn-apply" @click="apply">{{ t('common.apply') }}</button>
        </div>
      </div>
    </Transition>

    <!-- Backdrop -->
    <Transition name="backdrop-fade">
      <div v-if="isVisible && closeOnOutsideClick" class="picker-backdrop" @click="close"></div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  initialType: {
    type: String,
    default: 'subProject'
  },
  initialColor: {
    type: String,
    default: '#b55d3a'
  },
  closeOnOutsideClick: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['apply', 'close'])

const selectedType = ref(props.initialType)
const customColor = ref(props.initialColor)
const colorInput = ref(null)

const connectionTypes = [
  { key: 'subProject', label: 'connections.subProject', color: '#3b82f6' },
  { key: 'related', label: 'connections.related', color: '#8b5cf6' },
  { key: 'partner', label: 'connections.partner', color: '#ec4899' },
  { key: 'supplier', label: 'connections.supplier', color: '#f59e0b' },
  { key: 'service', label: 'connections.service', color: '#10b981' },
  { key: 'research', label: 'connections.research', color: '#6366f1' },
  { key: 'tool', label: 'connections.tool', color: '#14b8a6' },
  { key: 'mapping', label: 'connections.mapping', color: '#f97316' },
  { key: 'focusArea', label: 'connections.focusArea', color: '#ef4444' }
]

const pickerStyle = computed(() => {
  const padding = 10
  let left = props.position.x + padding
  let top = props.position.y + padding

  // Ensure picker stays within viewport
  const pickerWidth = 280
  const pickerHeight = 400

  if (left + pickerWidth > window.innerWidth) {
    left = window.innerWidth - pickerWidth - padding
  }
  if (top + pickerHeight > window.innerHeight) {
    top = window.innerHeight - pickerHeight - padding
  }

  return {
    left: `${Math.max(padding, left)}px`,
    top: `${Math.max(padding, top)}px`
  }
})

watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      selectedType.value = props.initialType
      customColor.value = props.initialColor
    }
  }
)

function onCustomColorChange(e) {
  customColor.value = e.target.value
  selectedType.value = 'custom'
}

function selectType(key, color) {
  selectedType.value = key
  customColor.value = color
}

function apply() {
  const color =
    selectedType.value === 'custom'
      ? customColor.value
      : connectionTypes.find((t) => t.key === selectedType.value)?.color || customColor.value

  emit('apply', {
    type: selectedType.value,
    color: color
  })
  close()
}

function close() {
  emit('close')
}
</script>

<style scoped>
.connection-type-picker {
  position: fixed;
  z-index: 10000;
  background: rgba(13, 13, 13, 0.98);
  border: 1px solid var(--moss);
  border-radius: clamp(4px, 0.7vw, 6px);
  padding: clamp(0.6rem, 1vh, 0.9rem);
  width: clamp(200px, 28vw, 260px);
  max-width: 95vw;
  box-shadow:
    0 clamp(6px, 1vh, 8px) clamp(24px, 4vh, 32px) rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(62, 76, 51, 0.2);
  backdrop-filter: blur(clamp(12px, 2vh, 16px));
  max-height: min(clamp(350px, 50vh, 400px), 80vh);
  overflow-y: hidden;
  overflow-x: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(0.4rem, 0.8vh, 0.6rem);
  padding-bottom: clamp(0.4rem, 0.6vh, 0.5rem);
  border-bottom: 1px solid rgba(62, 76, 51, 0.4);
  min-width: 0;
  gap: clamp(6px, 0.8vw, 8px);
}

.picker-title {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.5rem, 0.7vw, 0.65rem);
  color: var(--paper);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.picker-close {
  background: transparent;
  border: none;
  color: var(--moss-light);
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  cursor: pointer;
  padding: 0;
  width: clamp(1.2rem, 1.8vw, 1.4rem);
  height: clamp(1.2rem, 1.8vw, 1.4rem);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  flex-shrink: 0;
}
.picker-close:hover {
  color: var(--paper);
}

.picker-types {
  display: flex;
  flex-direction: column;
  gap: clamp(0.25rem, 0.4vh, 0.35rem);
  max-height: clamp(180px, 30vh, 260px);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--moss) rgba(13, 13, 13, 0.5);
  flex: 1;
  min-height: 0;
}

.picker-types::-webkit-scrollbar {
  width: clamp(3px, 0.5vw, 4px);
}

.picker-types::-webkit-scrollbar-track {
  background: rgba(13, 13, 13, 0.5);
  border-radius: clamp(2px, 0.3vw, 3px);
}

.picker-types::-webkit-scrollbar-thumb {
  background: var(--moss);
  border-radius: clamp(2px, 0.3vw, 3px);
}

.picker-types::-webkit-scrollbar-thumb:hover {
  background: var(--moss-light);
}

.type-btn {
  display: flex;
  align-items: center;
  gap: clamp(0.3rem, 0.5vw, 0.45rem);
  background: rgba(13, 13, 13, 0.6);
  border: 1px solid rgba(62, 76, 51, 0.3);
  border-radius: clamp(3px, 0.5vw, 4px);
  padding: clamp(0.35rem, 0.5vh, 0.45rem) clamp(0.4rem, 0.7vw, 0.55rem);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  min-width: 0;
  width: 100%;
}

.type-btn:hover {
  background: rgba(13, 13, 13, 0.8);
  border-color: var(--moss-light);
  transform: translateX(clamp(1px, 0.2vw, 2px));
}

.type-btn.active {
  background: rgba(181, 93, 58, 0.2);
  border-color: var(--terracotta);
  box-shadow: 0 0 0 1px rgba(181, 93, 58, 0.3);
}

.type-color-dot {
  width: clamp(8px, 1.2vw, 11px);
  height: clamp(8px, 1.2vw, 11px);
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow:
    0 0 clamp(4px, 0.7vw, 6px) currentColor,
    0 0 clamp(1px, 0.2vw, 2px) rgba(0, 0, 0, 0.5);
}

.type-label {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.5rem, 0.75vw, 0.6rem);
  color: var(--paper);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.picker-divider {
  height: clamp(1px, 0.2vh, 2px);
  background: linear-gradient(90deg, transparent, var(--moss), transparent);
  opacity: 0.4;
  margin: clamp(0.4rem, 0.7vh, 0.6rem) 0;
}

.picker-custom {
  margin-bottom: clamp(0.4rem, 0.7vh, 0.6rem);
  flex-shrink: 0;
}

.custom-label {
  display: block;
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.45rem, 0.65vw, 0.55rem);
  color: var(--moss-light);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: clamp(0.3rem, 0.5vh, 0.4rem);
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: clamp(0.3rem, 0.5vw, 0.4rem);
  background: rgba(13, 13, 13, 0.7);
  border: 1px solid rgba(62, 76, 51, 0.4);
  border-radius: clamp(3px, 0.5vw, 4px);
  padding: clamp(0.25rem, 0.4vh, 0.35rem);
}

.color-picker {
  width: clamp(24px, 3.5vw, 28px);
  height: clamp(24px, 3.5vw, 28px);
  border: none;
  border-radius: clamp(3px, 0.5vw, 4px);
  cursor: pointer;
  background: transparent;
  flex-shrink: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: clamp(2px, 0.3vw, 3px);
}

.color-picker::-moz-color-swatch {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: clamp(2px, 0.3vw, 3px);
}

.color-value {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.5rem, 0.75vw, 0.6rem);
  color: var(--paper);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.picker-actions {
  display: flex;
  gap: clamp(0.3rem, 0.5vw, 0.4rem);
  margin-top: auto;
  padding-top: clamp(0.4rem, 0.7vh, 0.6rem);
  flex-shrink: 0;
}

.btn-cancel,
.btn-apply {
  flex: 1;
  padding: clamp(0.35rem, 0.6vh, 0.45rem) clamp(0.4rem, 0.8vw, 0.6rem);
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.5rem, 0.75vw, 0.65rem);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--moss);
  color: var(--moss-light);
}
.btn-cancel:hover {
  background: rgba(106, 125, 91, 0.15);
  color: var(--paper);
}

.btn-apply {
  background: var(--terracotta);
  border: 1px solid var(--terracotta);
  color: var(--paper);
}
.btn-apply:hover {
  background: #a54f2e;
}

.picker-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.3);
}

/* Transitions */
.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: all 0.2s ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.2s ease;
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}
</style>
