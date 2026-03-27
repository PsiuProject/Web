<template>
  <div class="welcome-view">
    <AppHeader mode="gallery" />

    <div class="welcome-content-wrapper">
      <!-- Left side: Welcome message -->
      <div class="welcome-left">
        <h1 class="main-title">
          EARTH
          <br />
          GUARDIANS
          <span>.SUR</span>
        </h1>
        <p class="subtitle">Canvas colaborativo para projetos ambientais</p>

        <div v-if="isDevMode" class="dev-mode-badge">
          <span class="dev-icon">&#9881;</span>
          DEV MODE
        </div>

        <div class="login-section">
          <button class="login-btn" @click="handleLogin">
            <span class="google-icon">G</span>
            {{ isDevMode ? 'START TESTING (Mock Login)' : 'ENTRAR COM GOOGLE' }}
          </button>
          <p class="login-note">
            <template v-if="isDevMode">Click to start testing with mock data offline.</template>
            <template v-else>Acesse com Google para ver e editar seus projetos.</template>
          </p>
        </div>

        <div v-if="isDevMode" class="dev-features">
          <h3>Available for Testing:</h3>
          <ul>
            <li>
              <span class="check">&#10003;</span>
              View mode
            </li>
            <li>
              <span class="check">&#10003;</span>
              Edit mode (add/edit elements)
            </li>
            <li>
              <span class="check">&#10003;</span>
              Comment mode
            </li>
            <li>
              <span class="check">&#10003;</span>
              Undo/Redo
            </li>
            <li>
              <span class="check">&#10003;</span>
              Zoom/Pan with momentum
            </li>
          </ul>
        </div>
      </div>

      <!-- Right side: Project selector or CTA -->
      <div class="welcome-right">
        <div class="right-panel">
          <h2 class="panel-title">SELECT PROJECT</h2>
          <p class="panel-subtitle">Choose a project to view, edit or comment</p>

          <div class="select-tabs">
            <button :class="{ active: tab === 'owned' }" @click="tab = 'owned'">
              Your Projects ({{ ownedProjects.length }})
            </button>
            <button :class="{ active: tab === 'all' }" @click="tab = 'all'">
              All Projects ({{ allProjects.length }})
            </button>
          </div>

          <div class="search-box">
            <input v-model="search" type="text" placeholder="Search projects..." />
          </div>

          <div class="project-list">
            <div
              v-for="project in filteredProjects"
              :key="project.id"
              class="project-item"
              @click="openProject(project)"
            >
              <div class="item-status" :class="'status-' + (project.status || 'active')"></div>
              <div class="item-content">
                <h3>{{ getTitle(project) }}</h3>
                <p>{{ getDescription(project) }}</p>
                <div class="item-meta">
                  <span>{{ project.territory || 'Brasil' }}</span>
                  <span v-if="project.privacy !== 'public'" class="privacy-tag">
                    {{ project.privacy === 'private' ? '🔒' : '🔗' }}
                  </span>
                </div>
              </div>
              <div class="item-arrow">→</div>
            </div>

            <div v-if="filteredProjects.length === 0" class="no-projects">
              <p>No projects found</p>
              <button v-if="auth.isLoggedIn" class="create-btn" @click="showNewProjectModal = true">
                + Create New Project
              </button>
            </div>
          </div>

          <div class="panel-footer">
            <button class="view-all-btn" @click="goToGallery">VIEW ALL PROJECTS IN GALLERY</button>
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
            <input
              v-model="newProject.title_pt"
              type="text"
              required
              placeholder="Titulo do projeto"
            />
          </div>
          <div class="form-group">
            <label>Title (EN)</label>
            <input
              v-model="newProject.title_en"
              type="text"
              placeholder="Project title (optional)"
            />
          </div>
          <div class="form-group">
            <label>Description (PT)</label>
            <textarea
              v-model="newProject.description_pt"
              rows="3"
              required
              placeholder="Descricao breve"
            ></textarea>
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
            <button type="button" class="cancel-btn" @click="showNewProjectModal = false">
              Cancel
            </button>
            <button type="submit" class="create-btn-modal" :disabled="creating">
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
const newProject = ref({
  title_pt: '',
  title_en: '',
  description_pt: '',
  status: 'active',
  privacy: 'private'
})

const isDevMode = computed(() => {
  return import.meta.env.DEV || window.location.hostname === 'localhost'
})

const allProjects = computed(() => projects.projects)
const ownedProjects = computed(() => projects.projects.filter((p) => p.owner_id === auth.userId))

const filteredProjects = computed(() => {
  let list = tab.value === 'owned' ? ownedProjects.value : allProjects.value

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((p) => {
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

async function handleLogin() {
  await auth.loginWithGoogle()
}

function openProject(project) {
  if (auth.isOfflineDev || project.owner_id === auth.userId) {
    router.push({ name: 'canvas-edit', params: { projectId: project.id } })
  } else {
    router.push({ name: 'canvas-view', params: { projectId: project.id } })
  }
}

function goToGallery() {
  router.push({ name: 'gallery' })
}

async function createProject() {
  if (!auth.isLoggedIn) return
  creating.value = true
  try {
    const data = {
      title: {
        pt: newProject.value.title_pt,
        ...(newProject.value.title_en ? { en: newProject.value.title_en } : {})
      },
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
      newProject.value = {
        title_pt: '',
        title_en: '',
        description_pt: '',
        status: 'active',
        privacy: 'private'
      }
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
.welcome-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at center, #2a2d24 0%, #0d0d0d 100%);
  overflow: hidden;
}

.welcome-content-wrapper {
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

/* Left Side */
.welcome-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
}

.main-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 0.95;
  text-transform: uppercase;
  color: var(--paper);
  margin-bottom: 1rem;
}

.main-title span {
  color: var(--terracotta);
}

.subtitle {
  font-family: 'Space Mono', monospace;
  font-size: 0.9rem;
  color: var(--moss-light);
  margin-bottom: 2rem;
  letter-spacing: 0.05em;
}

.dev-mode-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 95, 31, 0.15);
  border: 1px solid rgba(255, 95, 31, 0.3);
  color: var(--stencil-orange);
  padding: 0.4rem 1rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 2rem;
  width: fit-content;
}

.dev-icon {
  font-size: 1rem;
  animation: spin 3s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-section {
  margin-bottom: 2rem;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: var(--terracotta);
  border: none;
  color: var(--ink);
  padding: 1rem 2.5rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  max-width: 350px;
}

.login-btn:hover {
  background: var(--stencil-orange);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 95, 31, 0.3);
}

.google-icon {
  font-size: 1.2rem;
  font-weight: 900;
}

.login-note {
  font-size: 0.75rem;
  color: var(--moss-light);
  opacity: 0.7;
  margin-top: 1rem;
  line-height: 1.6;
  text-align: center;
}

.dev-features {
  background: rgba(106, 125, 91, 0.1);
  border: 1px solid rgba(106, 125, 91, 0.3);
  padding: 1.5rem 2rem;
  margin-top: 1rem;
}

.dev-features h3 {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--moss-light);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
}

.dev-features ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.dev-features li {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--paper);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.check {
  color: var(--moss);
  font-weight: bold;
}

/* Right Side */
.welcome-right {
  display: flex;
  align-items: center;
}

.right-panel {
  background: rgba(20, 20, 18, 0.95);
  border: 1px solid var(--moss);
  padding: 2rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  max-height: 70vh;
}

.panel-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  text-transform: uppercase;
  color: var(--paper);
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
}

.panel-subtitle {
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  color: var(--moss-light);
  margin-bottom: 1.5rem;
}

.select-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.select-tabs button {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--moss);
  color: var(--paper);
  padding: 0.5rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}

.select-tabs button.active {
  background: var(--terracotta);
  border-color: var(--terracotta);
  color: var(--ink);
}

.search-box {
  margin-bottom: 1rem;
}

.search-box input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--moss);
  color: var(--paper);
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  font-family: inherit;
}

.search-box input:focus {
  outline: none;
  border-color: var(--terracotta);
}

.project-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.project-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
}

.project-item:hover {
  background: rgba(106, 125, 91, 0.08);
  border-color: var(--moss);
}

.item-status {
  width: 3px;
  min-height: 3rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.item-status.status-active {
  background: var(--stencil-orange);
}
.item-status.status-pipeline {
  background: var(--moss);
}
.item-status.status-done {
  background: var(--terracotta);
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-content h3 {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--paper);
  text-transform: uppercase;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-content p {
  font-size: 0.7rem;
  color: var(--moss-light);
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.item-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.item-meta span {
  font-family: 'Space Mono', monospace;
  font-size: 0.55rem;
  color: var(--moss-light);
  text-transform: uppercase;
}

.privacy-tag {
  opacity: 0.7;
}

.item-arrow {
  font-size: 1.2rem;
  color: var(--terracotta);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.2s;
}

.project-item:hover .item-arrow {
  opacity: 1;
  transform: translateX(0);
}

.no-projects {
  padding: 2rem;
  text-align: center;
  color: var(--moss-light);
}

.no-projects p {
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.create-btn {
  background: var(--terracotta);
  border: none;
  color: var(--ink);
  padding: 0.5rem 1.5rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  text-transform: uppercase;
}

.panel-footer {
  border-top: 1px solid var(--moss);
  padding-top: 1rem;
}

.view-all-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--moss);
  color: var(--paper);
  padding: 0.75rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s;
}

.view-all-btn:hover {
  background: rgba(106, 125, 91, 0.1);
  border-color: var(--terracotta);
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

/* Responsive */
@media (max-width: 1024px) {
  .welcome-content-wrapper {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .welcome-left {
    padding: 1rem;
  }

  .welcome-right {
    align-items: flex-start;
  }

  .right-panel {
    max-height: none;
  }
}
</style>
