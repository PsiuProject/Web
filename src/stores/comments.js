/**
 * Comments Store
 * Manages canvas comments, threads, and notifications
 * Supports both Supabase persistence and offline mock mode
 */
import { defineStore } from 'pinia'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuthStore } from './auth'
import { mockStore } from '../lib/mockData'

export const useCommentsStore = defineStore('comments', {
  state: () => ({
    comments: [],
    notifications: [],
    loading: false,
    channel: null,
    currentProjectId: null
  }),

  getters: {
    /** Get count of unread notifications */
    unreadCount: (state) => state.notifications.filter((n) => !n.read).length,

    /**
     * Optimized threadsByElement using indexing for O(n) instead of O(n²)
     * Groups comments by element_id with their replies
     */
    threadsByElement: (state) => {
      const threads = {}
      const repliesMap = {}

      // First pass: group replies by parent_comment_id
      state.comments.forEach((comment) => {
        if (comment.parent_comment_id) {
          if (!repliesMap[comment.parent_comment_id]) {
            repliesMap[comment.parent_comment_id] = []
          }
          repliesMap[comment.parent_comment_id].push(comment)
        }
      })

      // Second pass: build threads with pre-grouped replies
      state.comments.forEach((comment) => {
        if (comment.parent_comment_id) return // skip replies here
        const key = comment.element_id || 'canvas'
        if (!threads[key]) {
          threads[key] = []
        }
        threads[key].push({
          ...comment,
          replies: repliesMap[comment.id] || []
        })
      })

      return threads
    },

    // Optimized activeThreadsByElement using indexing
    activeThreadsByElement: (state) => {
      const threads = {}
      const repliesMap = {}

      // First pass: group non-deleted replies by parent_comment_id
      state.comments.forEach((comment) => {
        if (comment.parent_comment_id && !comment.deleted) {
          if (!repliesMap[comment.parent_comment_id]) {
            repliesMap[comment.parent_comment_id] = []
          }
          repliesMap[comment.parent_comment_id].push(comment)
        }
      })

      // Second pass: build active threads with pre-grouped replies
      state.comments.forEach((comment) => {
        if (comment.parent_comment_id || comment.deleted) return
        const key = comment.element_id || 'canvas'
        if (!threads[key]) {
          threads[key] = []
        }
        threads[key].push({
          ...comment,
          replies: repliesMap[comment.id] || []
        })
      })

      return threads
    },

    isOfflineDev: () => {
      const auth = useAuthStore()
      return auth.isOfflineDev
    }
  },

  actions: {
    async loadComments(projectId) {
      this.currentProjectId = projectId

      // Use mock data in dev mode
      if (this.isOfflineDev) {
        this.loading = false
        this.comments = mockStore.getComments(projectId)
        this.notifications = mockStore.getNotifications()
        return
      }

      if (!isSupabaseConfigured) return

      this.loading = true
      try {
        const { data, error } = await supabase
          .from('canvas_comments')
          .select(
            `
            *,
            user:user_id (
              id,
              email,
              raw_user_meta_data
            )
          `
          )
          .eq('project_id', projectId)
          .order('created_at', { ascending: true })

        if (error) throw error
        this.comments = data || []

        // Load notifications
        await this.loadNotifications()
      } catch (err) {
        console.error('[Comments] Load failed:', err.message)
      } finally {
        this.loading = false
      }
    },

    async loadNotifications() {
      // Use mock data in dev mode
      if (this.isOfflineDev) {
        this.notifications = mockStore.getNotifications()
        return
      }

      if (!isSupabaseConfigured) return

      const auth = useAuthStore()
      if (!auth.isLoggedIn) return

      try {
        const { data, error } = await supabase
          .from('comment_notifications')
          .select(
            `
            *,
            comment:comment_id (
              id,
              content,
              project_id
            )
          `
          )
          .eq('user_id', auth.userId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        this.notifications = data || []
      } catch (err) {
        console.error('[Comments] Load notifications failed:', err.message)
      }
    },

    async addComment(
      projectId,
      content,
      elementId = null,
      parentCommentId = null,
      attachment = null,
      replyToId = null
    ) {
      const auth = useAuthStore()
      const comment = {
        project_id: projectId,
        element_id: elementId,
        parent_comment_id: parentCommentId,
        reply_to_id: replyToId,
        user_id: auth.userId,
        content,
        attachment_type: attachment?.type || null,
        attachment_url: attachment?.url || null
      }

      // Use mock data in dev mode
      if (this.isOfflineDev) {
        const newComment = mockStore.addComment(comment)
        this.comments.push(newComment)

        // Create notification for reply
        if (parentCommentId) {
          mockStore.addNotification({
            user_id: auth.userId,
            comment_id: newComment.id,
            project_id: projectId,
            type: 'reply',
            read: false
          })
        }

        return newComment
      }

      if (!isSupabaseConfigured) return null

      try {
        const { data, error } = await supabase
          .from('canvas_comments')
          .insert(comment)
          .select(
            `
            *,
            user:user_id (
              id,
              email,
              raw_user_meta_data
            )
          `
          )
          .single()

        if (error) throw error
        this.comments.push(data)
        return data
      } catch (err) {
        console.error('[Comments] Add failed:', err.message)
        return null
      }
    },

    async resolveComment(id) {
      // Use mock data in dev mode
      if (this.isOfflineDev) {
        mockStore.updateComment(id, { resolved: true })
        const comment = this.comments.find((c) => c.id === id)
        if (comment) comment.resolved = true
        return
      }

      if (!isSupabaseConfigured) return

      try {
        const { error } = await supabase
          .from('canvas_comments')
          .update({ resolved: true })
          .eq('id', id)

        if (error) throw error

        const comment = this.comments.find((c) => c.id === id)
        if (comment) comment.resolved = true
      } catch (err) {
        console.error('[Comments] Resolve failed:', err.message)
      }
    },

    async deleteComment(id) {
      // Use mock data in dev mode
      if (this.isOfflineDev) {
        mockStore.deleteComment(id)
        this.comments = this.comments.filter((c) => c.id !== id && c.parent_comment_id !== id)
        return
      }

      if (!isSupabaseConfigured) return

      try {
        // Soft-delete: mark as deleted but keep in DB
        const { error } = await supabase
          .from('canvas_comments')
          .update({ deleted: true })
          .eq('id', id)

        if (error) throw error

        const comment = this.comments.find((c) => c.id === id)
        if (comment) comment.deleted = true
      } catch (err) {
        console.error('[Comments] Delete failed:', err.message)
      }
    },

    async markAsRead(notificationId) {
      // Use mock data in dev mode
      if (this.isOfflineDev) {
        mockStore.markNotificationRead(notificationId)
        const notif = this.notifications.find((n) => n.id === notificationId)
        if (notif) notif.read = true
        return
      }

      if (!isSupabaseConfigured) return

      try {
        const { error } = await supabase
          .from('comment_notifications')
          .update({ read: true })
          .eq('id', notificationId)

        if (error) throw error

        const notif = this.notifications.find((n) => n.id === notificationId)
        if (notif) notif.read = true
      } catch (err) {
        console.error('[Comments] Mark read failed:', err.message)
      }
    },

    subscribeToRealtime(projectId) {
      // No realtime in offline dev mode
      if (this.isOfflineDev) return

      if (!isSupabaseConfigured || !supabase) return

      this.channel = supabase
        .channel(`canvas-comments-${projectId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'canvas_comments',
            filter: `project_id=eq.${projectId}`
          },
          (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload

            if (eventType === 'INSERT') {
              this.comments.push(newRecord)
            } else if (eventType === 'UPDATE') {
              const idx = this.comments.findIndex((c) => c.id === newRecord.id)
              if (idx >= 0) this.comments[idx] = newRecord
            } else if (eventType === 'DELETE') {
              this.comments = this.comments.filter((c) => c.id !== oldRecord.id)
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
