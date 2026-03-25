<template>
  <div id="app">
    <AppHeader />
    
    <!-- Empty State - Show when no projects exist -->
    <template v-if="projectsStore.projects.length === 0 && !projectsStore.loading">
      <EmptyState />
    </template>
    
    <!-- Gallery View - Show when projects exist -->
    <template v-else>
      <Sidebar v-if="!store.detailViewActive" />
      <div id="viewport" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseLeave">

        <!-- Detail View Overlay -->
        <Transition name="detail-fade">
          <div v-if="store.detailViewActive && store.detailViewProject"
               id="detail-canvas"
               class="canvas-layer detail-overlay"
               :class="{ 'active': store.detailViewAnimated }">
            <ProjectDetail
              :project="store.detailViewProject"
              :translateX="store.translateX"
              :translateY="store.translateY"
              :zoom="store.zoom"
              @close="store.closeDetailView()"
            />
          </div>
        </Transition>

        <!-- Gallery View Canvas -->
        <div v-show="!store.detailViewActive"
             id="canvas"
             class="canvas-layer"
             :class="{ 'smooth-zoom': store.isZooming }"
             :style="{ transform: store.canvasTransform }">

          <!-- Status Section Separators -->
          <div
            v-for="sep in store.filteredSeparators"
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

          <!-- Connection lines (behind cards - z-index: 0) -->
          <svg class="connector-lines" xmlns="http://www.w3.org/2000/svg">
            <ConnectionLine
              v-for="conn in validConnections"
              :key="'conn-' + conn.id"
              :x1="getConnectionStart(conn.parentId).x"
              :y1="getConnectionStart(conn.parentId).y"
              :x2="getConnectionEnd(conn.id).x"
              :y2="getConnectionEnd(conn.id).y"
              :connection-type-key="conn.connectionTypeKey || 'connections.subProject'"
              :color="getConnectionColor(conn.childProject?.type || 'done')"
            />
          </svg>

          <ProjectCard
            v-for="project in layoutedProjects"
            :key="project.id"
            :project="project"
            :isSubProject="!!project.parentId"
          />
        </div>
      </div>
    </template>
    
    <AppFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useGalleryStore } from './stores/gallery'
import { useProjectsStore } from './stores/projectsStore'
import AppHeader from './components/AppHeader.vue'
import Sidebar from './components/Sidebar.vue'
import ProjectCard from './components/ProjectCard.vue'
import ConnectionLine from './components/ConnectionLine.vue'
import ProjectDetail from './components/ProjectDetail.vue'
import EmptyState from './components/EmptyState.vue'
import AppFooter from './components/AppFooter.vue'

const store = useGalleryStore()
const projectsStore = useProjectsStore()

const layoutedProjects = computed(() => store.layoutProjects.projects)

const validConnections = computed(() => {
  return store.projectConnections.filter(conn => {
    const start = getConnectionStart(conn.parentId)
    const end = getConnectionEnd(conn.id)
    return start.x > 0 || start.y > 0 || end.x > 0 || end.y > 0
  })
})

function getCardDimensions(project) {
  const calculated = store.calculatedCardSizes[project.id]
  if (calculated) {
    return { width: calculated.width, height: calculated.height }
  }
  const sizeConfig = store.cardSizes[project.size] || store.cardSizes['card-md']
  return { width: sizeConfig.width, height: sizeConfig.height }
}

function getConnectionStart(parentId) {
  const layouted = layoutedProjects.value
  const parent = layouted.find(p => p.id === parentId)
  if (!parent) {
    const filtered = store.filteredProjects.find(p => p.id === parentId)
    if (filtered) {
      const pos = filtered.position || filtered.computedPosition || { left: 0, top: 0 }
      const dims = getCardDimensions(filtered)
      return { x: pos.left + dims.width / 2, y: pos.top + dims.height }
    }
    return { x: 0, y: 0 }
  }

  const pos = parent.computedPosition || parent.position
  if (!pos) return { x: 0, y: 0 }

  const dims = getCardDimensions(parent)

  return {
    x: pos.left + dims.width / 2,
    y: pos.top + dims.height
  }
}

function getConnectionEnd(childId) {
  const layouted = layoutedProjects.value
  const child = layouted.find(p => p.id === childId)
  if (!child) {
    const filtered = store.filteredProjects.find(p => p.id === childId)
    if (filtered) {
      const pos = filtered.position || filtered.computedPosition || { left: 0, top: 0 }
      const dims = getCardDimensions(filtered)
      return { x: pos.left + dims.width / 2, y: pos.top }
    }
    return { x: 0, y: 0 }
  }

  const pos = child.computedPosition || child.position
  if (!pos) return { x: 0, y: 0 }

  const dims = getCardDimensions(child)

  return {
    x: pos.left + dims.width / 2,
    y: pos.top
  }
}

function getConnectionColor(projectType) {
  const colors = {
    active: '#ff5f1f',
    pipeline: '#6a7d5b',
    done: '#b55d3a'
  }
  return colors[projectType] || '#b55d3a'
}

function onMouseDown(e) {
  const target = e.target
  const isCardClick = target.closest('.project-card')
  const isUIElement = target.closest('button') || target.closest('a') || target.closest('input') || target.closest('select') || target.closest('textarea') || target.closest('.inline-edit.editing')
  const isDetailView = target.closest('.detail-overlay')

  if (isCardClick || isUIElement || isDetailView) {
    return
  }

  document.body.classList.add('dragging')
  store.updateMouse(e.clientX, e.clientY)
  store.setStart(e.clientX, e.clientY)
  store.setDragging(true)
  store.clearFocus()
}

function onMouseMove(e) {
  store.updateMouse(e.clientX, e.clientY)
  if (store.isDragging) {
    store.updateTranslate(e.clientX, e.clientY)
  }
}

function onMouseUp() {
  document.body.classList.remove('dragging')
  store.setDragging(false)
}

function onMouseLeave() {
  document.body.classList.remove('dragging')
  store.resetMouseToCenter()
}

function onWheel(e) {
  // Don't zoom when detail view is active
  if (store.detailViewActive) return
  e.preventDefault()
  store.adjustZoom(e.deltaY, e.clientX, e.clientY)
}

onMounted(() => {
  const viewport = document.getElementById('viewport')
  if (viewport) {
    viewport.addEventListener('wheel', onWheel, { passive: false })
  }
  store.triggerEntryAnimation()
})

onBeforeUnmount(() => {
  const viewport = document.getElementById('viewport')
  if (viewport) {
    viewport.removeEventListener('wheel', onWheel)
  }
})
</script>
