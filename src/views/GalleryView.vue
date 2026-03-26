<template>
  <div class="gallery-view">
    <AppHeader mode="gallery" />
    
    <div v-if="!auth.isLoggedIn" class="login-prompt">
      <p>Please login to view projects</p>
      <button @click="handleLogin">Login with Google</button>
    </div>
    
    <template v-else>
      <!-- No sidebar in gallery - clean view -->
      
      <div
        id="viewport"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseLeave"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div
          id="canvas"
          :class="{ 'smooth-zoom': galleryStore.isZooming }"
          :style="{ transform: galleryStore.canvasTransform }"
        >
          <!-- Section Separators -->
          <div
            v-for="sep in sectionSeparators"
            :key="sep.label"
            class="section-separator"
            :style="{
              top: sep.top + 'px',
              left: sep.left + 'px',
              width: sep.width + 'px',
              '--sep-color': sep.color
            }"
          >
            <div class="separator-line"></div>
            <div class="separator-label">{{ sep.label }}</div>
            <div class="separator-line"></div>
          </div>

          <!-- Connection Lines -->
          <svg class="connector-lines" xmlns="http://www.w3.org/2000/svg">
            <ConnectionLine
              v-for="conn in validConnections"
              :key="'conn-' + conn.id"
              :x1="getConnectionStart(conn.parentId).x"
              :y1="getConnectionStart(conn.parentId).y"
              :x2="getConnectionEnd(conn.id).x"
              :y2="getConnectionEnd(conn.id).y"
              :connectionTypeKey="conn.connectionTypeKey || 'connections.subProject'"
              :color="getConnectionColor(conn.childProject?.type || 'done')"
            />
          </svg>

          <!-- Project Cards -->
          <ProjectCard
            v-for="project in layoutedProjects"
            :key="project.id"
            :project="project"
            :isSubProject="!!project.parentId"
            :clickToNavigate="true"
          />
        </div>
      </div>

      <AppFooter />
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useGalleryStore } from '../stores/gallery'
import { useProjectsStore } from '../stores/projectsStore'
import { useAuthStore } from '../stores/auth'
import { useViewportStore } from '../stores/viewport'
import AppHeader from '../components/Layout/AppHeader.vue'
import Sidebar from '../components/Sidebar.vue'
import ProjectCard from '../components/ProjectCard.vue'
import ConnectionLine from '../components/ConnectionLine.vue'
import AppFooter from '../components/AppFooter.vue'

const router = useRouter()
const galleryStore = useGalleryStore()
const projectsStore = useProjectsStore()
const auth = useAuthStore()
const viewport = useViewportStore()

async function handleLogin() {
  await auth.loginWithGoogle()
}

// Get ALL root projects (not just owned) - same as ProjectSelectView
const allRootProjects = computed(() => {
  console.log('[Gallery] Computing allRootProjects...')
  console.log('[Gallery] galleryStore.filteredProjects:', galleryStore.filteredProjects.length)
  console.log('[Gallery] filteredProjects data:', galleryStore.filteredProjects.map(p => ({ 
    id: p.id, 
    title: p.titleKey || p.title, 
    parentId: p.parentId,
    type: p.type,
    owner_id: p.owner_id 
  })))
  
  const result = galleryStore.filteredProjects.filter(p => {
    // Show all root projects (no sub-projects at root level)
    return !p.parentId
  })
  
  console.log('[Gallery] allRootProjects result:', result.length)
  console.log('[Gallery] allRootProjects data:', result.map(p => ({ id: p.id, title: p.titleKey || p.title, parentId: p.parentId })))
  
  return result
})

const layoutedProjects = computed(() => {
  // Use gallery store's layout logic with all projects
  console.log('[Gallery] Computing layoutedProjects...')
  const result = galleryStore.layoutOwnedProjects(allRootProjects.value)
  console.log('[Gallery] layoutedProjects result:', result.length)
  console.log('[Gallery] layoutedProjects data:', result.map(p => ({ 
    id: p.id, 
    title: p.titleKey || p.title, 
    type: p.type,
    computedPosition: p.computedPosition 
  })))
  return result
})

// Compute section separators based on laid out projects
const sectionSeparators = computed(() => {
  const sections = {
    active: { label: 'EM EXECUCAO', color: '#ff5f1f', top: null },
    pipeline: { label: 'PIPELINE / ESCRITA', color: '#6a7d5b', top: null },
    done: { label: 'CONCLUIDOS', color: '#b55d3a', top: null }
  }
  
  // Find the topmost project in each section
  layoutedProjects.value.forEach(p => {
    if (!p.parentId && sections[p.type] && p.computedPosition) {
      const currentTop = sections[p.type].top
      if (currentTop === null || p.computedPosition.top < currentTop) {
        sections[p.type].top = p.computedPosition.top - 50
      }
    }
  })
  
  // Convert to separator array
  return Object.entries(sections)
    .filter(([_, section]) => section.top !== null)
    .map(([type, section]) => ({
      label: section.label,
      color: section.color,
      top: section.top,
      left: 0,
      width: 2600
    }))
    .sort((a, b) => a.top - b.top)
})

const validConnections = computed(() => {
  return galleryStore.projectConnections.filter(conn => {
    const start = getConnectionStart(conn.parentId)
    const end = getConnectionEnd(conn.id)
    return start.x > 0 || start.y > 0 || end.x > 0 || end.y > 0
  })
})

function getCardDimensions(project) {
  const calculated = galleryStore.calculatedCardSizes[project.id]
  if (calculated) return { width: calculated.width, height: calculated.height }
  const sizeConfig = galleryStore.cardSizes[project.size] || galleryStore.cardSizes['card-md']
  return { width: sizeConfig.width, height: sizeConfig.height }
}

function getConnectionStart(parentId) {
  const layouted = layoutedProjects.value
  const parent = layouted.find(p => p.id === parentId) || galleryStore.filteredProjects.find(p => p.id === parentId)
  if (!parent) return { x: 0, y: 0 }
  const pos = parent.computedPosition || parent.position || { left: 0, top: 0 }
  const dims = getCardDimensions(parent)
  return { x: pos.left + dims.width / 2, y: pos.top + dims.height }
}

function getConnectionEnd(childId) {
  const layouted = layoutedProjects.value
  const child = layouted.find(p => p.id === childId) || galleryStore.filteredProjects.find(p => p.id === childId)
  if (!child) return { x: 0, y: 0 }
  const pos = child.computedPosition || child.position || { left: 0, top: 0 }
  const dims = getCardDimensions(child)
  return { x: pos.left + dims.width / 2, y: pos.top }
}

function getConnectionColor(projectType) {
  const colors = { active: '#ff5f1f', pipeline: '#6a7d5b', done: '#b55d3a' }
  return colors[projectType] || '#b55d3a'
}

// Mouse handlers
function onMouseDown(e) {
  if (e.target.closest('.project-card') || e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea')) return
  document.body.classList.add('dragging')
  galleryStore.updateMouse(e.clientX, e.clientY)
  galleryStore.setStart(e.clientX, e.clientY)
  galleryStore.setDragging(true)
  galleryStore.clearFocus()
}

function onMouseMove(e) {
  galleryStore.updateMouse(e.clientX, e.clientY)
  if (galleryStore.isDragging) {
    galleryStore.updateTranslate(e.clientX, e.clientY)
  }
}

function onMouseUp() {
  document.body.classList.remove('dragging')
  galleryStore.setDragging(false)
}

function onMouseLeave() {
  document.body.classList.remove('dragging')
  galleryStore.resetMouseToCenter()
}

// Touch handlers
function onTouchStart(e) {
  viewport.onTouchStart(e)
  galleryStore.translateX = viewport.translateX
  galleryStore.translateY = viewport.translateY
  galleryStore.zoom = viewport.zoom
}

function onTouchMove(e) {
  viewport.onTouchMove(e)
  galleryStore.translateX = viewport.translateX
  galleryStore.translateY = viewport.translateY
  galleryStore.zoom = viewport.zoom
}

function onTouchEnd() {
  viewport.onTouchEnd()
}

function onWheel(e) {
  e.preventDefault()
  galleryStore.adjustZoom(e.deltaY, e.clientX, e.clientY)
}

onMounted(async () => {
  console.log('[Gallery] Loading projects...')
  // Load projects only in gallery view
  await projectsStore.loadProjects()
  
  console.log('[Gallery] Projects loaded:', projectsStore.projects.length)
  console.log('[Gallery] All projects:', projectsStore.projects.map(p => ({ id: p.id, title: p.title, owner_id: p.owner_id })))
  console.log('[Gallery] Filtered projects:', galleryStore.filteredProjects.length)
  console.log('[Gallery] Auth userId:', auth.userId)
  console.log('[Gallery] Is logged in:', auth.isLoggedIn)
  
  const allRoot = allRootProjects.value
  console.log('[Gallery] All root projects for layout:', allRoot.length)
  console.log('[Gallery] Root projects:', allRoot.map(p => ({ id: p.id, title: p.title, parentId: p.parentId })))
  
  const layouted = layoutedProjects.value
  console.log('[Gallery] Layouted projects:', layouted.length)
  
  const viewportEl = document.getElementById('viewport')
  if (viewportEl) {
    viewportEl.addEventListener('wheel', onWheel, { passive: false })
  }

  galleryStore.triggerEntryAnimation()
})

onBeforeUnmount(() => {
  const viewportEl = document.getElementById('viewport')
  if (viewportEl) {
    viewportEl.removeEventListener('wheel', onWheel)
  }
})
</script>

<style scoped>
.gallery-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.login-prompt {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(20, 20, 18, 0.95);
  border: 1px solid var(--moss);
  padding: 3rem;
}

.login-prompt p {
  color: var(--paper);
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.login-prompt button {
  background: var(--terracotta);
  border: none;
  color: var(--ink);
  padding: 0.75rem 2rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  text-transform: uppercase;
}

.login-prompt button:hover {
  background: var(--stencil-orange);
}
</style>
