<template>
  <div class="auth-wrapper">
    <button class="auth-trigger" @click="toggleDropdown">
      <div v-if="auth.isLoggedIn" class="avatar">
        <img v-if="auth.userAvatar" :src="auth.userAvatar" :alt="auth.userName" class="avatar-img" />
        <span v-else>{{ auth.userInitial }}</span>
      </div>
      <div v-else class="avatar-placeholder">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    </button>

    <Teleport to="body">
      <Transition name="dropdown">
        <div v-if="showDropdown" class="auth-dropdown" @click.stop>
          <template v-if="!auth.isLoggedIn">
            <div class="dropdown-header">
              <span class="dropdown-title">Sign In</span>
            </div>
            <!-- Google Login Button -->
            <div class="auth-google">
              <button class="google-btn" @click="handleGoogleLogin">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
            <div class="auth-divider">
              <span>or</span>
            </div>
            <!-- Email/Password Fallback -->
            <form @submit.prevent="handleEmailLogin" class="auth-form">
              <div class="input-group">
                <label>Email</label>
                <input
                  type="email"
                  v-model="formEmail"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div class="input-group">
                <label>Password</label>
                <input
                  type="password"
                  v-model="formPassword"
                  placeholder="********"
                  required
                  minlength="6"
                />
              </div>
              <div v-if="auth.error" class="auth-error">{{ auth.error }}</div>
              <button type="submit" class="submit-btn">
                Sign In / Sign Up
              </button>
            </form>
          </template>
          <template v-else>
            <div class="dropdown-header logged-in">
              <div class="avatar-large">
                <img v-if="auth.userAvatar" :src="auth.userAvatar" :alt="auth.userName" class="avatar-img" />
                <span v-else>{{ auth.userInitial }}</span>
              </div>
              <div class="user-info">
                <span class="user-name">{{ auth.userName }}</span>
                <span class="user-email">{{ auth.userEmail }}</span>
              </div>
            </div>
            <button class="logout-btn" @click="handleLogout">
              Sign Out
            </button>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const showDropdown = ref(false)
const formEmail = ref('')
const formPassword = ref('')

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

async function handleGoogleLogin() {
  await auth.loginWithGoogle()
  showDropdown.value = false
}

async function handleEmailLogin() {
  if (formEmail.value && formPassword.value) {
    const success = await auth.loginWithEmail(formEmail.value, formPassword.value)
    if (success) {
      formEmail.value = ''
      formPassword.value = ''
      showDropdown.value = false
    }
  }
}

function handleLogout() {
  auth.logout()
  showDropdown.value = false
}

function handleClickOutside(e) {
  if (showDropdown.value && !e.target.closest('.auth-dropdown') && !e.target.closest('.auth-trigger')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.auth-wrapper {
  display: flex;
  align-items: center;
}

.auth-trigger {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.avatar,
.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.3s;
  overflow: hidden;
}

.avatar {
  background: var(--terracotta);
  color: var(--ink);
}

.avatar-placeholder {
  background: var(--ink);
  border: 1px solid var(--moss-light);
  color: var(--paper);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-trigger:hover .avatar,
.auth-trigger:hover .avatar-placeholder {
  border-color: var(--terracotta);
  transform: scale(1.05);
}

.auth-dropdown {
  position: fixed;
  top: 60px;
  right: 30px;
  width: 320px;
  background: var(--ink);
  border: 1px solid var(--moss);
  z-index: 2000;
  overflow: hidden;
}

.dropdown-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.dropdown-header.logged-in {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

.dropdown-title {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--moss-light);
}

.avatar-large {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--terracotta);
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-size: 0.9rem;
  color: var(--paper);
  font-weight: 600;
}

.user-email {
  font-size: 0.75rem;
  color: var(--paper);
  opacity: 0.6;
  overflow: hidden;
  text-overflow: ellipsis;
}

.auth-google {
  padding: 16px 20px 8px;
}

.google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #fff;
  color: #333;
  border: none;
  padding: 10px 16px;
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
}

.google-btn:hover {
  background: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.auth-divider {
  display: flex;
  align-items: center;
  padding: 0 20px;
  margin: 8px 0;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.1);
}

.auth-divider span {
  padding: 0 12px;
  font-size: 0.7rem;
  color: var(--moss-light);
  text-transform: uppercase;
}

.auth-form {
  padding: 8px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--moss-light);
}

.input-group input {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--moss);
  color: var(--paper);
  padding: 8px 10px;
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.input-group input::placeholder {
  color: rgba(226, 222, 208, 0.3);
}

.input-group input:focus {
  outline: none;
  border-color: var(--terracotta);
  background: rgba(255,255,255,0.08);
}

.auth-error {
  font-size: 0.75rem;
  color: #ff4444;
  padding: 4px 0;
}

.submit-btn,
.logout-btn {
  background: var(--terracotta);
  border: none;
  color: var(--ink);
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn:hover,
.logout-btn:hover {
  background: var(--stencil-orange);
}

.logout-btn {
  margin: 0 20px 20px;
  width: calc(100% - 40px);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.25s ease-out;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
