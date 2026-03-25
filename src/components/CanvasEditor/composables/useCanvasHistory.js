// Composable for undo/redo history management
import { ref } from 'vue'

const MAX_HISTORY = 50

export function useCanvasHistory(elements, saveCallback) {
  const history = ref([])
  const historyIndex = ref(-1)
  
  function addToHistory(action, elementId, previousState, newState) {
    // Remove any future history if we're not at the end
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    
    const historyEntry = {
      action,
      elementId,
      previousState: JSON.parse(JSON.stringify(previousState)), // Deep clone
      newState: JSON.parse(JSON.stringify(newState)),
      timestamp: Date.now()
    }
    
    history.value.push(historyEntry)
    
    // Limit history size
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
    
    console.log(`[useCanvasHistory] History: ${action} added (${history.value.length}/${MAX_HISTORY})`)
  }
  
  async function undo() {
    if (historyIndex.value < 0) {
      console.warn('[useCanvasHistory] Nothing to undo')
      return null
    }
    
    const entry = history.value[historyIndex.value]
    if (!entry) return null
    
    try {
      const elementIndex = elements.value.findIndex(el => el.id === entry.elementId)
      
      if (elementIndex >= 0 && entry.previousState) {
        // Restore previous state
        elements.value[elementIndex] = { ...entry.previousState }
        
        // Save to DB if callback provided
        if (saveCallback) {
          await saveCallback(entry.previousState)
        }
        
        historyIndex.value--
        console.log('[useCanvasHistory] Undone:', entry.action)
        return entry
      } else if (entry.action === 'create' && entry.elementId) {
        // Delete created element
        elements.value = elements.value.filter(el => el.id !== entry.elementId)
        if (saveCallback) {
          await saveCallback(null, entry.elementId, 'delete')
        }
        historyIndex.value--
        console.log('[useCanvasHistory] Undone create')
        return entry
      } else if (entry.action === 'delete' && entry.previousState) {
        // Recreate deleted element
        elements.value.push(entry.previousState)
        if (saveCallback) {
          await saveCallback(entry.previousState, null, 'create')
        }
        historyIndex.value--
        console.log('[useCanvasHistory] Undone delete')
        return entry
      }
    } catch (err) {
      console.error('[useCanvasHistory] Undo failed:', err.message)
    }
    
    return null
  }
  
  async function redo() {
    if (historyIndex.value >= history.value.length - 1) {
      console.warn('[useCanvasHistory] Nothing to redo')
      return null
    }
    
    historyIndex.value++
    const entry = history.value[historyIndex.value]
    if (!entry) return null
    
    try {
      const elementIndex = elements.value.findIndex(el => el.id === entry.elementId)
      
      if (elementIndex >= 0 && entry.newState) {
        // Apply new state
        elements.value[elementIndex] = { ...entry.newState }
        
        // Save to DB if callback provided
        if (saveCallback) {
          await saveCallback(entry.newState)
        }
        
        console.log('[useCanvasHistory] Redone:', entry.action)
        return entry
      } else if (entry.action === 'create' && entry.newState) {
        // Recreate element
        elements.value.push(entry.newState)
        if (saveCallback) {
          await saveCallback(entry.newState, null, 'create')
        }
        console.log('[useCanvasHistory] Redone create')
        return entry
      } else if (entry.action === 'delete') {
        // Delete again
        elements.value = elements.value.filter(el => el.id !== entry.elementId)
        if (saveCallback) {
          await saveCallback(null, entry.elementId, 'delete')
        }
        console.log('[useCanvasHistory] Redone delete')
        return entry
      }
    } catch (err) {
      console.error('[useCanvasHistory] Redo failed:', err.message)
    }
    
    return null
  }
  
  function canUndo() {
    return historyIndex.value >= 0
  }
  
  function canRedo() {
    return historyIndex.value < history.value.length - 1
  }
  
  function getHistoryCount() {
    return history.value.length
  }
  
  function getCurrentIndex() {
    return historyIndex.value
  }
  
  function clearHistory() {
    history.value = []
    historyIndex.value = -1
  }
  
  return {
    // State
    history,
    historyIndex,
    
    // Actions
    addToHistory,
    undo,
    redo,
    
    // Getters
    canUndo,
    canRedo,
    getHistoryCount,
    getCurrentIndex,
    clearHistory
  }
}
