import { createApp } from 'vue'
import { createPinia } from 'pinia'
import i18n from './i18n'
import './style.css'
import App from './App.vue'
import { useAuthStore } from './stores/auth'
import { useProjectsStore } from './stores/projectsStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)

// Initialize auth and load projects before mounting
// Error-safe: app always mounts, even if Supabase is unavailable
const auth = useAuthStore()
const projects = useProjectsStore()

auth.init()
  .catch(err => console.warn('[Auth] Init failed, running offline:', err.message))
  .then(() => projects.loadProjects())
  .catch(err => console.warn('[Projects] Load failed, using fallback data:', err.message))
  .then(() => {
    projects.subscribeToRealtime()
    app.mount('#app')
  })
