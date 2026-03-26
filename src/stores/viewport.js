import { defineStore } from 'pinia'

export const useViewportStore = defineStore('viewport', {
  state: () => ({
    translateX: 0,
    translateY: 0,
    zoom: 0.7,
    isDragging: false,
    isZooming: false,
    zoomTimeout: null,
    startX: 0,
    startY: 0,
    mouseX: 0,
    mouseY: 0,
    velocityX: 0,
    velocityY: 0,
    lastMoveTime: 0,
    lastMoveX: 0,
    lastMoveY: 0,
    momentumFrame: null,
    touchStartDistance: 0,
    touchStartZoom: 0.7
  }),

  getters: {
    canvasTransform: (state) => `translate3d(${state.translateX}px, ${state.translateY}px, 0) scale(${state.zoom})`
  },

  actions: {
    updateMouse(x, y) {
      this.mouseX = x
      this.mouseY = y
    },

    setDragging(val) {
      if (val) {
        this.stopMomentum()
        this.isDragging = true
      } else {
        this.isDragging = false
        this.startMomentum()
      }
    },

    setStart(x, y) {
      this.startX = x - this.translateX
      this.startY = y - this.translateY
      this.lastMoveX = x
      this.lastMoveY = y
      this.lastMoveTime = performance.now()
    },

    updateTranslate(x, y) {
      const now = performance.now()
      const dt = Math.max(1, now - this.lastMoveTime)
      
      const dx = x - this.lastMoveX
      const dy = y - this.lastMoveY
      
      this.velocityX = dx / dt * 16
      this.velocityY = dy / dt * 16
      
      this.translateX = x - this.startX
      this.translateY = y - this.startY
      
      this.lastMoveX = x
      this.lastMoveY = y
      this.lastMoveTime = now
    },

    startMomentum() {
      const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2)
      if (speed < 0.5) {
        this.velocityX = 0
        this.velocityY = 0
        return
      }

      const animate = () => {
        this.velocityX *= 0.92
        this.velocityY *= 0.92
        
        this.translateX += this.velocityX
        this.translateY += this.velocityY
        
        const currentSpeed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2)
        if (currentSpeed > 0.1 && !this.isDragging) {
          this.momentumFrame = requestAnimationFrame(animate)
        } else {
          this.velocityX = 0
          this.velocityY = 0
          this.momentumFrame = null
        }
      }
      
      this.momentumFrame = requestAnimationFrame(animate)
    },

    stopMomentum() {
      if (this.momentumFrame) {
        cancelAnimationFrame(this.momentumFrame)
        this.momentumFrame = null
      }
      this.velocityX = 0
      this.velocityY = 0
    },

    adjustZoom(deltaY, mouseX, mouseY) {
      this.stopMomentum()
      
      if (this.zoomTimeout) clearTimeout(this.zoomTimeout)
      this.isZooming = true
      
      const oldZoom = this.zoom
      const newZoom = Math.min(Math.max(0.15, this.zoom - deltaY * 0.001), 3)
      
      if (newZoom !== oldZoom) {
        const worldX = (mouseX - this.translateX) / oldZoom
        const worldY = (mouseY - this.translateY) / oldZoom
        
        this.translateX = mouseX - worldX * newZoom
        this.translateY = mouseY - worldY * newZoom
        this.zoom = newZoom
      }
      
      this.zoomTimeout = setTimeout(() => {
        this.isZooming = false
      }, 150)
    },

    // Touch/pinch support
    onTouchStart(e) {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        this.touchStartDistance = Math.sqrt(dx * dx + dy * dy)
        this.touchStartZoom = this.zoom
      } else if (e.touches.length === 1) {
        this.setStart(e.touches[0].clientX, e.touches[0].clientY)
        this.setDragging(true)
      }
    },

    onTouchMove(e) {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (this.touchStartDistance > 0) {
          const scale = distance / this.touchStartDistance
          const newZoom = Math.max(0.15, Math.min(3, this.touchStartZoom * scale))
          
          const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2
          const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2
          
          const worldX = (centerX - this.translateX) / this.zoom
          const worldY = (centerY - this.translateY) / this.zoom
          
          this.translateX = centerX - worldX * newZoom
          this.translateY = centerY - worldY * newZoom
          this.zoom = newZoom
        }
      } else if (e.touches.length === 1 && this.isDragging) {
        this.updateTranslate(e.touches[0].clientX, e.touches[0].clientY)
      }
    },

    onTouchEnd() {
      this.setDragging(false)
      this.touchStartDistance = 0
    },

    centerOn(worldX, worldY, targetZoom = null) {
      this.stopMomentum()
      
      if (typeof window === 'undefined') return
      
      const viewportCenterX = window.innerWidth / 2
      const viewportCenterY = window.innerHeight / 2
      const z = targetZoom || this.zoom
      
      this.translateX = viewportCenterX - (worldX * z)
      this.translateY = viewportCenterY - (worldY * z)
      if (targetZoom) this.zoom = targetZoom
    },

    reset() {
      this.translateX = 0
      this.translateY = 0
      this.zoom = 0.7
      this.stopMomentum()
    }
  }
})
