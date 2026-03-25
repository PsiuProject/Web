<template>
  <div class="properties-panel">
    <div class="panel-header">
      <span>{{ $t('editor.properties') }}</span>
      <button @click="$emit('close')">×</button>
    </div>
    
    <div class="panel-content">
      <!-- Title/Text input -->
      <div v-if="element.type === 'card' || element.type === 'text'" class="prop-group">
        <label>{{ $t('editor.title') }}</label>
        <input 
          v-model="localContent.title" 
          @change="onUpdate"
          class="prop-input"
        />
      </div>

      <!-- Description textarea -->
      <div v-if="element.type === 'card'" class="prop-group">
        <label>{{ $t('editor.description') }}</label>
        <textarea 
          v-model="localContent.description"
          @change="onUpdate"
          class="prop-textarea"
          rows="3"
        ></textarea>
      </div>

      <!-- Status selector -->
      <div v-if="element.type === 'card'" class="prop-group">
        <label>Status</label>
        <select 
          v-model="localContent.status"
          @change="onUpdate"
          class="prop-select"
        >
          <option value="active">Active</option>
          <option value="pipeline">Pipeline</option>
          <option value="done">Done</option>
        </select>
      </div>

      <!-- URL input for images/links -->
      <div v-if="element.type === 'image' || element.type === 'link'" class="prop-group">
        <label>URL</label>
        <input 
          v-model="localContent.url"
          @change="onUpdate"
          class="prop-input"
          placeholder="https://..."
        />
      </div>

      <!-- Caption for images -->
      <div v-if="element.type === 'image'" class="prop-group">
        <label>Caption</label>
        <input 
          v-model="localContent.caption"
          @change="onUpdate"
          class="prop-input"
          placeholder="Image caption..."
        />
      </div>

      <!-- Label for links -->
      <div v-if="element.type === 'link'" class="prop-group">
        <label>Label</label>
        <input 
          v-model="localContent.label"
          @change="onUpdate"
          class="prop-input"
          placeholder="Link label..."
        />
      </div>

      <!-- Text content for text elements -->
      <div v-if="element.type === 'text'" class="prop-group">
        <label>Text</label>
        <textarea 
          v-model="localContent.text"
          @change="onUpdate"
          class="prop-textarea"
          rows="4"
        ></textarea>
      </div>

      <!-- Note text -->
      <div v-if="element.type === 'note'" class="prop-group">
        <label>Note Text</label>
        <textarea 
          v-model="localContent.text"
          @change="onUpdate"
          class="prop-textarea"
          rows="4"
        ></textarea>
      </div>

      <!-- Position inputs -->
      <div class="prop-row">
        <div class="prop-group">
          <label>X</label>
          <input 
            type="number"
            v-model.number="element.position_x"
            @change="onUpdate"
            class="prop-input-small"
          />
        </div>
        <div class="prop-group">
          <label>Y</label>
          <input 
            type="number"
            v-model.number="element.position_y"
            @change="onUpdate"
            class="prop-input-small"
          />
        </div>
      </div>

      <!-- Size inputs -->
      <div class="prop-row">
        <div class="prop-group">
          <label>W</label>
          <input 
            type="number"
            v-model.number="element.width"
            @change="onUpdate"
            class="prop-input-small"
          />
        </div>
        <div class="prop-group">
          <label>H</label>
          <input 
            type="number"
            v-model.number="element.height"
            @change="onUpdate"
            class="prop-input-small"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  element: { type: Object, required: true }
})

const emit = defineEmits(['update', 'close'])

// Local copy of content for v-model
const localContent = ref({ ...props.element.content })

// Watch for element changes and update local content
watch(() => props.element.content, (newContent) => {
  localContent.value = { ...newContent }
}, { deep: true })

function onUpdate() {
  // Merge updated content back to element
  props.element.content = { ...localContent.value }
  emit('update', props.element)
}
</script>

<style scoped>
.properties-panel {
  position: absolute;
  top: 2vh;
  right: 2vw;
  width: clamp(250px, 28vw, 320px);
  background: rgba(20, 20, 18, 0.95);
  border: 0.2vh solid var(--moss);
  border-radius: 0.8vh;
  padding: 1.5vh 1.5vw;
  z-index: 100;
  backdrop-filter: blur(0.8vh);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5vh;
  padding-bottom: 1vh;
  border-bottom: 0.1vh solid var(--moss);
}

.panel-header span {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.6rem, 1.2vw, 0.75rem);
  color: var(--moss-light);
  text-transform: uppercase;
}

.panel-header button {
  background: none;
  border: none;
  color: var(--paper);
  font-size: clamp(1rem, 2vw, 1.3rem);
  cursor: pointer;
}

.prop-group {
  margin-bottom: 1.5vh;
}

.prop-group label {
  display: block;
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.55rem, 1vw, 0.7rem);
  color: var(--moss-light);
  text-transform: uppercase;
  margin-bottom: 0.5vh;
}

.prop-input,
.prop-textarea,
.prop-select {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 0.1vh solid var(--moss);
  color: var(--paper);
  padding: 1vh 0.8vw;
  font-family: inherit;
  font-size: clamp(0.7rem, 1.3vw, 0.85rem);
  box-sizing: border-box;
}

.prop-input:focus,
.prop-textarea:focus,
.prop-select:focus {
  outline: none;
  border-color: var(--terracotta);
}

.prop-row {
  display: flex;
  gap: 1vw;
}

.prop-group .prop-input-small {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 0.1vh solid var(--moss);
  color: var(--paper);
  padding: 0.7vh 0.6vw;
  font-size: clamp(0.65rem, 1.2vw, 0.8rem);
}
</style>
