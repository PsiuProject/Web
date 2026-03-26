<template>
  <div class="welcome-screen">
    <div class="welcome-content">
      <h1 class="welcome-title">EARTH<br>GUARDIANS<span>.SUR</span></h1>
      <p class="welcome-subtitle">Canvas colaborativo para projetos ambientais</p>

      <div v-if="isDevMode" class="dev-mode-badge">
        <span class="dev-icon">&#9881;</span> DEV MODE
      </div>

      <div class="welcome-actions">
        <button class="action-btn primary" @click="handleLogin">
          {{ isDevMode ? 'START TESTING (Mock Login)' : 'ENTRAR / LOGIN' }}
        </button>
        <p class="welcome-note">
          <template v-if="isDevMode">
            Click to start testing with mock data offline.<br>
            Select a project from the gallery to edit/comment.
          </template>
          <template v-else>
            Acesse com Google para ver e editar seus projetos.
          </template>
        </p>
      </div>
    </div>

    <div v-if="isDevMode" class="dev-features">
      <h3>Available for Testing:</h3>
      <ul>
        <li><span class="check">&#10003;</span> View mode</li>
        <li><span class="check">&#10003;</span> Edit mode (add/edit elements)</li>
        <li><span class="check">&#10003;</span> Comment mode</li>
        <li><span class="check">&#10003;</span> Undo/Redo</li>
        <li><span class="check">&#10003;</span> Zoom/Pan with momentum</li>
      </ul>
    </div>

    <div class="welcome-decoration">
      <div class="deco-line"></div>
      <div class="deco-dot"></div>
      <div class="deco-line"></div>
    </div>

    <AuthModal v-if="showAuth" @close="showAuth = false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AuthModal from '../AuthModal.vue'

const showAuth = ref(false)

const isDevMode = computed(() => {
  return import.meta.env.DEV || window.location.hostname === 'localhost'
})

async function handleLogin() {
  if (isDevMode.value) {
    // Direct mock login without modal
    const auth = (await import('../../stores/auth')).useAuthStore()
    await auth().loginWithGoogle()
    // Don't auto-redirect - let user select from gallery
  } else {
    // Show modal for production
    showAuth.value = true
  }
}
</script>

<style scoped>
.welcome-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #2a2d24 0%, #0d0d0d 100%);
  z-index: 500;
}

.welcome-content {
  text-align: center;
  max-width: 500px;
  padding: 2rem;
}

.welcome-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 900;
  line-height: 0.95;
  text-transform: uppercase;
  color: var(--paper);
  margin-bottom: 1.5rem;
}

.welcome-title span {
  color: var(--terracotta);
}

.welcome-subtitle {
  font-family: 'Space Mono', monospace;
  font-size: 0.9rem;
  color: var(--moss-light);
  margin-bottom: 3rem;
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
  margin-bottom: 1.5rem;
}

.dev-icon {
  font-size: 1rem;
  animation: spin 3s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.action-btn {
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 1rem 3rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.primary {
  background: var(--terracotta);
  color: var(--ink);
}

.action-btn.primary:hover {
  background: var(--stencil-orange);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 95, 31, 0.3);
}

.welcome-note {
  font-size: 0.75rem;
  color: var(--moss-light);
  opacity: 0.7;
  max-width: 400px;
  line-height: 1.6;
  text-align: center;
}

.dev-features {
  background: rgba(106, 125, 91, 0.1);
  border: 1px solid rgba(106, 125, 91, 0.3);
  padding: 1.5rem 2rem;
  margin-top: 2rem;
  text-align: left;
  max-width: 450px;
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

.welcome-decoration {
  position: absolute;
  bottom: 3rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.deco-line {
  width: 60px;
  height: 1px;
  background: var(--moss);
  opacity: 0.4;
}

.deco-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--terracotta);
  opacity: 0.6;
}
</style>
