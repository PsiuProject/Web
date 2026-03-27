import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { usePermissionsStore } from '../stores/permissions'

const routes = [
  {
    path: '/',
    name: 'welcome',
    component: () => import('../views/WelcomeView.vue')
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: () => import('../views/GalleryView.vue')
  },
  {
    path: '/select',
    name: 'project-select',
    component: () => import('../views/ProjectSelectView.vue')
  },
  {
    path: '/:projectId/view',
    name: 'canvas-view',
    component: () => import('../views/CanvasView.vue'),
    meta: { requiresProject: true }
  },
  {
    path: '/:projectId/edit',
    name: 'canvas-edit',
    component: () => import('../views/CanvasEdit.vue'),
    meta: { requiresProject: true, requiresEdit: true }
  },
  {
    path: '/:projectId/comment',
    name: 'canvas-comment',
    component: () => import('../views/CanvasComment.vue'),
    meta: { requiresProject: true, requiresComment: true }
  },
  {
    path: '/:projectId/present',
    name: 'canvas-present',
    component: () => import('../views/CanvasPresent.vue'),
    meta: { requiresProject: true }
  },
  // Legacy share slug route
  {
    path: '/s/:slug',
    name: 'share-link',
    component: () => import('../views/CanvasView.vue'),
    meta: { isShareLink: true }
  },
  // Catch-all redirect to gallery
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  const permissions = usePermissionsStore()

  // Wait for auth to finish loading
  if (auth.loading) {
    await new Promise((resolve) => {
      const check = () => {
        if (!auth.loading) return resolve()
        setTimeout(check, 50)
      }
      check()
    })
  }

  const projectId = to.params.projectId

  // If route requires project permissions, load them
  if (to.meta.requiresProject && projectId) {
    await permissions.loadPermissions(projectId)

    // Check edit permission
    if (to.meta.requiresEdit && !permissions.canEdit) {
      return next({ name: 'canvas-view', params: { projectId } })
    }

    // Check comment permission
    if (to.meta.requiresComment && !permissions.canComment) {
      return next({ name: 'canvas-view', params: { projectId } })
    }

    // Check view permission
    if (!permissions.canView) {
      return next({ name: 'gallery' })
    }
  }

  next()
})

export default router
