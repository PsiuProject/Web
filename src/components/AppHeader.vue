<template>
  <header>
    <div class="logo">EARTH<br>GUARDIANS<span>.SUR</span></div>
    <div class="nav-sections">
      <a href="#" class="nav-link" @click.prevent="store.clearFocus()">{{ $t('filters.all') }}</a>
      <a href="#" class="nav-link" :class="{ 'nav-active': store.focusedType === 'active' }" @click.prevent="store.focusSection('active')">{{ $t('sections.active') }}</a>
      <a href="#" class="nav-link" :class="{ 'nav-active': store.focusedType === 'pipeline' }" @click.prevent="store.focusSection('pipeline')">{{ $t('sections.pipeline') }}</a>
      <a href="#" class="nav-link" :class="{ 'nav-active': store.focusedType === 'done' }" @click.prevent="store.focusSection('done')">{{ $t('sections.done') }}</a>
      
      <!-- New Project Button -->
      <button v-if="auth.isLoggedIn" class="new-project-btn" @click="showNewProjectModal = true">
        + NEW PROJECT
      </button>
      
      <button class="lang-toggle" @click="toggleLanguage">
        {{ locale === 'pt' ? 'EN' : 'PT' }}
      </button>
      <AuthModal />
    </div>
    
    <!-- New Project Modal -->
    <div v-if="showNewProjectModal" class="modal-overlay" @click="showNewProjectModal = false">
      <div class="modal-content" @click.stop>
        <h2 class="modal-title">CREATE NEW PROJECT</h2>
        <form @submit.prevent="createProject" class="new-project-form">
          <div class="form-group">
            <label>Project Title (Portuguese)</label>
            <input v-model="newProject.title_pt" type="text" required class="form-input" placeholder="Enter project title in Portuguese" />
          </div>
          <div class="form-group">
            <label>Project Title (English)</label>
            <input v-model="newProject.title_en" type="text" class="form-input" placeholder="Enter project title in English (optional)" />
          </div>
          <div class="form-group">
            <label>Description (Portuguese)</label>
            <textarea v-model="newProject.description_pt" rows="3" required class="form-input" placeholder="Brief description in Portuguese"></textarea>
          </div>
          <div class="form-group">
            <label>Description (English)</label>
            <textarea v-model="newProject.description_en" rows="3" class="form-input" placeholder="Brief description in English (optional)"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Status</label>
              <select v-model="newProject.status" class="form-input">
                <option value="active">Active (Em Execução)</option>
                <option value="pipeline">Pipeline / Escrita</option>
                <option value="done">Concluídos</option>
              </select>
            </div>
            <div class="form-group">
              <label>Privacy</label>
              <select v-model="newProject.privacy" class="form-input">
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="link_only">Link Only</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="showNewProjectModal = false">Cancel</button>
            <button type="submit" class="btn-create" :disabled="creating">
              {{ creating ? 'Creating...' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGalleryStore } from '../stores/gallery'
import { useProjectsStore } from '../stores/projectsStore'
import { useAuthStore } from '../stores/auth'
import AuthModal from './AuthModal.vue'

const { locale } = useI18n()
const store = useGalleryStore()
const projectsStore = useProjectsStore()
const auth = useAuthStore()

const showNewProjectModal = ref(false)
const creating = ref(false)
const newProject = ref({
  title_pt: '',
  title_en: '',
  description_pt: '',
  description_en: '',
  status: 'active',
  privacy: 'private'
})

function toggleLanguage() {
  locale.value = locale.value === 'pt' ? 'en' : 'pt'
}

async function createProject() {
  if (!auth.isLoggedIn) return
  
  creating.value = true
  
  try {
    // Build JSONB fields for multi-language support
    const projectData = {
      title: {
        pt: newProject.value.title_pt,
        ...(newProject.value.title_en ? { en: newProject.value.title_en } : {})
      },
      description: {
        pt: newProject.value.description_pt,
        ...(newProject.value.description_en ? { en: newProject.value.description_en } : {})
      },
      status: newProject.value.status,
      privacy: newProject.value.privacy,
      size: 'card-md',
      territory: 'Brasil',
      axis: [],
      year: new Date().getFullYear(),
      position_x: Math.random() * 500,
      position_y: Math.random() * 300
    }
    
    const created = await projectsStore.createProject(projectData)
    if (created) {
      // Reset form and close modal
      newProject.value = {
        title_pt: '',
        title_en: '',
        description_pt: '',
        description_en: '',
        status: 'active',
        privacy: 'private'
      }
      showNewProjectModal.value = false
      
      // Open detail view for the new project
      setTimeout(() => {
        store.openDetailView({
          id: created.id,
          ...projectData,
          _raw: created
        })
      }, 100)
    }
  } catch (error) {
    console.error('[AppHeader] Create project error:', error)
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.lang-toggle {
  background: transparent;
  border: 0.05vw solid var(--moss-light);
  color: var(--paper);
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  padding: 0.42vh 0.63vw;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 0.1vw;
}

.lang-toggle:hover {
  background: var(--terracotta);
  border-color: var(--terracotta);
  color: var(--ink);
}

.new-project-btn {
  background: rgba(255, 95, 31, 0.15);
  border: 1px solid rgba(255, 95, 31, 0.3);
  color: var(--stencil-orange);
  padding: 0.42vh 0.8vw;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.new-project-btn:hover {
  background: rgba(255, 95, 31, 0.3);
  border-color: var(--stencil-orange);
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
  backdrop-filter: blur(0.5vh);
}

.modal-content {
  background: var(--ink);
  border: 0.2vh solid var(--moss);
  padding: 3vh 2vw;
  max-width: 60vw;
  width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 1.5vh 4.5vh rgba(0, 0, 0, 0.6);
}

.modal-title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  font-weight: 800;
  text-transform: uppercase;
  color: var(--paper);
  margin-bottom: 2.5vh;
  text-align: center;
}

.new-project-form {
  display: flex;
  flex-direction: column;
  gap: 1.5vh;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.7vh;
}

.form-group label {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.6rem, 1.2vw, 0.75rem);
  color: var(--moss-light);
  text-transform: uppercase;
}

.form-input {
  background: rgba(255, 255, 255, 0.05);
  border: 0.1vh solid var(--moss);
  color: var(--paper);
  padding: 1vh 1vw;
  font-family: inherit;
  font-size: clamp(0.8rem, 1.5vw, 0.95rem);
}

.form-input:focus {
  outline: none;
  border-color: var(--terracotta);
}

textarea.form-input {
  resize: vertical;
  min-height: 8vh;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5vw;
}

.form-actions {
  display: flex;
  gap: 1vw;
  margin-top: 1vh;
}

.btn-cancel {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 0.1vh solid rgba(255, 255, 255, 0.2);
  color: var(--paper);
  padding: 1.2vh 1.5vw;
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.65rem, 1.2vw, 0.8rem);
  cursor: pointer;
  text-transform: uppercase;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-create {
  flex: 2;
  background: var(--terracotta);
  border: none;
  color: var(--ink);
  padding: 1.2vh 1.5vw;
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.65rem, 1.2vw, 0.8rem);
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
}

.btn-create:hover {
  background: var(--stencil-orange);
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
