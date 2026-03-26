// Viewport centering utilities
// Handles all viewport centering calculations

/**
 * Calculate viewport transform to center a world point
 * @param {number} worldX - X coordinate in world space
 * @param {number} worldY - Y coordinate in world space
 * @param {number} zoom - Current zoom level
 * @param {number} viewportWidth - Viewport width in pixels
 * @param {number} viewportHeight - Viewport height in pixels
 * @returns {{ translateX: number, translateY: number }}
 */
export function centerOnPoint(worldX, worldY, zoom, viewportWidth, viewportHeight) {
  const translateX = (viewportWidth / 2) - (worldX * zoom)
  const translateY = (viewportHeight / 2) - (worldY * zoom)
  return { translateX, translateY }
}

/**
 * Calculate the center point of a card in world coordinates
 * @param {Object} position - Card position { left, top }
 * @param {Object} size - Card size { width, height }
 * @returns {{ x: number, y: number }}
 */
export function getCardCenter(position, size) {
  return {
    x: position.left + size.width / 2,
    y: position.top + size.height / 2
  }
}

/**
 * Center viewport on a project card
 * @param {Object} project - Project with position data
 * @param {Object} cardSize - Card dimensions { width, height }
 * @param {number} zoom - Target zoom level
 * @param {number} viewportWidth - Viewport width
 * @param {number} viewportHeight - Viewport height
 * @returns {{ translateX: number, translateY: number, zoom: number }}
 */
export function centerOnCard(project, cardSize, zoom, viewportWidth, viewportHeight) {
  const position = project.computedPosition || project.position
  
  if (!position) {
    console.error('[Centering] No position data for project:', project.id)
    return { translateX: 0, translateY: 0, zoom }
  }
  
  const cardCenter = getCardCenter(position, cardSize)
  const { translateX, translateY } = centerOnPoint(
    cardCenter.x,
    cardCenter.y,
    zoom,
    viewportWidth,
    viewportHeight
  )
  
  return { translateX, translateY, zoom }
}
