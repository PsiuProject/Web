<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      ref="menuRef"
      class="context-menu"
      :style="menuStyle"
      @click.stop
      @contextmenu.stop.prevent
    >
      <div class="context-menu-header" v-if="title">
        {{ title }}
      </div>
      <div class="context-menu-items">
        <template v-for="(item, idx) in items" :key="idx">
          <div v-if="item.separator" class="context-menu-separator"></div>
          <button
            v-else
            class="context-menu-item"
            :class="{ disabled: item.disabled, danger: item.danger }"
            @click="onItemClick(item)"
            :title="item.tooltip"
          >
            <span v-if="item.icon" class="context-menu-icon" v-html="item.icon"></span>
            <span class="context-menu-label">{{ item.label }}</span>
            <span v-if="item.shortcut" class="context-menu-shortcut">{{ item.shortcut }}</span>
          </button>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isVisible: { type: Boolean, default: false },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  title: { type: String, default: '' },
  items: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:isVisible', 'action'])

const menuRef = ref(null)

const menuStyle = computed(() => {
  const menuWidth = 220
  const menuHeight = props.items.length * 36 + (props.title ? 40 : 10)

  let x = props.x
  let y = props.y

  // Prevent menu from going off screen
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 10
  }
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 10
  }

  return {
    left: `${Math.max(10, x)}px`,
    top: `${Math.max(10, y)}px`
  }
})

function onItemClick(item) {
  if (item.disabled || item.separator) return
  emit('action', item.action)
  emit('update:isVisible', false)
}

function closeMenu(event) {
  // Don't close if clicking inside the menu
  if (event && menuRef.value && menuRef.value.contains(event.target)) {
    return
  }
  emit('update:isVisible', false)
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  // Use capture phase to intercept clicks before they reach document
  document.addEventListener('click', closeMenu, true)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', closeMenu, true)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: linear-gradient(180deg, rgba(20, 20, 18, 0.98) 0%, rgba(25, 25, 23, 0.98) 100%);
  border: 1px solid rgba(106, 125, 91, 0.4);
  border-radius: clamp(8px, 1.2vw, 10px);
  padding: clamp(4px, 0.6vh, 6px);
  min-width: clamp(180px, 22vw, 200px);
  box-shadow:
    0 clamp(12px, 2vh, 16px) clamp(32px, 6vh, 48px) rgba(0, 0, 0, 0.5),
    0 clamp(3px, 0.5vh, 4px) clamp(8px, 1.5vh, 12px) rgba(0, 0, 0, 0.3);
  z-index: 10000;
  backdrop-filter: blur(clamp(12px, 2vh, 16px));
  animation: contextMenuFadeIn 0.15s ease-out;
  user-select: none;
}

.context-menu-header {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.55rem, 0.7vw, 0.65rem);
  color: var(--moss-light);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: clamp(6px, 0.8vh, 8px) clamp(10px, 1.5vw, 12px);
  border-bottom: 1px solid rgba(106, 125, 91, 0.2);
  margin-bottom: clamp(2px, 0.3vw, 4px);
}

.context-menu-items {
  display: flex;
  flex-direction: column;
  gap: clamp(2px, 0.3vw, 3px);
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1vw, 10px);
  padding: clamp(8px, 1.2vh, 10px) clamp(10px, 1.5vw, 12px);
  background: transparent;
  border: 1px solid transparent;
  border-radius: clamp(4px, 0.6vw, 6px);
  color: var(--paper);
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.65rem, 0.8vw, 0.75rem);
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  width: 100%;
}

.context-menu-item:hover:not(.disabled):not(.separator) {
  background: linear-gradient(135deg, rgba(106, 125, 91, 0.2) 0%, rgba(106, 125, 91, 0.1) 100%);
  border-color: rgba(106, 125, 91, 0.4);
  transform: translateX(clamp(1px, 0.2vw, 2px));
}

.context-menu-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.context-menu-item.danger {
  color: #ff6b6b;
}

.context-menu-item.danger:hover {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(255, 107, 107, 0.1) 100%);
  border-color: rgba(255, 107, 107, 0.4);
}

.context-menu-separator {
  height: clamp(1px, 0.2vh, 2px);
  background: rgba(106, 125, 91, 0.3);
  margin: clamp(4px, 0.6vh, 6px) 0;
}

.context-menu-icon {
  font-size: clamp(0.9rem, 1.1vw, 1rem);
  width: clamp(18px, 2.2vw, 20px);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.context-menu-label {
  flex: 1;
}

.context-menu-shortcut {
  font-size: clamp(0.55rem, 0.7vw, 0.65rem);
  color: var(--moss-light);
  opacity: 0.6;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(clamp(-4px, -0.6vh, -5px));
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
