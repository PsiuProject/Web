// Projects store - Supabase-backed project CRUD with realtime
// Replaces hardcoded data with live database queries
import { defineStore } from 'pinia'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { projectsData as fallbackData } from './data/projects'
import { useAuthStore } from './auth'
import { mockStore } from '../lib/mockData'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    loading: false,
    error: null,
    realtimeChannel: null,
    // Track whether we've loaded from Supabase
    isSupabaseLoaded: false
  }),

  getters: {
    getProject: (state) => (id) => state.projects.find(p => p.id === id),

    rootProjects: (state) => state.projects.filter(p => !p.parent_id),

    getChildren: (state) => (parentId) =>
      state.projects.filter(p => p.parent_id === parentId),

    getChildCount: (state) => (projectId) =>
      state.projects.filter(p => p.parent_id === projectId).length,

    projectsByStatus: (state) => (status) =>
      state.projects.filter(p => p.status === status),

    // Convert Supabase format to the format the gallery expects
    galleryProjects: (state) => {
      console.log('[Projects Store] galleryProjects getter called')
      console.log('[Projects Store] state.projects count:', state.projects.length)
      console.log('[Projects Store] state.projects:', state.projects.map(p => ({ 
        id: p.id, 
        title: p.title, 
        status: p.status,
        owner_id: p.owner_id,
        parent_id: p.parent_id 
      })))
      
      const result = state.projects.map(p => ({
        id: p.id,
        type: p.status,
        size: p.size || 'card-md',
        year: p.year,
        statusTagKey: p.status_tag || `status.${p.status}`,
        titleKey: p.title,        // JSONB {pt,en} or legacy string
        descriptionKey: p.description,
        territory: p.territory || 'Brasil',
        axis: p.axis || [],
        category: p.category,
        kpiLabelKey: p.kpi_label,
        kpiValue: p.kpi_value,
        kpiDetail: p.kpi_detail,
        meta: p.meta || [],
        links: p.links || [],
        parentId: p.parent_id,
        connectionTypeKey: p.connection_type,
        privacy: p.privacy || 'private',
        share_slug: p.share_slug || null,
        owner_id: p.owner_id,
        position_x: p.position_x || 0,
        position_y: p.position_y || 0,
        _raw: p
      }))
      
      console.log('[Projects Store] galleryProjects result count:', result.length)
      console.log('[Projects Store] galleryProjects:', result.map(p => ({ 
        id: p.id, 
        title: p.titleKey, 
        type: p.type,
        owner_id: p.owner_id,
        parentId: p.parentId 
      })))
      
      return result
    },

    isOfflineDev: () => {
      const auth = useAuthStore()
      return auth.isOfflineDev
    }
  },

  actions: {
    // Load projects from Supabase, fallback to hardcoded data
    async loadProjects() {
      this.loading = true
      this.error = null

      console.log('[Projects] loadProjects called')
      console.log('[Projects] isOfflineDev:', this.isOfflineDev)
      console.log('[Projects] isSupabaseConfigured:', isSupabaseConfigured)
      console.log('[Projects] Current projects count:', this.projects.length)

      // Use mock data in dev mode
      if (this.isOfflineDev) {
        const mockProjects = mockStore.getProjects()
        console.log('[Projects] Loading mock projects:', mockProjects.length)
        console.log('[Projects] Mock projects:', mockProjects.map(p => ({ id: p.id, title: p.title, owner_id: p.owner_id })))
        this.projects = mockProjects
        this.isSupabaseLoaded = true
        this.loading = false
        console.log('[Projects] Loaded mock projects for offline testing')
        return
      }

      if (!isSupabaseConfigured) {
        console.log('[Projects] Supabase not configured, using fallback')
        this.useFallbackData()
        this.loading = false
        return
      }

      try {
        console.log('[Projects] Fetching from Supabase...')
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: true })

        if (error) {
          console.error('[Projects] Supabase error:', error)
          throw error
        }

        console.log('[Projects] Supabase returned:', data?.length || 0, 'projects')
        console.log('[Projects] Supabase data:', data?.map(p => ({ id: p.id, title: p.title, status: p.status, owner_id: p.owner_id })))
        
        if (data && data.length > 0) {
          this.projects = data
          this.isSupabaseLoaded = true
          console.log(`[Projects] Loaded ${data.length} project(s) from Supabase`)
        } else {
          // Database is empty - don't use fallback, start fresh
          this.projects = []
          this.isSupabaseLoaded = true
          console.log('[Projects] Database is empty - ready for new projects')
        }
      } catch (err) {
        console.warn('[Projects] Supabase load failed, using fallback data:', err.message)
        this.useFallbackData()
      }

      this.loading = false
    },

    // Use hardcoded data as fallback
    useFallbackData() {
      this.projects = fallbackData.map(p => ({
        id: p.id,
        title: p.titleKey,        // i18n key string — displayText handles it
        description: p.descriptionKey,
        status: p.type,
        status_tag: p.statusTagKey,
        privacy: 'public',
        size: p.size,
        territory: p.territory,
        axis: p.axis,
        category: p.category,
        year: p.year,
        kpi_label: p.kpiLabelKey,
        kpi_value: p.kpiValue,
        kpi_detail: p.kpiDetail,
        meta: p.meta,
        links: p.links,
        parent_id: p.parentId,
        connection_type: p.connectionTypeKey,
        position_x: p.position_x || 0,
        position_y: p.position_y || 0
      }))
      this.isSupabaseLoaded = true
      this.loading = false
    },

    // Create a new project
    async createProject(projectData) {
      const auth = useAuthStore()

      // Use mock data in dev mode
      if (this.isOfflineDev) {
        const newProject = {
          id: 'test-project-' + Date.now(),
          ...projectData,
          owner_id: auth.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        const projects = mockStore.getProjects()
        projects.push(newProject)
        mockStore.saveProjects(projects)
        this.projects.push(newProject)
        return newProject
      }

      if (!isSupabaseConfigured) return null

      try {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            ...projectData,
            owner_id: auth.userId
          })
          .select()
          .single()

        if (error) throw error
        this.projects.push(data)
        return data
      } catch (err) {
        console.error('[Projects] Create error:', err.message)
        return null
      }
    },

    // Update an existing project
    async updateProject(id, updates) {
      // Use mock data in dev mode
      if (this.isOfflineDev) {
        const projects = mockStore.getProjects()
        const idx = projects.findIndex(p => p.id === id)
        if (idx >= 0) {
          projects[idx] = { ...projects[idx], ...updates, updated_at: new Date().toISOString() }
          mockStore.saveProjects(projects)
          const localIdx = this.projects.findIndex(p => p.id === id)
          if (localIdx >= 0) {
            this.projects[localIdx] = { ...this.projects[localIdx], ...updates }
          }
        }
        return
      }

      if (!isSupabaseConfigured) return

      try {
        const { error } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', id)

        if (error) throw error

        const idx = this.projects.findIndex(p => p.id === id)
        if (idx >= 0) {
          this.projects[idx] = { ...this.projects[idx], ...updates }
        }
      } catch (err) {
        console.error('[Projects] Update error:', err.message)
      }
    },

    // Subscribe to realtime changes
    subscribeToRealtime() {
      // No realtime in offline dev mode
      if (this.isOfflineDev) return

      if (!isSupabaseConfigured || !supabase) return

      this.realtimeChannel = supabase
        .channel('projects')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'projects'
        }, (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload

          if (eventType === 'INSERT') {
            this.projects.push(newRecord)
          } else if (eventType === 'UPDATE') {
            const idx = this.projects.findIndex(p => p.id === newRecord.id)
            if (idx >= 0) this.projects[idx] = newRecord
          } else if (eventType === 'DELETE') {
            this.projects = this.projects.filter(p => p.id !== oldRecord.id)
          }
        })
        .subscribe()
    },

    // Unsubscribe from realtime
    unsubscribeFromRealtime() {
      if (this.realtimeChannel) {
        supabase.removeChannel(this.realtimeChannel)
        this.realtimeChannel = null
      }
    }
  }
})
