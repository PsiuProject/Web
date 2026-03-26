<template>
  <div class="project-selector-overlay" @click.self="$emit('close')">
    <div class="selector-panel">
      <div class="selector-header">
        <h2>YOUR PROJECTS</h2>
        <button class="close-selector" @click="$emit('close')">&times;</button>
      </div>

      <div class="selector-tabs">
        <button :class="{ active: tab === 'owned' }" @click="tab = 'owned'">Owned</button>
        <button :class="{ active: tab === 'shared' }" @click="tab = 'shared'">Shared</button>
      </div>

      <div class="selector-search">
        <input v-model="search" type="text" placeholder="Search projects..." />
      </div>

      <div class="selector-list">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="selector-item"
          @click="openProject(project)"
        >
          <div class="item-status" :class="'tag-' + (project.status || 'active')"></div>
          <div class="item-info">
            <h3>{{ getTitle(project) }}</h3>
            <p>{{ getDescription(project) }}</p>
          </div>
          <div class="item-meta">
            <span v-if="project.privacy !== 'public'" class="item-privacy">
              {{ project.privacy === 'private' ? 'Private' : 'Link' }}
            </span>
            <span class="item-role">{{ getRole(project) }}</span>
          </div>
        </div>

        <div v-if="filteredProjects.length === 0" class="no-projects">
          <p v-if="tab === 'owned'">No projects yet. Create one from the toolbar.</p>
          <p v-else>No shared projects found.</p>
        </div>
      </div>

      <div class="selector-footer">
        <button class="new-project-btn" @click="$emit('close'); createNew()">
          + NEW PROJECT
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '../../stores/projectsStore'
import { useAuthStore } from '../../stores/auth'
import { useI18nStore } from '../../stores/i18n-store'

const emit = defineEmits(['close'])

const router = useRouter()
const projects = useProjectsStore()
const auth = useAuthStore()
const i18nStore = useI18nStore()
const { locale } = useI18n()

const tab = ref('owned')
const search = ref('')

function getTitle(project) {
  const t = project.title
  if (typeof t === 'object') return t[i18nStore.currentLocale] ?? t.pt ?? t.en ?? ''
  return t || ''
}

function getDescription(project) {
  const d = project.description
  if (typeof d === 'object') return d[i18nStore.currentLocale] ?? d.pt ?? d.en ?? ''
  return d || ''
}

function getRole(project) {
  if (project.owner_id === auth.userId) return 'Owner'
  return project._memberRole || 'Viewer'
}

const filteredProjects = computed(() => {
  let list = projects.projects

  if (tab.value === 'owned') {
    list = list.filter(p => p.owner_id === auth.userId)
  } else {
    list = list.filter(p => p.owner_id !== auth.userId)
  }

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(p => {
      const title = getTitle(p).toLowerCase()
      const desc = getDescription(p).toLowerCase()
      return title.includes(q) || desc.includes(q)
    })
  }

  return list
})

function openProject(project) {
  const role = getRole(project)
  // In dev mode, always allow edit
  if (auth.isOfflineDev || role === 'Owner' || role === 'Editor') {
    router.push({ name: 'canvas-edit', params: { projectId: project.id } })
  } else {
    router.push({ name: 'canvas-view', params: { projectId: project.id } })
  }
  emit('close')
}

function createNew() {
  // Handled by parent (AppHeader has create modal)
}
</script>

<style scoped>
.project-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 800;
  backdrop-filter: blur(4px);
}

.selector-panel {
  background: rgba(20, 20, 18, 0.98);
  border: 1px solid var(--moss);
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--moss);
}

.selector-header h2 {
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
  color: var(--paper);
  letter-spacing: 0.1em;
  margin: 0;
}

.close-selector {
  background: transparent;
  border: none;
  color: var(--moss-light);
  font-size: 1.5rem;
  cursor: pointer;
}

.close-selector:hover {
  color: var(--paper);
}

.selector-tabs {
  display: flex;
  border-bottom: 1px solid rgba(106, 125, 91, 0.3);
}

.selector-tabs button {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--moss-light);
  padding: 0.75rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.selector-tabs button.active {
  color: var(--terracotta);
  border-bottom-color: var(--terracotta);
}

.selector-tabs button:hover:not(.active) {
  color: var(--paper);
  background: rgba(106, 125, 91, 0.05);
}

.selector-search {
  padding: 0.75rem 1rem;
}

.selector-search input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--moss);
  color: var(--paper);
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-family: inherit;
}

.selector-search input:focus {
  outline: none;
  border-color: var(--terracotta);
}

.selector-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.selector-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.selector-item:hover {
  background: rgba(106, 125, 91, 0.08);
  border-color: var(--moss);
}

.item-status {
  width: 4px;
  min-height: 2.5rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.item-status.tag-active { background: var(--stencil-orange); }
.item-status.tag-pipeline { background: var(--moss); }
.item-status.tag-done { background: var(--terracotta); }

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info h3 {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--paper);
  text-transform: uppercase;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-info p {
  font-size: 0.75rem;
  color: var(--moss-light);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.item-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex-shrink: 0;
}

.item-privacy {
  font-family: 'Space Mono', monospace;
  font-size: 0.55rem;
  color: var(--moss-light);
  text-transform: uppercase;
  padding: 0.1rem 0.4rem;
  border: 1px solid rgba(106, 125, 91, 0.3);
}

.item-role {
  font-family: 'Space Mono', monospace;
  font-size: 0.55rem;
  color: var(--terracotta);
  text-transform: uppercase;
}

.no-projects {
  padding: 2rem;
  text-align: center;
  color: var(--moss-light);
  font-size: 0.85rem;
  opacity: 0.6;
}

.selector-footer {
  padding: 1rem;
  border-top: 1px solid var(--moss);
}

.new-project-btn {
  width: 100%;
  background: rgba(255, 95, 31, 0.15);
  border: 1px solid rgba(255, 95, 31, 0.3);
  color: var(--stencil-orange);
  padding: 0.75rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.2s;
}

.new-project-btn:hover {
  background: rgba(255, 95, 31, 0.3);
  border-color: var(--stencil-orange);
}
</style>
