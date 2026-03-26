<!-- Canvas Card wrapper - uses the same ProjectCard component as gallery -->
<template>
  <ProjectCard
    :project="projectData"
    :isSubProject="!!element.isSubProject"
    :clickToNavigate="false"
    :isSelected="isSelected"
    :canvasMode="true"
    @dragstart="$emit('dragstart', $event, element)"
    @click="$emit('click', element)"
    @dblclick="$emit('dblclick', element)"
  />
</template>

<script setup>
import { computed } from 'vue'
import ProjectCard from '../../ProjectCard.vue'

const props = defineProps({
  element: { type: Object, required: true },
  isSelected: { type: Boolean, default: false }
})

defineEmits(['click', 'dblclick', 'dragstart'])

// Convert canvas element format to project format expected by ProjectCard
const projectData = computed(() => ({
  id: props.element.id,
  type: props.element.content?.status || 'active',
  size: props.element.size || 'card-md',
  statusTagKey: props.element.content?.statusTag || `status.${props.element.content?.status || 'active'}`,
  titleKey: props.element.content?.title || '',
  descriptionKey: props.element.content?.description || '',
  territory: props.element.content?.territory || 'Brasil',
  axis: props.element.content?.axis || [],
  category: props.element.content?.category,
  kpiLabelKey: props.element.content?.kpi_label,
  kpiValue: props.element.content?.kpi_value,
  kpiDetail: props.element.content?.kpi_detail,
  meta: props.element.content?.meta || [],
  links: props.element.content?.links || [],
  privacy: props.element.content?.privacy || 'private',
  owner_id: props.element.owner_id,
  position_x: props.element.position_x || 0,
  position_y: props.element.position_y || 0,
  parentId: props.element.parent_id,
  connectionTypeKey: props.element.content?.connectionType,
  _raw: {
    title: props.element.content?.title,
    description: props.element.content?.description
  },
  // For canvas positioning
  computedPosition: {
    left: props.element.position_x || 0,
    top: props.element.position_y || 0
  }
}))
</script>

<style scoped>
/* No styles needed - ProjectCard handles all styling */
</style>
