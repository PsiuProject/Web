import { defineStore } from 'pinia'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuthStore } from './auth'
import { mockStore } from '../lib/mockData'

export const useElementsStore = defineStore('elements', {
  state: () => ({
    elements: [],
    connections: [],  // Manual connections between elements
    selectedId: null,
    selectedIds: new Set(),
    selectedConnectionId: null,  // For selecting connection lines
    loading: false,
    channel: null,
    currentProjectId: null
  }),

  getters: {
    selectedElement: (state) => state.elements.find(el => el.id === state.selectedId),
    
    cards: (state) => state.elements.filter(el => el.type === 'card'),
    
    // Legacy connections from parent_id relationships
    legacyConnections: (state) => {
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

    // Manual connections with full endpoint control
    // Connection type to color mapping
    getConnectionColor(type) {
      const colorMap = {
        'subProject': '#b55d3a',  // Terracotta
        'dependency': '#3b82f6',   // Blue
        'related': '#10b981',      // Green
        'reference': '#8b5cf6',    // Purple
        'parent': '#f59e0b',       // Amber
        'child': '#ec4899',        // Pink
        'link': '#6b7280'          // Gray
      }
      return colorMap[type] || '#b55d3a'
    },

    manualConnections: (state) => {
      const getConnectionColor = (type) => {
        const colorMap = {
          'subProject': '#b55d3a',
          'dependency': '#3b82f6',
          'related': '#10b981',
          'reference': '#8b5cf6',
          'parent': '#f59e0b',
          'child': '#ec4899',
          'link': '#6b7280'
        }
        return colorMap[type] || '#b55d3a'
      }
      
      // Get available port sides based on element type
      const getElementPortSides = (element) => {
        const type = element.type
        if (type === 'text' || type === 'button' || type === 'link') {
          return ['top', 'bottom']
        }
        return ['top', 'right', 'bottom', 'left']
      }
      
      return state.connections.map(conn => {
        const sourceEl = state.elements.find(el => el.id === conn.source_element_id)
        const targetEl = state.elements.find(el => el.id === conn.target_element_id)
        if (!sourceEl || !targetEl) return null
        
        // Calculate port positions based on side - centered on edge
        const getPortPos = (el, side) => {
          switch(side) {
            case 'top': return { x: el.position_x + el.width / 2, y: el.position_y }
            case 'bottom': return { x: el.position_x + el.width / 2, y: el.position_y + el.height }
            case 'left': return { x: el.position_x, y: el.position_y + el.height / 2 }
            case 'right': return { x: el.position_x + el.width, y: el.position_y + el.height / 2 }
            default: return { x: el.position_x + el.width / 2, y: el.position_y }
          }
        }
        
        // Validate that the sides are available for this element type
        const sourceSides = getElementPortSides(sourceEl)
        const targetSides = getElementPortSides(targetEl)
        
        const sourceSide = sourceSides.includes(conn.source_side) ? conn.source_side : 'bottom'
        const targetSide = targetSides.includes(conn.target_side) ? conn.target_side : 'top'
        
        const start = getPortPos(sourceEl, sourceSide)
        const end = getPortPos(targetEl, targetSide)
        
        return {
          ...conn,
          x1: start.x,
          y1: start.y,
          x2: end.x,
          y2: end.y,
          color: conn.color || getConnectionColor(conn.connection_type),
          sourceElement: sourceEl,
          targetElement: targetEl
        }
      }).filter(Boolean)
    },
    
    // Combined connections for rendering
    allConnections: (state, getters) => [
      ...getters.legacyConnections,
      ...getters.manualConnections
    ],

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
      this.selectedConnectionId = null
    },

    // Connection management methods
    createConnection(connection) {
      const conn = {
        id: 'conn-' + Date.now(),
        ...connection,
        created_at: new Date().toISOString()
      }
      
      if (this.isOfflineDev) {
        this.connections.push(conn)
        return conn
      }
      
      // TODO: Add Supabase persistence for connections
      this.connections.push(conn)
      return conn
    },

    deleteConnection(id) {
      if (this.isOfflineDev) {
        this.connections = this.connections.filter(c => c.id !== id)
        if (this.selectedConnectionId === id) this.selectedConnectionId = null
        return
      }
      
      // TODO: Add Supabase deletion for connections
      this.connections = this.connections.filter(c => c.id !== id)
      if (this.selectedConnectionId === id) this.selectedConnectionId = null
    },

    updateConnection(id, updates) {
      const idx = this.connections.findIndex(c => c.id === id)
      if (idx >= 0) {
        this.connections[idx] = { ...this.connections[idx], ...updates }
      }
    },

    // Helper to create connection between two elements with specific ports
    createManualConnection(sourceId, sourceSide, targetId, targetSide, type = 'subProject', color = '#b55d3a') {
      // Get element positions
      const source = this.elements.find(el => el.id === sourceId)
      const target = this.elements.find(el => el.id === targetId)
      
      if (!source || !target) return null
      
      // Calculate port positions based on side
      const getPortPosition = (element, side) => {
        switch(side) {
          case 'top':
            return { x: element.position_x + element.width / 2, y: element.position_y }
          case 'bottom':
            return { x: element.position_x + element.width / 2, y: element.position_y + element.height }
          case 'left':
            return { x: element.position_x, y: element.position_y + element.height / 2 }
          case 'right':
            return { x: element.position_x + element.width, y: element.position_y + element.height / 2 }
          default:
            return { x: element.position_x + element.width / 2, y: element.position_y }
        }
      }
      
      const sourcePos = getPortPosition(source, sourceSide)
      const targetPos = getPortPosition(target, targetSide)
      
      return this.createConnection({
        source_id: sourceId,
        source_side: sourceSide,
        target_id: targetId,
        target_side: targetSide,
        x1: sourcePos.x,
        y1: sourcePos.y,
        x2: targetPos.x,
        y2: targetPos.y,
        connection_type: type,
        color: color
      })
    },

    selectConnection(id) {
      this.selectedConnectionId = id
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
