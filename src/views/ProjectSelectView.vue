<template>
  <div class="project-select-view">
    <AppHeader mode="gallery" />
    
    <div class="select-container">
      <div class="select-content">
        <h1 class="select-title">SELECT PROJECT</h1>
        <p class="select-subtitle">Choose a project to view, edit or comment</p>

        <div class="select-tabs">
          <button :class="{ active: tab === 'owned' }" @click="tab = 'owned'">
            Your Projects ({{ ownedProjects.length }})
          </button>
          <button :class="{ active: tab === 'all' }" @click="tab = 'all'">
            All Projects ({{ allProjects.length }})
          </button>
        </div>

        <div class="select-search">
          <input v-model="search" type="text" placeholder="Search projects..." />
        </div>

        <div class="projects-grid">
          <div
            v-for="project in filteredProjects"
            :key="project.id"
            class="project-card-select"
            @click="openProject(project)"
          >
            <div class="card-status" :class="'status-' + (project.status || 'active')"></div>
            <div class="card-content">
              <h3>{{ getTitle(project) }}</h3>
              <p>{{ getDescription(project) }}</p>
              <div class="card-meta">
                <span class="meta-item">{{ project.territory || 'Brasil' }}</span>
                <span class="meta-item">{{ project.year || new Date().getFullYear() }}</span>
                <span class="meta-item privacy" v-if="project.privacy !== 'public'">
                  {{ project.privacy === 'private' ? '🔒 Private' : '🔗 Link Only' }}
                </span>
              </div>
            </div>
            <div class="card-arrow">→</div>
          </div>

          <div v-if="filteredProjects.length === 0" class="no-projects">
            <p>No projects found</p>
            <button v-if="auth.isLoggedIn" class="create-btn" @click="showNewProjectModal = true">
              + Create New Project
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New Project Modal -->
    <div v-if="showNewProjectModal" class="modal-overlay" @click="showNewProjectModal = false">
      <div class="modal-content" @click.stop>
        <h2 class="modal-title">CREATE NEW PROJECT</h2>
        <form @submit.prevent="createProject" class="new-project-form">
          <div class="form-group">
            <label>Title (PT)</label>
            <input v-model="newProject.title_pt" type="text" required placeholder="Titulo do projeto" />
          </div>
          <div class="form-group">
            <label>Title (EN)</label>
            <input v-model="newProject.title_en" type="text" placeholder="Project title (optional)" />
          </div>
          <div class="form-group">
            <label>Description (PT)</label>
            <textarea v-model="newProject.description_pt" rows="3" required placeholder="Descricao breve"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Status</label>
              <select v-model="newProject.status">
                <option value="active">Active</option>
                <option value="pipeline">Pipeline</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div class="form-group">
              <label>Privacy</label>
              <select v-model="newProject.privacy">
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="link_only">Link Only</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showNewProjectModal = false">Cancel</button>
            <button type="submit" class="create-btn" :disabled="creating">
              {{ creating ? 'Creating...' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '../stores/projectsStore'
import { useAuthStore } from '../stores/auth'
import AppHeader from '../components/Layout/AppHeader.vue'

const router = useRouter()
const projects = useProjectsStore()
const auth = useAuthStore()
const { locale } = useI18n()

const tab = ref('owned')
const search = ref('')
const showNewProjectModal = ref(false)
const creating = ref(false)
const newProject = ref({ title_pt: '', title_en: '', description_pt: '', status: 'active', privacy: 'private' })

const allProjects = computed(() => projects.projects)
const ownedProjects = computed(() => projects.projects.filter(p => p.owner_id === auth.userId))

const filteredProjects = computed(() => {
  let list = tab.value === 'owned' ? ownedProjects.value : allProjects.value

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

function getTitle(project) {
  const t = project.title
  if (typeof t === 'object') return t[locale.value] ?? t.pt ?? t.en ?? ''
  return t || ''
}

function getDescription(project) {
  const d = project.description
  if (typeof d === 'object') return d[locale.value] ?? d.pt ?? d.en ?? ''
  return d || ''
}

function openProject(project) {
  // In dev mode, always allow edit
  if (auth.isOfflineDev || project.owner_id === auth.userId) {
    router.push({ name: 'canvas-edit', params: { projectId: project.id } })
  } else {
    router.push({ name: 'canvas-view', params: { projectId: project.id } })
  }
}

async function createProject() {
  if (!auth.isLoggedIn) return
  creating.value = true
  try {
    const data = {
      title: { pt: newProject.value.title_pt, ...(newProject.value.title_en ? { en: newProject.value.title_en } : {}) },
      description: { pt: newProject.value.description_pt },
      status: newProject.value.status,
      privacy: newProject.value.privacy,
      size: 'card-md',
      territory: 'Brasil',
      axis: [],
      year: new Date().getFullYear(),
      position_x: Math.random() * 500,
      position_y: Math.random() * 300
    }
    const created = await projects.createProject(data)
    if (created) {
      newProject.value = { title_pt: '', title_en: '', description_pt: '', status: 'active', privacy: 'private' }
      showNewProjectModal.value = false
      router.push({ name: 'canvas-edit', params: { projectId: created.id } })
    }
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  await projects.loadProjects()
})
</script>

<style scoped>
.project-select-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at center, #2a2d24 0%, #0d0d0d 100%);
}

.select-container {
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding: 2rem;
}

.select-content {
  max-width: 1200px;
  margin: 0 auto;
}

.select-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  text-transform: uppercase;
  color: var(--paper);
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
}

.select-subtitle {
  font-family: 'Space Mono', monospace;
  font-size: 0.9rem;
  color: var(--moss-light);
  margin-bottom: 2rem;
}

.select-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.select-tabs button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--moss);
  color: var(--paper);
  padding: 0.75rem 2rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}

.select-tabs button.active {
  background: var(--terracotta);
  border-color: var(--terracotta);
  color: var(--ink);
}

.select-tabs button:hover:not(.active) {
  border-color: var(--moss-light);
  background: rgba(106, 125, 91, 0.1);
}

.select-search {
  margin-bottom: 2rem;
  max-width: 400px;
}

.select-search input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--moss);
  color: var(--paper);
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-family: inherit;
}

.select-search input:focus {
  outline: none;
  border-color: var(--terracotta);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.project-card-select {
  background: rgba(20, 20, 18, 0.95);
  border: 1px solid var(--moss);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.project-card-select::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--terracotta);
  opacity: 0;
  transition: opacity 0.3s;
}

.project-card-select:hover {
  border-color: var(--terracotta);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.project-card-select:hover::before {
  opacity: 1;
}

.card-status {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 40px 40px 0;
}

.card-status.status-active { border-color: transparent #ff5f1f transparent transparent; }
.card-status.status-pipeline { border-color: transparent #6a7d5b transparent transparent; }
.card-status.status-done { border-color: transparent #b55d3a transparent transparent; }

.card-content h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--paper);
  text-transform: uppercase;
  margin: 0 0 0.5rem 0;
}

.card-content p {
  font-size: 0.85rem;
  color: var(--moss-light);
  margin: 0 0 1rem 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--moss-light);
  text-transform: uppercase;
}

.meta-item.privacy {
  opacity: 0.7;
}

.card-arrow {
  position: absolute;
  bottom: 1.5rem;
  right: 1.5rem;
  font-size: 1.5rem;
  color: var(--terracotta);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s;
}

.project-card-select:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
}

.no-projects {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  color: var(--moss-light);
}

.no-projects p {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.create-btn {
  background: var(--terracotta);
  border: none;
  color: var(--ink);
  padding: 0.75rem 2rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  text-transform: uppercase;
}

.create-btn:hover {
  background: var(--stencil-orange);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--ink);
  border: 1px solid var(--moss);
  padding: 2rem;
  max-width: 500px;
  width: 90vw;
}

.modal-title {
  font-family: 'Space Mono', monospace;
  font-size: 1rem;
  color: var(--paper);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.new-project-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  color: var(--moss-light);
  text-transform: uppercase;
}

.form-group input,
.form-group textarea,
.form-group select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--moss);
  color: var(--paper);
  padding: 0.5rem 0.75rem;
  font-family: inherit;
  font-size: 0.85rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--terracotta);
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.cancel-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--paper);
  padding: 0.6rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  cursor: pointer;
  text-transform: uppercase;
}

.create-btn-modal {
  flex: 2;
  background: var(--terracotta);
  border: none;
  color: var(--ink);
  padding: 0.6rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
}

.create-btn-modal:hover {
  background: var(--stencil-orange);
}

.create-btn-modal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
