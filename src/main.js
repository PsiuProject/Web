import { createApp } from 'vue'
import { createPinia } from 'pinia'
import i18n, { syncI18nWithStore } from './i18n'
import router from './router'
import './style.css'
import App from './App.vue'
import { useAuthStore, TEST_PROJECT } from './stores/auth'
import { useI18nStore } from './stores/i18n-store'
import { mockStore } from './lib/mockData'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

// Global error handler - prevents app crashes from bringing down entire app
app.config.errorHandler = (err, instance, info) => {
  // Log error with context
  console.error('[Global Error Handler]', err)
  console.error('Component:', instance?.$options?.name || 'Unknown')
  console.error('Info:', info)

  // In production, show user-friendly error toast
  if (import.meta.env.PROD) {
    // Could integrate with a toast library here
    const errorMsg = err.message || 'An unexpected error occurred'

    // Create a simple error notification
    const notification = document.createElement('div')
    notification.className = 'error-notification'
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee;
      border: 1px solid #f99;
      border-radius: 4px;
      padding: 12px 16px;
      z-index: 9999;
      color: #c00;
      font-family: sans-serif;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `
    notification.textContent = `Error: ${errorMsg}`
    document.body.appendChild(notification)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove()
    }, 5000)
  }
}

// Sync vue-i18n with i18n store after both are initialized
const i18nStore = useI18nStore()
syncI18nWithStore(i18nStore)

const auth = useAuthStore()

// Initialize auth and restore dev mode if applicable
auth
  .init()
  .then(() => {
    // Check for dev mode and restore mock auth
    if (auth.checkDevMode()) {
      const restored = auth.restoreDevAuth()
      if (restored) {
        console.log('[Main] Restored dev auth from localStorage')

        // Initialize mock data stores only if empty
        const existingProjects = mockStore.getProjects()
        if (existingProjects.length === 0) {
          mockStore.reset()
          console.log('[Main] Initialized mock data stores')
        } else {
          console.log('[Main] Using existing mock data')
        }
      }
    }
  })
  .catch((err) => console.warn('[Auth] Init failed, running offline:', err.message))
  .finally(() => app.mount('#app'))

// Expose mock store utilities for debugging in console (DEV ONLY - prevents data leakage)
if (import.meta.env.DEV) {
  window.mockData = mockStore
  console.log('[DevTools] Use window.mockData to manage mock data')
  console.log('[DevTools] Commands:')
  console.log('  window.mockData.reset() - Reset all mock data')
  console.log('  window.mockData.clear() - Clear all mock data')
} else {
  // Ensure mockData is not exposed in production
  window.mockData = undefined
}
