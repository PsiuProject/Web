// Composable for canvas zoom and pan functionality
import { ref, computed } from 'vue'

export function useCanvasZoom(initialZoom = 1) {
  const zoom = ref(initialZoom)
  const isDragging = ref(false)
  const dragStartPos = ref({ x: 0, y: 0 })
  const dragCurrentPos = ref({ x: 0, y: 0 })
  
  const gridStyle = computed(() => ({
    transform: `scale(${zoom.value})`,
    backgroundSize: `${50 * zoom.value}px ${50 * zoom.value}px`
  }))
  
  function zoomIn(step = 0.25) {
    zoom.value = Math.min(3, zoom.value + step)
  }
  
  function zoomOut(step = 0.25) {
    zoom.value = Math.max(0.25, zoom.value - step)
  }
  
  function resetZoom() {
    zoom.value = 1
  }
  
  function setZoom(value) {
    zoom.value = Math.max(0.25, Math.min(3, value))
  }
  
  function zoomWithCursor(deltaY, mouseX, mouseY, canvasRef) {
    if (!canvasRef.value) return
    
    const delta = deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(0.25, Math.min(3, zoom.value + delta))
    
    const rect = canvasRef.value.getBoundingClientRect()
    const canvasX = mouseX - rect.left
    const canvasY = mouseY - rect.top
    
    const scaleChange = newZoom / zoom.value
    zoom.value = newZoom
    
    // Adjust scroll to keep mouse position stable
    canvasRef.value.scrollLeft += canvasX * (scaleChange - 1)
    canvasRef.value.scrollTop += canvasY * (scaleChange - 1)
  }
  
  function startDrag(clientX, clientY) {
    dragStartPos.value = { x: clientX, y: clientY }
    dragCurrentPos.value = { x: clientX, y: clientY }
    isDragging.value = true
  }
  
  function updateDrag(clientX, clientY) {
    dragCurrentPos.value = { x: clientX, y: clientY }
  }
  
  function endDrag() {
    isDragging.value = false
  }
  
  function getDragDelta() {
    return {
      x: dragCurrentPos.value.x - dragStartPos.value.x,
      y: dragCurrentPos.value.y - dragStartPos.value.y
    }
  }
  
  // Touch gesture support
  let touchStartDistance = 0
  let touchStartZoom = 1
  
  function onTouchStart(e) {
    if (e.touches.length === 2) {
      // Pinch gesture
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touchStartDistance = Math.sqrt(dx * dx + dy * dy)
      touchStartZoom = zoom.value
    } else if (e.touches.length === 1) {
      // Single touch drag
      startDrag(e.touches[0].clientX, e.touches[0].clientY)
    }
  }
  
  function onTouchMove(e, canvasRef) {
    if (e.touches.length === 2) {
      // Pinch to zoom
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (touchStartDistance > 0) {
        const scale = distance / touchStartDistance
        const newZoom = Math.max(0.25, Math.min(3, touchStartZoom * scale))
        zoom.value = newZoom
      }
    } else if (e.touches.length === 1 && isDragging.value && canvasRef?.value) {
      // Pan canvas
      const dx = (e.touches[0].clientX - dragStartPos.value.x) / zoom.value
      const dy = (e.touches[0].clientY - dragStartPos.value.y) / zoom.value
      
      canvasRef.value.scrollLeft -= dx
      canvasRef.value.scrollTop -= dy
      
      dragStartPos.value = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }
  
  function onTouchEnd() {
    endDrag()
    touchStartDistance = 0
  }
  
  return {
    // State
    zoom,
    isDragging,
    gridStyle,
    
    // Actions
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    zoomWithCursor,
    startDrag,
    updateDrag,
    endDrag,
    getDragDelta,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}
