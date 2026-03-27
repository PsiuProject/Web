/**
 * Elements Store
 * Manages canvas elements (cards, text, images, links) and their connections
 * Supports both Supabase persistence and offline mock mode
 */
import { defineStore } from 'pinia'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuthStore } from './auth'
import { mockStore } from '../lib/mockData'
import { designTokens } from '../lib/designTokens'

export const useElementsStore = defineStore('elements', {
  state: () => ({
    elements: [],
    connections: [], // Manual connections between elements
    selectedId: null,
    selectedIds: new Set(),
    selectedConnectionId: null, // For selecting connection lines
    loading: false,
    channel: null,
    currentProjectId: null
  }),

  getters: {
    /** Get currently selected element */
    selectedElement: (state) => state.elements.find((el) => el.id === state.selectedId),

    /** Get all card elements */
    cards: (state) => state.elements.filter((el) => el.type === 'card'),

    /** Legacy connections from parent_id relationships */
    legacyConnections: (state) => {
      return state.elements
        .filter((el) => el.parent_id)
        .map((child) => {
          const parent = state.elements.find((p) => p.id === child.parent_id)
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

    /**
     * Get connection color by type from design tokens
     * @param {string} type - Connection type (subProject, dependency, related, etc.)
     * @returns {string} Hex color code
     */
    manualConnections: (state) => {
      /**
       * Get connection color helper
       * @param {string} type - Connection type
       * @returns {string} Hex color code
       */
      const getConnectionColor = (type) => {
        return designTokens.connectionColors[type] || designTokens.connectionColors.subProject
      }

      // Get available port sides based on element type
      const getElementPortSides = (element) => {
        const type = element.type
        if (type === 'text' || type === 'button' || type === 'link') {
          return ['top', 'bottom']
        }
        return ['top', 'right', 'bottom', 'left']
      }

      return state.connections
        .map((conn) => {
          // Support both property name variations
          const sourceId = conn.source_id || conn.source_element_id
          const targetId = conn.target_id || conn.target_element_id

          // Validate connection has required fields
          if (!sourceId || !targetId) {
            console.warn('[Elements] Connection missing source or target ID:', conn)
            return null
          }

          const sourceEl = state.elements.find((el) => el.id === sourceId)
          const targetEl = state.elements.find((el) => el.id === targetId)

          // Check if referenced elements exist
          if (!sourceEl) {
            console.warn('[Elements] Connection source element not found:', sourceId)
            return null
          }
          if (!targetEl) {
            console.warn('[Elements] Connection target element not found:', targetId)
            return null
          }

          // Validate element has required position/size properties
          if (
            typeof sourceEl.position_x !== 'number' ||
            typeof sourceEl.position_y !== 'number' ||
            typeof sourceEl.width !== 'number' ||
            typeof sourceEl.height !== 'number'
          ) {
            console.warn('[Elements] Source element has invalid position/size:', sourceEl)
            return null
          }
          if (
            typeof targetEl.position_x !== 'number' ||
            typeof targetEl.position_y !== 'number' ||
            typeof targetEl.width !== 'number' ||
            typeof targetEl.height !== 'number'
          ) {
            console.warn('[Elements] Target element has invalid position/size:', targetEl)
            return null
          }

          // Calculate port positions based on side - centered on edge
          const getPortPos = (el, side) => {
            switch (side) {
              case 'top':
                return { x: el.position_x + el.width / 2, y: el.position_y }
              case 'bottom':
                return { x: el.position_x + el.width / 2, y: el.position_y + el.height }
              case 'left':
                return { x: el.position_x, y: el.position_y + el.height / 2 }
              case 'right':
                return { x: el.position_x + el.width, y: el.position_y + el.height / 2 }
              default:
                return { x: el.position_x + el.width / 2, y: el.position_y }
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
        })
        .filter(Boolean)
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
        this.connections = mockStore.getConnections(projectId) || []
        return
      }

      if (!isSupabaseConfigured) return

      this.loading = true
      try {
        // Load elements and connections in parallel
        const [elementsResult, connectionsResult] = await Promise.all([
          supabase
            .from('canvas_elements')
            .select('*')
            .eq('project_id', projectId)
            .order('z_index', { ascending: true }),

          supabase.from('canvas_connections').select('*').eq('project_id', projectId)
        ])

        if (elementsResult.error) throw elementsResult.error
        this.elements = elementsResult.data || []

        if (connectionsResult.data) {
          this.connections = connectionsResult.data
        }
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
          const idx = this.elements.findIndex((el) => el.id === id)
          if (idx >= 0) {
            // Force reactivity by replacing the entire object
            this.elements[idx] = JSON.parse(JSON.stringify({ ...this.elements[idx], ...updates }))
          }
        }
        // Update connection coordinates if position or size changed
        if (
          updates.position_x !== undefined ||
          updates.position_y !== undefined ||
          updates.width !== undefined ||
          updates.height !== undefined
        ) {
          this._updateConnectionsForElement(id)
        }
        return
      }

      if (!isSupabaseConfigured) return

      try {
        const { error } = await supabase.from('canvas_elements').update(updates).eq('id', id)

        if (error) throw error

        // Update connection coordinates if position or size changed
        if (
          updates.position_x !== undefined ||
          updates.position_y !== undefined ||
          updates.width !== undefined ||
          updates.height !== undefined
        ) {
          this._updateConnectionsForElement(id)
        }

        const idx = this.elements.findIndex((el) => el.id === id)
        if (idx >= 0) {
          // Force reactivity by replacing the entire object
          this.elements[idx] = JSON.parse(JSON.stringify({ ...this.elements[idx], ...updates }))
        }
      } catch (err) {
        console.error('[Elements] Update failed:', err.message)
      }
    },

    async deleteElement(id) {
      // Use mock data in dev mode
      if (this.isOfflineDev) {
        mockStore.deleteElement(id)
        this.elements = this.elements.filter((el) => el.id !== id)
        // Delete all connections associated with this element
        this.connections = this.connections.filter((conn) => {
          const sourceId = conn.source_id || conn.source_element_id
          const targetId = conn.target_id || conn.target_element_id
          if (sourceId === id || targetId === id) {
            mockStore.deleteConnection(conn.id)
            console.log(
              '[Store] Deleting connection',
              conn.id,
              'because element',
              id,
              'was deleted'
            )
            return false
          }
          return true
        })
        if (this.selectedId === id) this.selectedId = null
        this.selectedIds.delete(id)
        if (
          this.selectedConnectionId &&
          this.connections.find((c) => c.id === this.selectedConnectionId)
        ) {
          this.selectedConnectionId = null
        }
        return
      }

      if (!isSupabaseConfigured) return

      try {
        const { error } = await supabase.from('canvas_elements').delete().eq('id', id)

        if (error) throw error

        this.elements = this.elements.filter((el) => el.id !== id)
        // Delete all connections associated with this element from Supabase
        const connectionsToDelete = this.connections.filter((conn) => {
          const sourceId = conn.source_id || conn.source_element_id
          const targetId = conn.target_id || conn.target_element_id
          return sourceId === id || targetId === id
        })

        for (const conn of connectionsToDelete) {
          await this.deleteConnection(conn.id)
        }

        if (this.selectedId === id) this.selectedId = null
        this.selectedIds.delete(id)
        if (
          this.selectedConnectionId &&
          this.connections.find((c) => c.id === this.selectedConnectionId)
        ) {
          this.selectedConnectionId = null
        }
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

    // Connection management methods with Supabase persistence
    async createConnection(connection) {
      const auth = useAuthStore()
      const conn = {
        id: 'conn-' + Date.now(),
        project_id: this.currentProjectId,
        source_element_id: connection.source_id || connection.source_element_id,
        target_element_id: connection.target_id || connection.target_element_id,
        source_side: connection.source_side,
        target_side: connection.target_side,
        connection_type: connection.connection_type || 'subProject',
        color:
          connection.color ||
          designTokens.connectionColors[connection.connection_type || 'subProject'],
        created_by: auth.userId,
        created_at: new Date().toISOString()
      }

      if (this.isOfflineDev) {
        mockStore.addConnection(conn)
        this.connections.push(conn)
        return conn
      }

      // Save to Supabase
      if (!isSupabaseConfigured) {
        this.connections.push(conn)
        return conn
      }

      try {
        const { data, error } = await supabase
          .from('canvas_connections')
          .insert(conn)
          .select()
          .single()

        if (error) throw error

        // Use the database-generated ID
        const dbConn = { ...conn, id: data.id }
        this.connections.push(dbConn)
        return dbConn
      } catch (err) {
        console.error('[Elements] Create connection failed:', err.message)
        // Fallback to local storage
        this.connections.push(conn)
        return conn
      }
    },

    async deleteConnection(id) {
      if (this.isOfflineDev) {
        mockStore.deleteConnection(id)
        this.connections = this.connections.filter((c) => c.id !== id)
        if (this.selectedConnectionId === id) this.selectedConnectionId = null
        return
      }

      // Delete from Supabase
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('canvas_connections').delete().eq('id', id)

          if (error) throw error
        } catch (err) {
          console.error('[Elements] Delete connection failed:', err.message)
        }
      }

      this.connections = this.connections.filter((c) => c.id !== id)
      if (this.selectedConnectionId === id) this.selectedConnectionId = null
    },

    async updateConnection(id, updates) {
      const idx = this.connections.findIndex((c) => c.id === id)
      if (idx >= 0) {
        this.connections[idx] = { ...this.connections[idx], ...updates }

        // Update in Supabase
        if (!this.isOfflineDev && isSupabaseConfigured) {
          try {
            await supabase.from('canvas_connections').update(updates).eq('id', id)
          } catch (err) {
            console.error('[Elements] Update connection failed:', err.message)
          }
        } else if (this.isOfflineDev) {
          // Update in mock store
          mockStore.updateConnection(id, updates)
        }
      }
    },

    // Helper to create connection between two elements with specific ports
    createManualConnection(
      sourceId,
      sourceSide,
      targetId,
      targetSide,
      type = 'subProject',
      color = designTokens.connectionColors.subProject
    ) {
      // Get element positions
      const source = this.elements.find((el) => el.id === sourceId)
      const target = this.elements.find((el) => el.id === targetId)

      if (!source || !target) return null

      // Calculate port positions based on side
      const getPortPosition = (element, side) => {
        switch (side) {
          case 'top':
            return { x: element.position_x + element.width / 2, y: element.position_y }
          case 'bottom':
            return {
              x: element.position_x + element.width / 2,
              y: element.position_y + element.height
            }
          case 'left':
            return { x: element.position_x, y: element.position_y + element.height / 2 }
          case 'right':
            return {
              x: element.position_x + element.width,
              y: element.position_y + element.height / 2
            }
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

    // Update all connections for an element when it moves
    _updateConnectionsForElement(elementId) {
      const element = this.elements.find((el) => el.id === elementId)
      if (!element) return

      // Validate element has required properties
      if (
        typeof element.position_x !== 'number' ||
        typeof element.position_y !== 'number' ||
        typeof element.width !== 'number' ||
        typeof element.height !== 'number'
      ) {
        console.warn(
          '[Elements] Cannot update connections: element has invalid position/size:',
          element
        )
        return
      }

      // Get port position helper
      const getPortPosition = (el, side) => {
        switch (side) {
          case 'top':
            return { x: el.position_x + el.width / 2, y: el.position_y }
          case 'bottom':
            return { x: el.position_x + el.width / 2, y: el.position_y + el.height }
          case 'left':
            return { x: el.position_x, y: el.position_y + el.height / 2 }
          case 'right':
            return { x: el.position_x + el.width, y: el.position_y + el.height / 2 }
          default:
            return { x: el.position_x + el.width / 2, y: el.position_y }
        }
      }

      // Update connections where this element is source or target
      this.connections.forEach((conn) => {
        let needsUpdate = false

        // Check both property name variations (source_id vs source_element_id)
        if ((conn.source_id || conn.source_element_id) === elementId && conn.source_side) {
          const pos = getPortPosition(element, conn.source_side)
          conn.x1 = pos.x
          conn.y1 = pos.y
          needsUpdate = true
        }

        // Check both property name variations (target_id vs target_element_id)
        if ((conn.target_id || conn.target_element_id) === elementId && conn.target_side) {
          const pos = getPortPosition(element, conn.target_side)
          conn.x2 = pos.x
          conn.y2 = pos.y
          needsUpdate = true
        }

        if (needsUpdate) {
          console.log(
            '[Store] Updated connection',
            conn.id,
            'for element',
            elementId,
            'new coords:',
            { x1: conn.x1, y1: conn.y1, x2: conn.x2, y2: conn.y2 }
          )
        }
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
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'canvas_elements',
            filter: `project_id=eq.${projectId}`
          },
          (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload

            if (eventType === 'INSERT') {
              const exists = this.elements.find((el) => el.id === newRecord.id)
              if (!exists) this.elements.push(newRecord)
            } else if (eventType === 'UPDATE') {
              const idx = this.elements.findIndex((el) => el.id === newRecord.id)
              if (idx >= 0) this.elements[idx] = newRecord
            } else if (eventType === 'DELETE') {
              this.elements = this.elements.filter((el) => el.id !== oldRecord.id)
            }
          }
        )
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
