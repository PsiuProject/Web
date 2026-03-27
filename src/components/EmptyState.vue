<template>
  <div class="empty-state">
    <!-- Welcome Screen (shown initially) -->
    <div v-if="!showTestCanvas" class="welcome-screen">
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
            <ellipse
              cx="100"
              cy="100"
              rx="80"
              ry="30"
              fill="none"
              stroke="var(--moss-light)"
              stroke-width="1.5"
              transform="rotate(-23.5 100 100)"
            />
            <ellipse
              cx="100"
              cy="100"
              rx="80"
              ry="30"
              fill="none"
              stroke="var(--moss-light)"
              stroke-width="1.5"
              transform="rotate(23.5 100 100)"
            />
            <path
              d="M60,80 Q80,60 100,80 T140,80"
              fill="none"
              stroke="var(--terracotta)"
              stroke-width="2"
              opacity="0.6"
            />
            <path
              d="M50,100 Q75,90 100,100 T150,100"
              fill="none"
              stroke="var(--terracotta)"
              stroke-width="2"
              opacity="0.4"
            />
            <path
              d="M60,120 Q80,110 100,120 T140,120"
              fill="none"
              stroke="var(--terracotta)"
              stroke-width="2"
              opacity="0.6"
            />
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
            <button class="btn-secondary" @click="showTestCanvas = true">
              <span class="btn-icon">&#127912;</span>
              {{ $t('empty.actions.test') }}
            </button>
            <p class="login-hint">{{ $t('empty.hints.login') }}</p>
          </template>

          <template v-else>
            <button class="btn-primary" @click="createFirstProject">
              <span class="btn-icon">+</span>
              {{ $t('empty.actions.create') }}
            </button>
            <button class="btn-secondary" @click="showTestCanvas = true">
              <span class="btn-icon">&#127912;</span>
              {{ $t('empty.actions.test') }}
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

    <!-- Test Canvas Mode -->
    <div v-else class="test-canvas-container">
      <!-- Mini Canvas Editor for Testing -->
      <div class="test-canvas-header">
        <div class="header-content">
          <h2 class="test-title">{{ $t('empty.testCanvas.title') }}</h2>
          <p class="test-subtitle">{{ $t('empty.testCanvas.subtitle') }}</p>
        </div>
        <button class="back-btn" @click="exitTestCanvas">
          <span>&#8592;</span>
          {{ $t('empty.testCanvas.back') }}
        </button>
      </div>

      <div class="test-canvas-wrapper">
        <CanvasEditor :project-id="'demo-' + Date.now()" :can-edit="true" ref="canvasEditorRef" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useProjectsStore } from '../stores/projectsStore'
import { useGalleryStore } from '../stores/gallery'
import AuthModal from './AuthModal.vue'
import CanvasEditor from './CanvasEditor/CanvasEditor.vue'

const { t } = useI18n()
const auth = useAuthStore()
const projectsStore = useProjectsStore()
const galleryStore = useGalleryStore()

const showAuthModal = ref(false)
const showTestCanvas = ref(false)
const canvasEditorRef = ref(null)

async function createFirstProject() {
  if (!auth.isLoggedIn) {
    showAuthModal.value = true
    return
  }

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
    setTimeout(() => {
      galleryStore.openDetailView({
        id: created.id,
        ...projectData,
        _raw: created
      })
    }, 100)
  }
}

function exitTestCanvas() {
  showTestCanvas.value = false
}
</script>

<style scoped>
.empty-state {
  position: relative;
  width: 100%;
  height: calc(100vh - 12vh);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Welcome Screen */
.welcome-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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
  width: 40vw;
  height: 40vw;
  top: -10vh;
  left: -10vw;
  animation-delay: 0s;
}

.circle-2 {
  width: 30vw;
  height: 30vw;
  bottom: -5vh;
  right: -5vw;
  animation-delay: 7s;
}

.circle-3 {
  width: 25vw;
  height: 25vw;
  top: 50%;
  right: 10%;
  animation-delay: 14s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(2vw, -2vh) scale(1.05);
  }
  50% {
    transform: translate(-1vw, 1vh) scale(0.95);
  }
  75% {
    transform: translate(1.5vw, 1.5vh) scale(1.02);
  }
}

/* Main content */
.empty-content {
  position: relative;
  z-index: 1;
  max-width: 80vw;
  padding: 4vh 3vw;
  text-align: center;
}

.empty-icon {
  margin-bottom: 3vh;
  animation: pulse-glow 3s infinite ease-in-out;
}

.earth-svg {
  width: 20vw;
  height: 20vw;
  max-width: clamp(180px, 25vw, 200px);
  max-height: clamp(180px, 25vw, 200px);
}

@keyframes pulse-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 2vh rgba(106, 125, 91, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 4vh rgba(106, 125, 91, 0.6));
  }
}

.empty-title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 800;
  text-transform: uppercase;
  color: var(--paper);
  margin-bottom: 1vh;
  letter-spacing: 0.05em;
}

.empty-subtitle {
  font-size: clamp(0.9rem, 2vw, 1.2rem);
  color: var(--paper);
  opacity: 0.8;
  margin-bottom: 5vh;
  max-width: 60vw;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* Feature grid */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18vw, 1fr));
  gap: 2.5vh;
  margin-bottom: 5vh;
  text-align: left;
}

.feature-item {
  display: flex;
  gap: 1vw;
  padding: 2vh;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.8vh;
}

.feature-icon {
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  flex-shrink: 0;
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 0.5vh;
}

.feature-text strong {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.6rem, 1.2vw, 0.8rem);
  color: var(--stencil-orange);
  text-transform: uppercase;
}

.feature-text span {
  font-size: clamp(0.75rem, 1.5vw, 0.9rem);
  color: var(--paper);
  opacity: 0.8;
  line-height: 1.4;
}

/* Action buttons */
.empty-actions {
  margin-bottom: 5vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2vh;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 1vw;
  border: none;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s;
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.75rem, 1.5vw, 0.95rem);
  font-weight: bold;
  padding: 1.5vh 3vw;
  border-radius: 0.5vh;
}

.btn-primary {
  background: var(--terracotta);
  color: var(--ink);
}

.btn-primary:hover {
  background: var(--stencil-orange);
  transform: translateY(-0.3vh);
  box-shadow: 0 1vh 2.5vh rgba(255, 95, 31, 0.3);
}

.btn-secondary {
  background: rgba(106, 125, 91, 0.2);
  color: var(--paper);
  border: 1px solid var(--moss);
}

.btn-secondary:hover {
  background: rgba(106, 125, 91, 0.3);
  transform: translateY(-0.3vh);
  box-shadow: 0 1vh 2.5vh rgba(106, 125, 91, 0.3);
}

.btn-icon {
  font-size: clamp(1rem, 2vw, 1.3rem);
}

.login-hint {
  margin-top: 2vh;
  font-size: clamp(0.65rem, 1.2vw, 0.85rem);
  color: var(--moss-light);
  font-family: 'Space Mono', monospace;
}

/* Example preview */
.example-preview {
  padding: 3vh 2vw;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 1.2vh;
}

.preview-label {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.55rem, 1vw, 0.75rem);
  color: var(--moss-light);
  text-transform: uppercase;
  margin-bottom: 2vh;
  letter-spacing: 0.1em;
}

.preview-cards {
  display: flex;
  gap: 1.5vw;
  justify-content: center;
  flex-wrap: wrap;
}

.preview-card {
  background: rgba(20, 20, 18, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5vh;
  text-align: left;
  border-radius: 0.5vh;
}

.card-lg {
  width: clamp(180px, 28vw, 280px);
  min-height: clamp(140px, 18vh, 180px);
}
.card-md {
  width: clamp(140px, 22vw, 220px);
  min-height: clamp(120px, 16vh, 160px);
}
.card-sm {
  width: clamp(120px, 18vw, 180px);
  min-height: clamp(100px, 14vh, 140px);
}

.preview-tag {
  display: inline-block;
  padding: 0.5vh 1vw;
  font-size: clamp(0.5rem, 1vw, 0.65rem);
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 1.5vh;
  font-family: 'Space Mono', monospace;
  border-radius: 0.3vh;
}

.tag-active {
  background: rgba(255, 95, 31, 0.2);
  border: 1px solid #ff5f1f;
  color: #ff5f1f;
}
.tag-pipeline {
  background: rgba(106, 125, 91, 0.2);
  border: 1px solid #6a7d5b;
  color: #6a7d5b;
}
.tag-done {
  background: rgba(181, 93, 58, 0.2);
  border: 1px solid #b55d3a;
  color: #b55d3a;
}

.preview-line {
  height: 1vh;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 1vh;
  border-radius: 0.2vh;
}

.preview-line.short {
  width: 60%;
}

/* Test Canvas Mode */
.test-canvas-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.test-canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5vh 2vw;
  background: rgba(20, 20, 18, 0.95);
  border-bottom: 2px solid var(--moss);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5vh;
}

.test-title {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.9rem, 2vw, 1.2rem);
  font-weight: bold;
  color: var(--paper);
  text-transform: uppercase;
  margin: 0;
}

.test-subtitle {
  font-size: clamp(0.7rem, 1.5vw, 0.85rem);
  color: var(--moss-light);
  margin: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5vw;
  background: rgba(255, 95, 31, 0.2);
  border: 1px solid var(--terracotta);
  color: var(--paper);
  padding: 1vh 1.5vw;
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.7rem, 1.5vw, 0.85rem);
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.3s;
}

.back-btn:hover {
  background: rgba(255, 95, 31, 0.3);
}

.back-btn span {
  font-size: clamp(1rem, 2vw, 1.2rem);
}

.test-canvas-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
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
    padding: 2vh 2vw;
  }

  .preview-cards {
    flex-direction: column;
    align-items: center;
  }

  .test-canvas-header {
    flex-direction: column;
    gap: 1.5vh;
    align-items: flex-start;
  }

  .back-btn {
    align-self: flex-end;
  }
}
</style>
