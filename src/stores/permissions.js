import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const usePermissionsStore = defineStore('permissions', {
  state: () => ({
    currentProjectId: null,
    role: null,
    privacy: null
  }),

  getters: {
    canView: (state) => !!state.role || state.privacy === 'public' || state.privacy === 'link_only',
    canComment: (state) => ['owner', 'editor', 'commenter'].includes(state.role),
    canEdit: (state) => ['owner', 'editor'].includes(state.role),
    canDelete: (state) => state.role === 'owner'
  },

  actions: {
    async loadPermissions(projectId) {
      if (!isSupabaseConfigured) {
        this.role = 'owner'
        return
      }

      const auth = useAuthStore()
      this.currentProjectId = projectId

      try {
        const { data: project } = await supabase
          .from('projects')
          .select('owner_id, privacy')
          .eq('id', projectId)
          .single()

        if (!project) {
          this.role = null
          return
        }

        this.privacy = project.privacy

        if (auth.userId === project.owner_id) {
          this.role = 'owner'
          return
        }

        if (auth.isLoggedIn) {
          const { data: member } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', auth.userId)
            .single()

          this.role = member?.role || null
        } else {
          this.role = null
        }
      } catch (err) {
        console.error('[Permissions] Load failed:', err.message)
        this.role = null
      }
    }
  }
})
