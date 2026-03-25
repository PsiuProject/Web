<template>
  <a
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    class="link-chip"
    :class="'chip-' + chipType"
    @click.stop
  >
    <span class="chip-icon">{{ icon }}</span>
    <span class="chip-label">{{ displayLabel }}</span>
  </a>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  url: { type: String, required: true },
  type: { type: String, default: '' },
  label: { type: String, default: '' }
})

const chipType = computed(() => {
  if (props.type) return props.type
  const url = props.url.toLowerCase()
  if (url.includes('instagram')) return 'instagram'
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('github')) return 'github'
  if (url.includes('twitter') || url.includes('x.com')) return 'twitter'
  return 'website'
})

const icon = computed(() => {
  const icons = {
    instagram: '\u25CF',
    youtube: '\u25B6',
    github: '\u25CB',
    twitter: '\u2606',
    website: '\u2192'
  }
  return icons[chipType.value] || '\u2192'
})

const displayLabel = computed(() => {
  if (props.label) return props.label
  try {
    const hostname = new URL(props.url).hostname.replace('www.', '')
    return hostname.length > 20 ? hostname.substring(0, 20) + '...' : hostname
  } catch {
    return props.url.substring(0, 25)
  }
})
</script>

<style scoped>
.link-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  text-decoration: none;
  color: var(--paper);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.2s;
  cursor: pointer;
  white-space: nowrap;
}

.link-chip:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--terracotta);
  color: var(--stencil-orange);
}

.chip-icon {
  font-size: 0.6rem;
}

.chip-label {
  text-transform: lowercase;
}

.chip-instagram { border-color: rgba(225, 48, 108, 0.4); }
.chip-instagram:hover { border-color: #e1306c; color: #e1306c; }

.chip-youtube { border-color: rgba(255, 0, 0, 0.3); }
.chip-youtube:hover { border-color: #ff0000; color: #ff0000; }

.chip-github { border-color: rgba(255, 255, 255, 0.3); }
.chip-github:hover { border-color: #fff; }
</style>
