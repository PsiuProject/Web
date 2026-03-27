// Auth store - Supabase Google authentication
// Handles login, logout, session persistence, and user state
import { defineStore } from 'pinia'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Mock user for dev/localhost testing
const MOCK_USER = {
  id: 'dev-user-123',
  email: 'dev@example.com',
  user_metadata: {
    full_name: 'Dev User',
    avatar_url: null
  }
}

// Test project for offline testing
export const TEST_PROJECT = {
  id: 'test-project-1',
  owner_id: 'dev-user-123',
  title: { pt: 'Projeto Teste', en: 'Test Project' },
  description: {
    pt: 'Projeto de teste para desenvolvimento offline',
    en: 'Offline development test project'
  },
  status: 'active',
  privacy: 'private',
  size: 'card-md',
  territory: 'Brasil',
  axis: ['Inovação', 'Sustentabilidade'],
  category: 'test',
  year: 2026,
  position_x: 100,
  position_y: 150,
  kpi_label: { pt: 'Impacto', en: 'Impact' },
  kpi_value: '85%',
  kpi_detail: { pt: 'Alto', en: 'High' },
  meta: [
    { labelKey: 'meta.budget', value: 'R$ 500k' },
    { labelKey: 'meta.team', value: '8 pessoas' }
  ],
  links: [{ url: 'https://example.com', type: 'website' }],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    loading: true,
    error: null,
    _authSubscription: null,
    isDevMode: false
  }),

  getters: {
    isLoggedIn: (state) => {
      console.log('[Auth] isLoggedIn getter:', !!state.user)
      return !!state.user
    },
    userId: (state) => {
      console.log('[Auth] userId getter:', state.user?.id || null)
      return state.user?.id || null
    },
    userEmail: (state) => state.user?.email || '',
    userAvatar: (state) => state.user?.user_metadata?.avatar_url || null,
    userName: (state) => {
      const meta = state.user?.user_metadata
      return meta?.full_name || meta?.name || state.user?.email?.split('@')[0] || ''
    },
    userInitial: (state) => {
      const name = state.user?.user_metadata?.full_name || state.user?.email || ''
      return name.charAt(0).toUpperCase()
    },
    isOfflineDev: (state) => {
      console.log('[Auth] isOfflineDev getter:', state.isDevMode && !isSupabaseConfigured)
      return state.isDevMode && !isSupabaseConfigured
    }
  },

  actions: {
    // Check if running in dev mode
    checkDevMode() {
      this.isDevMode = import.meta.env.DEV || window.location.hostname === 'localhost'
      return this.isDevMode
    },

    // Initialize auth listener - call once on app mount
    async init() {
      this.checkDevMode()

      if (!supabase) {
        this.loading = false
        return
      }

      // Clean up previous subscription if re-initialized (HMR)
      if (this._authSubscription) {
        this._authSubscription.unsubscribe()
        this._authSubscription = null
      }

      this.loading = true

      // Get initial session
      const {
        data: { session }
      } = await supabase.auth.getSession()
      this.session = session
      this.user = session?.user || null

      // Listen for auth changes
      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user || null
        this.loading = false
      })
      this._authSubscription = subscription

      this.loading = false
    },

    // Google OAuth login (or mock in dev mode)
    async loginWithGoogle() {
      // Dev mode: mock login for offline testing
      if (this.isDevMode && (!isSupabaseConfigured || !supabase)) {
        console.log('[Auth] Dev mode: using mock authentication')
        this.user = MOCK_USER
        this.session = {
          user: MOCK_USER,
          access_token: 'dev-token',
          refresh_token: 'dev-refresh'
        }
        this.loading = false
        this.error = null

        // Store in localStorage for persistence during dev
        localStorage.setItem(
          'dev-auth',
          JSON.stringify({
            user: MOCK_USER,
            timestamp: Date.now()
          })
        )

        return true
      }

      // Production: real Supabase OAuth
      if (!supabase) {
        this.error = 'Supabase not configured'
        return false
      }

      this.error = null
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + (import.meta.env.BASE_URL || '/')
        }
      })

      if (error) {
        this.error = error.message
        console.error('[Auth] Google login error:', error.message)
        return false
      }

      return true
    },

    // Email/password login (removed - Google OAuth only)
    async loginWithEmail(email, password) {
      this.error = 'Email/password login is disabled. Please use Google OAuth.'
      console.warn('[Auth] Email/password login attempted but disabled')
      return false
    },

    // Email/password signup (removed - Google OAuth only)
    async signUpWithEmail(email, password) {
      this.error = 'Email/password signup is disabled. Please use Google OAuth.'
      console.warn('[Auth] Email/password signup attempted but disabled')
      return false
    },

    // Logout
    async logout() {
      // Clear dev mode auth
      if (this.isDevMode) {
        localStorage.removeItem('dev-auth')
      }

      if (!supabase) {
        this.user = null
        this.session = null
        return
      }

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('[Auth] Logout error:', error.message)
      }
      this.user = null
      this.session = null
    },

    // Restore dev mode auth from localStorage
    restoreDevAuth() {
      if (!this.isDevMode) return false

      const stored = localStorage.getItem('dev-auth')
      if (stored) {
        try {
          const { user, timestamp } = JSON.parse(stored)
          // Valid for 24 hours
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            this.user = user
            this.session = { user, access_token: 'dev-token', refresh_token: 'dev-refresh' }
            return true
          } else {
            localStorage.removeItem('dev-auth')
          }
        } catch (e) {
          localStorage.removeItem('dev-auth')
        }
      }
      return false
    }
  }
})
