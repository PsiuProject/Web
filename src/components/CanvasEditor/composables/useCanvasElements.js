// Composable for managing canvas elements CRUD operations
import { ref, computed } from 'vue'
import { useAuthStore } from '../../../stores/auth'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'

export function useCanvasElements(projectId) {
  const auth = useAuthStore()
  
  const elements = ref([])
  const connections = ref([])
  const selectedElementId = ref(null)
  const selectedElements = ref(new Set()) // Multi-select
  
  const selectedElement = computed(() => {
    return elements.value.find(el => el.id === selectedElementId.value) || null
  })
  
  function selectElement(element) {
    selectedElement.value = element
    selectedElementId.value = element?.id || null
  }
  
  function toggleMultiSelect(element) {
    if (selectedElements.value.has(element.id)) {
      selectedElements.value.delete(element.id)
      if (selectedElementId.value === element.id) {
        selectedElementId.value = null
      }
    } else {
      selectedElements.value.add(element.id)
      selectElement(element)
    }
  }
  
  function clearSelection() {
    selectedElements.value.clear()
    selectedElementId.value = null
    selectedElement.value = null
  }
  
  function getDefaultContent(type) {
    switch(type) {
      case 'card': return { title: '', description: '', status: 'active' }
      case 'text': return { text: 'New text block', html: '<p>New text block</p>' }
      case 'image': return { url: '', caption: '' }
      case 'link': return { url: 'https://', label: '' }
      case 'note': return { text: 'Note text...' }
      default: return {}
    }
  }
  
  function getDefaultSize(type) {
    const sizes = {
      card: { width: 300, height: 200 },
      text: { width: 400, height: 100 },
      image: { width: 400, height: 300 },
      link: { width: 300, height: 60 },
      note: { width: 250, height: 150 }
    }
    return sizes[type] || { width: 300, height: 200 }
  }
  
  function createElement(type, position, zoom = 1) {
    const newElement = {
      id: crypto.randomUUID(),
      project_id: projectId,
      type,
      content: getDefaultContent(type),
      position_x: position.x / zoom,
      position_y: position.y / zoom,
      width: getDefaultSize(type).width,
      height: getDefaultSize(type).height,
      rotation: 0,
      z_index: elements.value.length,
      created_by: auth.userId,
      updated_at: new Date().toISOString()
    }
    
    elements.value.push(newElement)
    selectElement(newElement)
    return newElement
  }
  
  function updateElement(element) {
    element.updated_at = new Date().toISOString()
    // Trigger reactivity
    elements.value = [...elements.value]
  }
  
  function deleteElement(element) {
    const index = elements.value.findIndex(el => el.id === element.id)
    if (index > -1) {
      elements.value.splice(index, 1)
      selectedElements.value.delete(element.id)
      if (selectedElementId.value === element.id) {
        selectedElementId.value = null
      }
    }
  }
  
  function duplicateElement(element) {
    const duplicate = {
      ...JSON.parse(JSON.stringify(element)),
      id: crypto.randomUUID(),
      position_x: element.position_x + 20,
      position_y: element.position_y + 20,
      z_index: elements.value.length,
      updated_at: new Date().toISOString()
    }
    elements.value.push(duplicate)
    return duplicate
  }
  
  function buildConnections() {
    // Build connections from elements with parent_id
    connections.value = elements.value
      .filter(el => el.parent_id && el.type === 'connection')
      .map(el => {
        const parent = elements.value.find(p => p.id === el.parent_id)
        return {
          id: el.id,
          x1: parent ? parent.position_x + parent.width / 2 : 0,
          y1: parent ? parent.position_y + parent.height / 2 : 0,
          x2: el.position_x + el.width / 2,
          y2: el.position_y + el.height / 2,
          type: el.connection_type,
          color: getConnectionColor(el.connection_type)
        }
      })
  }
  
  function getConnectionColor(type) {
    const CONNECTION_TYPES = [
      { name: 'subProject', color: '#ff5f1f' },
      { name: 'related', color: '#6a7d5b' },
      { name: 'inspiration', color: '#b55d3a' },
      { name: 'evolution', color: '#508cdc' },
      { name: 'dependency', color: '#9b59b6' },
      { name: 'reference', color: '#95a5a6' }
    ]
    const connType = CONNECTION_TYPES.find(ct => ct.name === type)
    return connType?.color || '#b55d3a'
  }
  
  // Load elements from Supabase
  async function loadElements() {
    if (!isSupabaseConfigured) {
      console.warn('[useCanvasElements] Supabase not configured - running in offline mode')
      return []
    }
    
    try {
      const { data, error } = await supabase
        .from('canvas_elements')
        .select('*')
        .eq('project_id', projectId)
        .order('z_index')
      
      if (error) throw error
      
      elements.value = data || []
      buildConnections()
      
      console.log(`[useCanvasElements] Loaded ${elements.value.length} elements`)
      return data || []
    } catch (err) {
      console.error('[useCanvasElements] Load failed:', err.message)
      throw err
    }
  }
  
  // Save elements to Supabase
  async function saveElements(elementsToSave = null) {
    if (!isSupabaseConfigured) return
    
    const data = elementsToSave || elements.value.map(el => ({
      ...el,
      updated_at: new Date().toISOString()
    }))
    
    try {
      const { error } = await supabase
        .from('canvas_elements')
        .upsert(data, { 
          onConflict: 'id',
          ignoreDuplicates: false
        })
      
      if (error) throw error
      
      console.log('[useCanvasElements] Saved', data.length, 'elements')
    } catch (err) {
      console.error('[useCanvasElements] Save failed:', err.message)
      throw err
    }
  }
  
  return {
    // State
    elements,
    connections,
    selectedElement,
    selectedElementId,
    selectedElements,
    
    // Actions
    selectElement,
    toggleMultiSelect,
    clearSelection,
    createElement,
    updateElement,
    deleteElement,
    duplicateElement,
    buildConnections,
    loadElements,
    saveElements,
    
    // Utilities
    getDefaultContent,
    getDefaultSize,
    getConnectionColor
  }
}
