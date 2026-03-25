<template>
  <div class="empty-state">
    <!-- Animated background elements -->
    <div class="empty-state-bg">
      <div class="floating-circle circle-1"></div>
      <div class="floating-circle circle-2"></div>
      <div class="floating-circle circle-3"></div>
    </div>

    <!-- Main content -->
    <div class="empty-content">
      <!-- Icon/Illustration -->
      <div class="empty-icon">
        <svg viewBox="0 0 200 200" class="earth-svg">
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--moss)" stroke-width="2" />
          <ellipse cx="100" cy="100" rx="80" ry="30" fill="none" stroke="var(--moss-light)" stroke-width="1.5" transform="rotate(-23.5 100 100)" />
          <ellipse cx="100" cy="100" rx="80" ry="30" fill="none" stroke="var(--moss-light)" stroke-width="1.5" transform="rotate(23.5 100 100)" />
          <path d="M60,80 Q80,60 100,80 T140,80" fill="none" stroke="var(--terracotta)" stroke-width="2" opacity="0.6" />
          <path d="M50,100 Q75,90 100,100 T150,100" fill="none" stroke="var(--terracotta)" stroke-width="2" opacity="0.4" />
          <path d="M60,120 Q80,110 100,120 T140,120" fill="none" stroke="var(--terracotta)" stroke-width="2" opacity="0.6" />
        </svg>
      </div>

      <!-- Welcome message -->
      <h1 class="empty-title">{{ $t('empty.welcome.title') }}</h1>
      <p class="empty-subtitle">{{ $t('empty.welcome.subtitle') }}</p>

      <!-- Feature highlights -->
      <div class="feature-grid">
        <div class="feature-item">
          <div class="feature-icon">&#128640;</div>
          <div class="feature-text">
            <strong>{{ $t('empty.features.create.title') }}</strong>
            <span>{{ $t('empty.features.create.desc') }}</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">&#128101;</div>
          <div class="feature-text">
            <strong>{{ $t('empty.features.collab.title') }}</strong>
            <span>{{ $t('empty.features.collab.desc') }}</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">&#128279;</div>
          <div class="feature-text">
            <strong>{{ $t('empty.features.share.title') }}</strong>
            <span>{{ $t('empty.features.share.desc') }}</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">&#127760;</div>
          <div class="feature-text">
            <strong>{{ $t('empty.features.multilang.title') }}</strong>
            <span>{{ $t('empty.features.multilang.desc') }}</span>
          </div>
        </div>
      </div>

      <!-- CTA Buttons -->
      <div class="empty-actions">
        <template v-if="!auth.isLoggedIn">
          <button class="btn-primary" @click="showAuthModal = true">
            <span class="btn-icon">&#128273;</span>
            {{ $t('empty.actions.login') }}
          </button>
          <p class="login-hint">{{ $t('empty.hints.login') }}</p>
        </template>

        <template v-else>
          <button class="btn-primary" @click="createFirstProject">
            <span class="btn-icon">+</span>
            {{ $t('empty.actions.create') }}
          </button>
          <p class="login-hint">{{ $t('empty.hints.create') }}</p>
        </template>
      </div>

      <!-- Example projects preview (decorative) -->
      <div class="example-preview">
        <div class="preview-label">{{ $t('empty.preview.label') }}</div>
        <div class="preview-cards">
          <div class="preview-card card-lg">
            <div class="preview-tag tag-active">EM EXECUÇÃO</div>
            <div class="preview-line"></div>
            <div class="preview-line short"></div>
          </div>
          <div class="preview-card card-md">
            <div class="preview-tag tag-pipeline">PIPELINE</div>
            <div class="preview-line"></div>
            <div class="preview-line short"></div>
          </div>
          <div class="preview-card card-sm">
            <div class="preview-tag tag-done">CONCLUÍDOS</div>
            <div class="preview-line"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Auth Modal Trigger -->
    <AuthModal v-if="showAuthModal" @close="showAuthModal = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useProjectsStore } from '../stores/projectsStore'
import { useGalleryStore } from '../stores/gallery'
import AuthModal from './AuthModal.vue'

const { t } = useI18n()
const auth = useAuthStore()
const projectsStore = useProjectsStore()
const galleryStore = useGalleryStore()

const showAuthModal = ref(false)

async function createFirstProject() {
  if (!auth.isLoggedIn) {
    showAuthModal.value = true
    return
  }

  // Create a sample first project to get started
  const projectData = {
    title: {
      pt: 'Meu Primeiro Projeto',
      en: 'My First Project'
    },
    description: {
      pt: 'Este é o início da sua jornada com Earth Guardians. Comece a documentar seus projetos ambientais e culturais aqui!',
      en: 'This is the beginning of your Earth Guardians journey. Start documenting your environmental and cultural projects here!'
    },
    status: 'active',
    privacy: 'private',
    size: 'card-md',
    territory: 'Brasil',
    axis: [t('empty.example.axis')],
    year: new Date().getFullYear(),
    position_x: 200,
    position_y: 200
  }

  const created = await projectsStore.createProject(projectData)
  if (created) {
    // Open detail view for editing
    setTimeout(() => {
      galleryStore.openDetailView({
        id: created.id,
        ...projectData,
        _raw: created
      })
    }, 100)
  }
}
</script>

<style scoped>
.empty-state {
  position: relative;
  width: 100%;
  height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Animated background */
.empty-state-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.floating-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(106, 125, 91, 0.1) 0%, transparent 70%);
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  right: -50px;
  animation-delay: 7s;
}

.circle-3 {
  width: 250px;
  height: 250px;
  top: 50%;
  right: 10%;
  animation-delay: 14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.05); }
  50% { transform: translate(-10px, 10px) scale(0.95); }
  75% { transform: translate(15px, 15px) scale(1.02); }
}

/* Main content */
.empty-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  padding: 40px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 32px;
  animation: pulse-glow 3s infinite ease-in-out;
}

.earth-svg {
  width: 200px;
  height: 200px;
}

@keyframes pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 20px rgba(106, 125, 91, 0.3)); }
  50% { filter: drop-shadow(0 0 40px rgba(106, 125, 91, 0.6)); }
}

.empty-title {
  font-family: 'Outfit', sans-serif;
  font-size: 3rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--paper);
  margin-bottom: 12px;
  letter-spacing: 0.05em;
}

.empty-subtitle {
  font-size: 1.1rem;
  color: var(--paper);
  opacity: 0.8;
  margin-bottom: 48px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* Feature grid */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
  text-align: left;
}

.feature-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

.feature-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feature-text strong {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  color: var(--stencil-orange);
  text-transform: uppercase;
}

.feature-text span {
  font-size: 0.85rem;
  color: var(--paper);
  opacity: 0.8;
  line-height: 1.4;
}

/* Action buttons */
.empty-actions {
  margin-bottom: 48px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: var(--terracotta);
  border: none;
  color: var(--ink);
  padding: 16px 32px;
  font-family: 'Space Mono', monospace;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s;
}

.btn-primary:hover {
  background: var(--stencil-orange);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 95, 31, 0.3);
}

.btn-icon {
  font-size: 1.2rem;
}

.login-hint {
  margin-top: 16px;
  font-size: 0.8rem;
  color: var(--moss-light);
  font-family: 'Space Mono', monospace;
}

/* Example preview */
.example-preview {
  padding: 32px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
}

.preview-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--moss-light);
  text-transform: uppercase;
  margin-bottom: 20px;
  letter-spacing: 0.1em;
}

.preview-cards {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.preview-card {
  background: rgba(20, 20, 18, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
  text-align: left;
}

.card-lg { width: 280px; min-height: 180px; }
.card-md { width: 220px; min-height: 160px; }
.card-sm { width: 180px; min-height: 140px; }

.preview-tag {
  display: inline-block;
  padding: 4px 10px;
  font-size: 0.6rem;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 12px;
  font-family: 'Space Mono', monospace;
}

.tag-active { background: rgba(255, 95, 31, 0.2); border: 1px solid #ff5f1f; color: #ff5f1f; }
.tag-pipeline { background: rgba(106, 125, 91, 0.2); border: 1px solid #6a7d5b; color: #6a7d5b; }
.tag-done { background: rgba(181, 93, 58, 0.2); border: 1px solid #b55d3a; color: #b55d3a; }

.preview-line {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
  border-radius: 2px;
}

.preview-line.short {
  width: 60%;
}

/* Responsive */
@media (max-width: 768px) {
  .empty-title {
    font-size: 2rem;
  }

  .empty-subtitle {
    font-size: 0.95rem;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .empty-content {
    padding: 20px;
  }

  .preview-cards {
    flex-direction: column;
    align-items: center;
  }
}
</style>
