// Realtime presence store - tracks active collaborators and syncs state
import { defineStore } from 'pinia'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const useRealtimeStore = defineStore('realtime', {
  state: () => ({
    presenceChannel: null,
    activeUsers: [], // Users currently viewing the same project/canvas
    editingFields: {}, // { fieldKey: { userId, userName, timestamp } }
    dragPositions: {}, // { projectId: { userId, x, y } }
    connected: false
  }),

  getters: {
    otherUsers: (state) => {
      return state.activeUsers
    },

    isFieldBeingEdited: (state) => (fieldKey) => {
      return state.editingFields[fieldKey] || null
    },

    getDragPosition: (state) => (projectId, userId) => {
      return state.dragPositions[`${projectId}-${userId}`] || null
    }
  },

  actions: {
    // Join a realtime presence channel for a project or canvas
    async joinChannel(channelName, userInfo) {
      if (!isSupabaseConfigured || !supabase) return

      this.leaveChannel()

      this.presenceChannel = supabase.channel(channelName, {
        config: {
          presence: { key: userInfo.id }
        }
      })

      // Track presence
      this.presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = this.presenceChannel.presenceState()
          this.activeUsers = Object.values(state)
            .flat()
            .filter((u) => u.id !== userInfo.id)
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          // User joined
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          // Clean up editing locks from departed users
          leftPresences.forEach((u) => {
            Object.keys(this.editingFields).forEach((key) => {
              if (this.editingFields[key]?.userId === u.id) {
                delete this.editingFields[key]
              }
            })
          })
        })

      // Listen for field editing broadcasts
      this.presenceChannel.on('broadcast', { event: 'field_editing' }, ({ payload }) => {
        if (payload.userId !== userInfo.id) {
          if (payload.editing) {
            this.editingFields[payload.fieldKey] = {
              userId: payload.userId,
              userName: payload.userName,
              timestamp: Date.now()
            }
          } else {
            delete this.editingFields[payload.fieldKey]
          }
        }
      })

      // Listen for drag position broadcasts
      this.presenceChannel.on('broadcast', { event: 'drag_position' }, ({ payload }) => {
        if (payload.userId !== userInfo.id) {
          this.dragPositions[`${payload.projectId}-${payload.userId}`] = {
            x: payload.x,
            y: payload.y,
            userName: payload.userName
          }
        }
      })

      await this.presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.connected = true
          await this.presenceChannel.track({
            id: userInfo.id,
            name: userInfo.name,
            avatar: userInfo.avatar,
            online_at: new Date().toISOString()
          })
        }
      })
    },

    // Broadcast that user is editing a field
    broadcastFieldEditing(fieldKey, userId, userName, editing = true) {
      if (!this.presenceChannel || !supabase) return
      this.presenceChannel.send({
        type: 'broadcast',
        event: 'field_editing',
        payload: { fieldKey, userId, userName, editing }
      })
    },

    // Broadcast drag position
    broadcastDragPosition(projectId, userId, userName, x, y) {
      if (!this.presenceChannel || !supabase) return
      this.presenceChannel.send({
        type: 'broadcast',
        event: 'drag_position',
        payload: { projectId, userId, userName, x, y }
      })
    },

    // Leave the current channel
    leaveChannel() {
      if (this.presenceChannel && supabase) {
        supabase.removeChannel(this.presenceChannel)
      }
      this.presenceChannel = null
      this.activeUsers = []
      this.editingFields = {}
      this.dragPositions = {}
      this.connected = false
    }
  }
})
