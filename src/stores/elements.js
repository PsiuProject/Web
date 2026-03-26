import { defineStore } from 'pinia'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuthStore } from './auth'
import { mockStore } from '../lib/mockData'

export const useElementsStore = defineStore('elements', {
  state: () => ({
    elements: [],
    selectedId: null,
    selectedIds: new Set(),
    loading: false,
    channel: null,
    currentProjectId: null
  }),

  getters: {
    selectedElement: (state) => state.elements.find(el => el.id === state.selectedId),
    
    cards: (state) => state.elements.filter(el => el.type === 'card'),
    
    connections: (state) => {
      return state.elements
        .filter(el => el.parent_id)
        .map(child => {
          const parent = state.elements.find(p => p.id === child.parent_id)
          if (!parent) return null
          
          return {
            id: child.id,
            parentId: child.parent_id,
            type: child.connection_type || 'default',
            x1: parent.position_x + parent.width / 2,
            y1: parent.position_y + parent.height,
            x2: child.position_x + child.width / 2,
            y2: child.position_y
          }
        })
        .filter(Boolean)
    },

    isOfflineDev: () => {
      const auth = useAuthStore()
      return auth.isOfflineDev
    }
  },

  actions: {
    async loadElements(projectId) {
      this.currentProjectId = projectId
      
      // Use mock data in dev mode
      if (this.isOfflineDev) {
        this.loading = false
        this.elements = mockStore.getElements(projectId)
        return
      }

      if (!isSupabaseConfigured) return
      
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('canvas_elements')
          .select('*')
          .eq('project_id', projectId)
          .order('z_index', { ascending: true })

        if (error) throw error
        this.elements = data || []
      } catch (err) {
        console.error('[Elements] Load failed:', err.message)
      } finally {
        this.loading = false
      }
    },

    async createElement(projectId, type, position, size = {}) {
      const auth = useAuthStore()
      const element = {
        project_id: projectId,
        type,
        position_x: position.x || 0,
        position_y: position.y || 0,
        width: size.width || (type === 'card' ? 280 : 200),
        height: size.height || (type === 'card' ? 370 : 150),
        content: {},
        created_by: auth.userId,
        rotation: 0,
        z_index: this.elements.length + 1,
        style: {}
      }

      // Use mock data in dev mode
      if (this.isOfflineDev) {
        element.id = 'elem-' + type + '-' + Date.now()
        element.created_at = new Date().toISOString()
        element.updated_at = new Date().toISOString()
        mockStore.addElement(element)
        this.elements.push(element)
        return element
      }

      if (!isSupabaseConfigured) return null

      try {
        const { data, error } = await supabase
          .from('canvas_elements')
          .insert(element)
          .select()
          .single()

        if (error) throw error
        this.elements.push(data)
        return data
      } catch (err) {
        console.error('[Elements] Create failed:', err.message)
        return null
      }
    },

    async updateElement(id, updates) {
      // Use mock data in dev mode
      if (this.isOfflineDev) {
        const updated = mockStore.updateElement(id, updates)
        if (updated) {
          const idx = this.elements.findIndex(el => el.id === id)
          if (idx >= 0) {
            this.elements[idx] = { ...this.elements[idx], ...updates }
          }
        }
        return
      }

      if (!isSupabaseConfigured) return

      try {
        const { error } = await supabase
          .from('canvas_elements')
          .update(updates)
          .eq('id', id)

        if (error) throw error

        const idx = this.elements.findIndex(el => el.id === id)
        if (idx >= 0) {
          this.elements[idx] = { ...this.elements[idx], ...updates }
        }
      } catch (err) {
        console.error('[Elements] Update failed:', err.message)
      }
    },

    async deleteElement(id) {
      // Use mock data in dev mode
      if (this.isOfflineDev) {
        mockStore.deleteElement(id)
        this.elements = this.elements.filter(el => el.id !== id)
        if (this.selectedId === id) this.selectedId = null
        this.selectedIds.delete(id)
        return
      }

      if (!isSupabaseConfigured) return

      try {
        const { error } = await supabase
          .from('canvas_elements')
          .delete()
          .eq('id', id)

        if (error) throw error

        this.elements = this.elements.filter(el => el.id !== id)
        if (this.selectedId === id) this.selectedId = null
        this.selectedIds.delete(id)
      } catch (err) {
        console.error('[Elements] Delete failed:', err.message)
      }
    },

    selectElement(id) {
      this.selectedId = id
    },

    toggleMultiSelect(id) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id)
      } else {
        this.selectedIds.add(id)
      }
    },

    clearSelection() {
      this.selectedId = null
      this.selectedIds.clear()
    },

    subscribeToRealtime(projectId) {
      // No realtime in offline dev mode
      if (this.isOfflineDev) return

      if (!isSupabaseConfigured || !supabase) return

      this.channel = supabase
        .channel(`canvas-elements-${projectId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'canvas_elements',
          filter: `project_id=eq.${projectId}`
        }, (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload

          if (eventType === 'INSERT') {
            const exists = this.elements.find(el => el.id === newRecord.id)
            if (!exists) this.elements.push(newRecord)
          } else if (eventType === 'UPDATE') {
            const idx = this.elements.findIndex(el => el.id === newRecord.id)
            if (idx >= 0) this.elements[idx] = newRecord
          } else if (eventType === 'DELETE') {
            this.elements = this.elements.filter(el => el.id !== oldRecord.id)
          }
        })
        .subscribe()
    },

    unsubscribe() {
      if (this.channel) {
        supabase.removeChannel(this.channel)
        this.channel = null
      }
    }
  }
})
