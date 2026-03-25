<template>
  <article
    ref="cardRef"
    :id="project.id"
    :data-type="project.type"
    class="project-card"
    :class="[project.size, { 'sub-project': isSubProject, 'is-dragging': isDragging }]"
    :style="cardStyles"
    @click="handleCardClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @mousedown.stop="canDrag && handleDragStart($event)"
    :draggable="canDrag"
  >
    <!-- Privacy badge -->
    <div v-if="project.privacy && project.privacy !== 'public'" class="privacy-badge">
      {{ project.privacy === 'private' ? '\uD83D\uDD12' : '\uD83D\uDD17' }}
    </div>

    <div class="status-tag" :class="'tag-' + project.type">
      {{ displayText(project.statusTagKey) }}
    </div>

    <InlineEdit
      :modelValue="displayText(project.titleKey)"
      tag="h2"
      displayClass="title"
      :canEdit="canEdit"
      @save="(val) => saveField('title', val)"
    />

    <InlineEdit
      :modelValue="displayText(project.descriptionKey)"
      tag="p"
      displayClass="description"
      :multiline="true"
      :canEdit="canEdit"
      @save="(val) => saveField('description', val)"
    />

    <div v-if="project.kpiLabelKey" class="kpi-box">
      <div class="filter-label">{{ displayText(project.kpiLabelKey) }}</div>
      <div v-if="project.kpiValue" class="kpi-value">{{ project.kpiValue }}</div>
      <div v-if="project.kpiDetail" class="kpi-detail">{{ project.kpiDetail }}</div>
    </div>

    <div v-if="project.meta && project.meta.length" class="meta-grid">
      <div v-for="item in project.meta" :key="item.labelKey" class="meta-item">
        <label>{{ displayText(item.labelKey) }}</label>
        {{ item.value }}
      </div>
    </div>

    <!-- Link chips -->
    <div v-if="project.links && project.links.length" class="links-row">
      <LinkChip
        v-for="(link, idx) in project.links"
        :key="idx"
        :url="link.url"
        :type="link.type"
      />
    </div>

    <div v-if="isSubProject" class="sub-project-indicator">
      &#8627; {{ displayText(project.connectionTypeKey || 'connections.subProject') }}
    </div>
  </article>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGalleryStore } from '../stores/gallery'
import { useProjectsStore } from '../stores/projectsStore'
import { useAuthStore } from '../stores/auth'
import InlineEdit from './InlineEdit.vue'
import LinkChip from './LinkChip.vue'

const { t, te } = useI18n()

const props = defineProps({
  project: { type: Object, required: true },
  isSubProject: { type: Boolean, default: false }
})

const store = useGalleryStore()
const projectsStore = useProjectsStore()
const auth = useAuthStore()
const cardRef = ref(null)
const isHovered = ref(false)
const isDragging = ref(false)

// Display text: try i18n key first, then use raw value
function displayText(value) {
  if (!value) return ''
  // If it looks like an i18n key (contains dots), try translating
  if (typeof value === 'string' && value.includes('.') && te(value)) {
    return t(value)
  }
  return value
}

const canEdit = computed(() => store.canEditProject(props.project))
const canDrag = computed(() => canEdit.value)

const cardDimensions = computed(() => {
  if (store.calculatedCardSizes[props.project.id]) {
    return store.calculatedCardSizes[props.project.id]
  }
  return store.calculateCardSize(props.project)
})

onMounted(() => {
  if (cardRef.value) {
    setTimeout(() => {
      const rect = cardRef.value.getBoundingClientRect()
      const actualDimensions = {
        width: Math.max(210, Math.min(430, rect.width / store.zoom)),
        height: Math.max(240, Math.min(620, rect.height / store.zoom))
      }
      store.updateCardSize(props.project.id, actualDimensions)
    }, 100)
  }
})

const cardStyles = computed(() => {
  const position = props.project.computedPosition || props.project.position || { left: 0, top: 0 }
  const dim = cardDimensions.value
  const anim = store.cardAnimations[props.project.id]

  const baseStyles = {
    top: `${position.top}px`,
    left: `${position.left}px`,
    width: `${dim.width}px`,
    minHeight: `${dim.height}px`,
    cursor: canDrag.value ? 'grab' : 'pointer'
  }

  if (anim) {
    return {
      ...baseStyles,
      opacity: store.focusedType
        ? (props.project.type === store.focusedType ? '1' : '0.15')
        : anim.opacity,
      transform: anim.transform
    }
  }

  return {
    ...baseStyles,
    opacity: store.focusedType
      ? (props.project.type === store.focusedType ? '1' : '0.15')
      : '1',
    transform: 'translateZ(0)'
  }
})

const handleCardClick = (e) => {
  if (isDragging.value) return
  e.stopPropagation()
  store.openDetailView(props.project)
}

// Drag-and-drop for card repositioning
let dragStartX = 0
let dragStartY = 0

function handleDragStart(e) {
  if (!canDrag.value) return
  dragStartX = e.clientX
  dragStartY = e.clientY

  const onDragMove = (moveE) => {
    const dx = Math.abs(moveE.clientX - dragStartX)
    const dy = Math.abs(moveE.clientY - dragStartY)
    if (dx > 5 || dy > 5) {
      isDragging.value = true
    }
  }

  const onDragEnd = () => {
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
    if (isDragging.value) {
      setTimeout(() => { isDragging.value = false }, 100)
    }
  }

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

async function saveField(field, value) {
  if (!props.project._raw) return
  await projectsStore.updateProject(props.project.id, { [field]: value })
}
</script>
