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

// Sync vue-i18n with i18n store after both are initialized
const i18nStore = useI18nStore()
syncI18nWithStore(i18nStore)

const auth = useAuthStore()

// Initialize auth and restore dev mode if applicable
auth.init()
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
  .catch(err => console.warn('[Auth] Init failed, running offline:', err.message))
  .finally(() => app.mount('#app'))

// Expose mock store utilities for debugging in console
if (import.meta.env.DEV) {
  window.mockData = mockStore
  console.log('[DevTools] Use window.mockData to manage mock data')
  console.log('[DevTools] Commands:')
  console.log('  window.mockData.reset() - Reset all mock data')
  console.log('  window.mockData.clear() - Clear all mock data')
}
