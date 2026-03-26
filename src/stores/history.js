import { defineStore } from 'pinia'
import { useElementsStore } from './elements'

export const useHistoryStore = defineStore('history', {
  state: () => ({
    undoStack: [],
    redoStack: [],
    maxSize: 50
  }),

  getters: {
    canUndo: (state) => state.undoStack.length > 0,
    canRedo: (state) => state.redoStack.length > 0
  },

  actions: {
    push(entry) {
      this.undoStack.push(entry)
      if (this.undoStack.length > this.maxSize) {
        this.undoStack.shift()
      }
      // Clear redo stack on new action
      this.redoStack = []
    },

    async undo() {
      if (!this.canUndo) return

      const entry = this.undoStack.pop()
      const elements = useElementsStore()

      if (entry.action === 'create') {
        // Undo create = delete
        const el = elements.elements.find(e => e.id === entry.elementId)
        if (el) {
          this.redoStack.push({ action: 'delete', elementId: entry.elementId, state: { ...el } })
          await elements.deleteElement(entry.elementId)
        }
      } else if (entry.action === 'delete') {
        // Undo delete = recreate
        const el = entry.state
        if (el) {
          this.redoStack.push({ action: 'create', elementId: el.id, state: { ...el } })
          await elements.createElement(el.project_id, el.type, {
            x: el.position_x,
            y: el.position_y
          }, { width: el.width, height: el.height })
        }
      } else if (entry.action === 'update') {
        // Undo update = restore previous state
        const el = elements.elements.find(e => e.id === entry.elementId)
        if (el) {
          // Save current state for redo
          const currentState = {}
          for (const key of Object.keys(entry.state)) {
            currentState[key] = el[key]
          }
          this.redoStack.push({ action: 'update', elementId: entry.elementId, state: currentState })
          await elements.updateElement(entry.elementId, entry.state)
        }
      }
    },

    async redo() {
      if (!this.canRedo) return

      const entry = this.redoStack.pop()
      const elements = useElementsStore()

      if (entry.action === 'create') {
        // Redo create = delete again
        const el = elements.elements.find(e => e.id === entry.elementId)
        if (el) {
          this.undoStack.push({ action: 'delete', elementId: entry.elementId, state: { ...el } })
          await elements.deleteElement(entry.elementId)
        }
      } else if (entry.action === 'delete') {
        // Redo delete = recreate
        const el = entry.state
        if (el) {
          this.undoStack.push({ action: 'create', elementId: el.id, state: { ...el } })
          await elements.createElement(el.project_id, el.type, {
            x: el.position_x,
            y: el.position_y
          }, { width: el.width, height: el.height })
        }
      } else if (entry.action === 'update') {
        const el = elements.elements.find(e => e.id === entry.elementId)
        if (el) {
          const currentState = {}
          for (const key of Object.keys(entry.state)) {
            currentState[key] = el[key]
          }
          this.undoStack.push({ action: 'update', elementId: entry.elementId, state: currentState })
          await elements.updateElement(entry.elementId, entry.state)
        }
      }
    },

    clear() {
      this.undoStack = []
      this.redoStack = []
    }
  }
})
