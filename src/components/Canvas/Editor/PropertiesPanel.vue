<template>
  <aside class="properties-panel" v-if="element">
    <div class="panel-header">
      <h3>{{ element.type.toUpperCase() }}</h3>
      <button class="close-btn" @click="elements.clearSelection()">&times;</button>
    </div>

    <div class="panel-body">
      <!-- Position -->
      <div class="prop-section">
        <span class="prop-label">POSITION</span>
        <div class="prop-row">
          <label>X</label>
          <input type="number" :value="Math.round(element.position_x)" @change="update('position_x', +$event.target.value)" />
          <label>Y</label>
          <input type="number" :value="Math.round(element.position_y)" @change="update('position_y', +$event.target.value)" />
        </div>
      </div>

      <!-- Size -->
      <div class="prop-section">
        <span class="prop-label">SIZE</span>
        <div class="prop-row">
          <label>W</label>
          <input type="number" :value="Math.round(element.width)" @change="update('width', +$event.target.value)" min="50" />
          <label>H</label>
          <input type="number" :value="Math.round(element.height)" @change="update('height', +$event.target.value)" min="30" />
        </div>
      </div>

      <!-- Rotation -->
      <div class="prop-section">
        <span class="prop-label">ROTATION</span>
        <div class="prop-row">
          <input type="range" min="-180" max="180" :value="element.rotation || 0" @input="update('rotation', +$event.target.value)" />
          <span class="range-val">{{ element.rotation || 0 }}&deg;</span>
        </div>
      </div>

      <!-- Z-Index -->
      <div class="prop-section">
        <span class="prop-label">LAYER</span>
        <div class="prop-row">
          <button class="small-btn" @click="update('z_index', (element.z_index || 0) - 1)">Back</button>
          <span class="range-val">{{ element.z_index || 0 }}</span>
          <button class="small-btn" @click="update('z_index', (element.z_index || 0) + 1)">Front</button>
        </div>
      </div>

      <!-- Card-specific props -->
      <template v-if="element.type === 'card'">
        <div class="prop-section">
          <span class="prop-label">CARD SETTINGS</span>
          <div class="prop-field">
            <label>Status</label>
            <select :value="element.content?.status || 'active'" @change="updateContent('status', $event.target.value)">
              <option value="active">Active</option>
              <option value="pipeline">Pipeline</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div class="prop-field">
            <label>Background</label>
            <input type="color" :value="element.style?.background || '#141412'" @change="updateStyle('background', $event.target.value)" />
          </div>
          <div class="prop-field">
            <label>Border Color</label>
            <input type="color" :value="element.style?.borderColor || '#3e4c33'" @change="updateStyle('borderColor', $event.target.value)" />
          </div>
        </div>
      </template>

      <!-- Text-specific props -->
      <template v-if="element.type === 'text'">
        <div class="prop-section">
          <span class="prop-label">TEXT SETTINGS</span>
          <div class="prop-field">
            <label>Font Size</label>
            <input type="number" :value="element.font_size || 14" @change="update('font_size', +$event.target.value)" min="8" max="120" />
          </div>
          <div class="prop-field">
            <label>Color</label>
            <input type="color" :value="element.text_color || '#e2ded0'" @change="update('text_color', $event.target.value)" />
          </div>
          <div class="prop-field">
            <label>
              <input type="checkbox" :checked="element.content?.boxed" @change="updateContent('boxed', $event.target.checked)" />
              Show Box
            </label>
          </div>
        </div>
      </template>

      <!-- Image-specific props -->
      <template v-if="element.type === 'image'">
        <div class="prop-section">
          <span class="prop-label">IMAGE</span>
          <div class="prop-field">
            <label>URL</label>
            <input type="text" :value="element.content?.url || ''" @change="updateContent('url', $event.target.value)" placeholder="https://..." />
          </div>
          <div class="prop-field">
            <label>Upload</label>
            <input type="file" accept="image/*" @change="handleImageUpload" />
          </div>
        </div>
      </template>

      <!-- Link/Button specific -->
      <template v-if="element.type === 'link' || element.type === 'button'">
        <div class="prop-section">
          <span class="prop-label">{{ element.type.toUpperCase() }}</span>
          <div class="prop-field">
            <label>URL</label>
            <input type="text" :value="element.content?.url || ''" @change="updateContent('url', $event.target.value)" placeholder="https://..." />
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useElementsStore } from '../../../stores/elements'
import { useHistoryStore } from '../../../stores/history'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import { useRoute } from 'vue-router'

const elements = useElementsStore()
const history = useHistoryStore()
const route = useRoute()

const element = computed(() => elements.selectedElement)

function update(key, value) {
  if (!element.value) return
  const prev = element.value[key]
  history.push({ action: 'update', elementId: element.value.id, state: { [key]: prev } })
  elements.updateElement(element.value.id, { [key]: value })
}

function updateContent(key, value) {
  if (!element.value) return
  const prevContent = { ...element.value.content }
  const newContent = { ...element.value.content, [key]: value }
  history.push({ action: 'update', elementId: element.value.id, state: { content: prevContent } })
  elements.updateElement(element.value.id, { content: newContent })
}

function updateStyle(key, value) {
  if (!element.value) return
  const prevStyle = { ...element.value.style }
  const newStyle = { ...(element.value.style || {}), [key]: value }
  history.push({ action: 'update', elementId: element.value.id, state: { style: prevStyle } })
  elements.updateElement(element.value.id, { style: newStyle })
}

async function handleImageUpload(e) {
  const file = e.target.files?.[0]
  if (!file || !isSupabaseConfigured) return

  const projectId = route.params.projectId
  const ext = file.name.split('.').pop()
  const path = `canvas/${projectId}/${element.value.id}.${ext}`

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) {
    console.error('[Upload] Failed:', error.message)
    return
  }

  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
  if (urlData?.publicUrl) {
    updateContent('url', urlData.publicUrl)
  }
}
</script>

<style scoped>
.properties-panel {
  position: fixed;
  right: 0;
  top: 60px;
  bottom: 0;
  width: 280px;
  background: rgba(20, 20, 18, 0.95);
  border-left: 1px solid var(--moss);
  backdrop-filter: blur(10px);
  z-index: 900;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--moss);
}

.panel-header h3 {
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  color: var(--stencil-orange);
  letter-spacing: 0.1em;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--moss-light);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
}

.close-btn:hover {
  color: var(--paper);
}

.panel-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.prop-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.prop-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: var(--moss);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.prop-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.prop-row label {
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  color: var(--moss-light);
  min-width: 1rem;
}

.prop-row input[type="number"] {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--paper);
  padding: 0.3rem 0.4rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  width: 60px;
}

.prop-row input[type="range"] {
  flex: 1;
  accent-color: var(--terracotta);
}

.range-val {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--paper);
  min-width: 2.5rem;
  text-align: right;
}

.prop-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.prop-field label {
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  color: var(--moss-light);
  min-width: 4rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.prop-field input[type="text"],
.prop-field select {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--paper);
  padding: 0.3rem 0.4rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
}

.prop-field input[type="color"] {
  width: 32px;
  height: 24px;
  border: 1px solid var(--moss);
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.prop-field input[type="file"] {
  font-size: 0.65rem;
  color: var(--moss-light);
  max-width: 140px;
}

.prop-field input[type="checkbox"] {
  accent-color: var(--terracotta);
}

.small-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--paper);
  padding: 0.25rem 0.5rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  cursor: pointer;
  transition: all 0.15s;
}

.small-btn:hover {
  border-color: var(--moss);
  background: rgba(106, 125, 91, 0.15);
}
</style>
