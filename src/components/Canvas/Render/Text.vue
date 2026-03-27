<template>
  <div
    ref="elementRef"
    class="canvas-element canvas-text"
    :class="{
      'with-box': element.content?.boxed,
      'permanent-box': element.style?.permanentBox,
      selected: isSelected && !isInlineEditing,
      'is-editing': isInlineEditing
    }"
    :style="textStyle"
    @click.stop="$emit('click', element)"
    @dblclick.stop="startInlineEdit('original')"
    @mouseenter="hovered = true"
    @mouseleave="onMouseLeave"
    @mouseup="onTextMouseUp"
  >
    <!-- Inline editing contenteditable -->
    <div
      v-if="isInlineEditing"
      ref="editableRef"
      class="text-editable"
      contenteditable="true"
      :style="editableStyle"
      @input="onInput"
      @keydown.escape.stop.prevent="saveEdit"
      @keydown.ctrl.enter.stop.prevent="saveEdit"
      @keydown.meta.enter.stop.prevent="saveEdit"
      @blur="onBlur"
      @mouseup="updateSelectionRect"
      @keyup="updateSelectionRect"
      @click="updateSelectionRect"
    />
    <!-- Display text -->
    <span
      v-else
      ref="displayRef"
      class="text-display"
      :style="displayStyle"
      v-html="formattedText"
    ></span>

    <!-- Font size resize handle (bottom-right corner, dynamic based on selection) -->
    <div
      v-if="(isSelected || hovered) && isEditMode && !isInlineEditing"
      class="font-size-resize-handle"
      :style="fontSizeResizeHandleStyle"
      @mousedown.stop.prevent="onFontSizeResizeStart"
      title="Drag to resize font size"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
      >
        <path d="M4 4h16v16" />
        <path d="M4 20l8-8" />
      </svg>
      <span class="font-size-preview">{{ element.font_size || 14 }}</span>
    </div>

    <!-- Hover toolbar: format + translation options -->
    <Teleport to="body" v-if="showToolbar && isEditMode && !isInlineEditing">
      <div
        class="text-hover-toolbar"
        :style="toolbarStyle"
        @mouseenter="toolbarHovered = true"
        @mouseleave="toolbarHovered = false"
      >
        <!-- Format buttons -->
        <div class="toolbar-group format-group">
          <button
            @mousedown.prevent="toggleStyle('fontWeight', 'bold', 'normal')"
            :class="{
              active: isInlineEditing
                ? currentFormatState.bold
                : element.style?.fontWeight === 'bold'
            }"
            title="Bold (Ctrl+B)"
            class="tb-btn"
          >
            <b>B</b>
          </button>
          <button
            @mousedown.prevent="toggleStyle('fontStyle', 'italic', 'normal')"
            :class="{
              active: isInlineEditing
                ? currentFormatState.italic
                : element.style?.fontStyle === 'italic'
            }"
            title="Italic (Ctrl+I)"
            class="tb-btn"
          >
            <i>I</i>
          </button>
          <button
            @mousedown.prevent="toggleStyle('textDecoration', 'line-through', 'none')"
            :class="{
              active: isInlineEditing
                ? currentFormatState.strikethrough
                : element.style?.textDecoration === 'line-through'
            }"
            title="Strikethrough"
            class="tb-btn"
          >
            <s>S</s>
          </button>
          <button
            @mousedown.prevent="toggleStyle('textDecoration', 'underline', 'none')"
            :class="{
              active: isInlineEditing
                ? currentFormatState.underline
                : element.style?.textDecoration === 'underline'
            }"
            title="Underline"
            class="tb-btn"
          >
            <u>U</u>
          </button>
          <button @mousedown.prevent="insertLink" title="Link (Ctrl+K)" class="tb-btn tb-icon">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
          <div class="font-dropdown-wrapper">
            <div class="font-controls-row">
              <button
                @mousedown.prevent="showFontPicker = !showFontPicker"
                title="Font"
                class="tb-btn tb-font-btn"
              >
                <span
                  class="font-preview"
                  :style="{
                    fontFamily: isInlineEditing
                      ? currentFormatState.fontFamily
                      : element.style?.fontFamily || 'inherit'
                  }"
                >
                  Aa
                </span>
                <svg
                  class="chevron"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <!-- Font size indicator with scrubbing -->
              <div class="font-size-indicator">
                <input
                  type="number"
                  :value="isInlineEditing ? currentFormatState.fontSize : element.font_size || 14"
                  @change="updateFontSize($event.target.value)"
                  @wheel.prevent="scrubFontSize($event)"
                  @mousedown="startFontSizeScrubbing($event)"
                  class="tb-font-size-input"
                  min="8"
                  max="200"
                  step="1"
                />
                <span class="size-unit">px</span>
              </div>
            </div>
            <!-- Modern Font picker dropdown -->
            <div v-if="showFontPicker" class="modern-font-picker" @click.stop>
              <div class="font-search-box">
                <svg
                  class="search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  v-model="fontSearchQuery"
                  type="text"
                  placeholder="Search fonts..."
                  class="font-search-input"
                />
              </div>
              <div class="font-section-title">Your Fonts</div>
              <div class="modern-font-list">
                <div
                  v-for="font in filteredUserFonts"
                  :key="font.name"
                  class="modern-font-option"
                  :class="{ active: element.style?.fontFamily === font.name }"
                  :style="{ fontFamily: font.name }"
                  @mousedown.prevent="applyFont(font.name)"
                >
                  <span class="font-name">{{ font.name }}</span>
                  <span v-if="font.isCustom" class="custom-badge">Custom</span>
                </div>
              </div>
              <div class="font-section-title">System Fonts</div>
              <div class="modern-font-list">
                <div
                  v-for="font in filteredSystemFonts"
                  :key="font.name"
                  class="modern-font-option"
                  :class="{ active: element.style?.fontFamily === font.name }"
                  :style="{ fontFamily: font.name }"
                  @mousedown.prevent="applyFont(font.name)"
                >
                  <span class="font-name">{{ font.name }}</span>
                </div>
              </div>
              <div class="font-picker-divider"></div>
              <label class="upload-font-btn-modern">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload Custom Font</span>
                <span class="upload-hint">.ttf, .otf, .woff, .woff2</span>
                <input type="file" accept=".ttf,.otf,.woff,.woff2" @change="onFontUpload" hidden />
              </label>
            </div>
          </div>
        </div>
        <!-- Translation options (only when not in original language) -->
        <div v-if="!isOriginalLocale" class="toolbar-group translation-group">
          <button
            @mousedown.prevent="startInlineEdit('original')"
            class="tb-btn trans-btn"
            title="Edit original text"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Original
          </button>
          <button
            @mousedown.prevent="startInlineEdit('translation')"
            class="tb-btn trans-btn active"
            title="Edit translation"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Translation
          </button>
        </div>
        <div v-else class="toolbar-group translation-group">
          <button
            @mousedown.prevent="startInlineEdit('original')"
            class="tb-btn trans-btn"
            title="Edit text"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Edit
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Resize handles (only when selected and in edit mode) -->
    <template v-if="isSelected && isEditMode && !isInlineEditing">
      <div class="resize-handle e" @mousedown.stop="onResizeStart($event, 'e')"></div>
      <div class="resize-handle w" @mousedown.stop="onResizeStart($event, 'w')"></div>
      <div class="resize-handle se" @mousedown.stop="onResizeStart($event, 'se')"></div>
      <div class="resize-handle sw" @mousedown.stop="onResizeStart($event, 'sw')"></div>
    </template>

    <!-- Connection ports (visible in connection mode on hover) - TOP and BOTTOM only for text -->
    <template v-if="showPorts">
      <ConnectionPort
        v-for="side in ['top', 'bottom']"
        :key="`port-${side}`"
        :side="side"
        :element="element"
        :color="portColor"
        :is-highlighted="
          highlightedPort?.elementId === element.id && highlightedPort?.side === side
        "
        @mousedown.stop
        @click="$emit('port-click', { element, side })"
        @drag-start="$emit('port-drag-start', { element, side, color: portColor })"
        @hover="$emit('port-hover', { element, side })"
        @leave="$emit('port-leave', { element, side })"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useI18nStore } from '../../../stores/i18n-store'
import { useElementsStore } from '../../../stores/elements'
import { usePermissionsStore } from '../../../stores/permissions'
import { useViewportStore } from '../../../stores/viewport'
import { useAuthStore } from '../../../stores/auth'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import { getErrorMessage } from '../../../lib/errorMessages'
import DOMPurify from 'dompurify'

import ConnectionPort from './ConnectionPort.vue'

const props = defineProps({
  element: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false },
  showPorts: { type: Boolean, default: false },
  highlightedPort: { type: Object, default: null }
})

const emit = defineEmits([
  'click',
  'dblclick',
  'update',
  'port-click',
  'port-drag-start',
  'port-hover',
  'port-leave'
])

const i18nStore = useI18nStore()
const elements = useElementsStore()
const permissions = usePermissionsStore()
const viewport = useViewportStore()

const hovered = ref(false)
const toolbarHovered = ref(false)
const isInlineEditing = ref(false)
const isCancelling = ref(false)
const editingTarget = ref('original') // 'original' | 'translation'
const editableRef = ref(null)
const displayRef = ref(null)
const elementRef = ref(null)
const showFontPicker = ref(false)
const currentHeight = ref(props.element.height)
const selectionRect = ref(null) // Track current selection/hover position
const fontSearchQuery = ref('')
const userCustomFonts = ref([]) // User's uploaded fonts
const hasInlineFormatting = ref(false) // Track if text has inline formatting
const currentFormatState = ref({
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  fontSize: props.element.font_size || 14,
  fontFamily: props.element.style?.fontFamily || 'inherit'
}) // Track current formatting at cursor position

const auth = useAuthStore()

// Helper to get localized error messages
function t(key, params = {}) {
  return getErrorMessage(key.category, key.message, i18nStore.currentLocale, params)
}

const systemFonts = [
  { name: 'Space Mono' },
  { name: 'Inter' },
  { name: 'Georgia' },
  { name: 'Arial' },
  { name: 'Courier New' },
  { name: 'Playfair Display' },
  { name: 'Roboto' },
  { name: 'Montserrat' },
  { name: 'Lato' },
  { name: 'Oswald' },
  { name: 'Raleway' },
  { name: 'Poppins' },
  { name: 'Open Sans' },
  { name: 'Nunito' },
  { name: 'Merriweather' },
  { name: 'Fira Code' }
]

// All fonts combined
const allFonts = computed(() => [...userCustomFonts.value, ...systemFonts])

// Filtered fonts based on search
const filteredUserFonts = computed(() => {
  if (!fontSearchQuery.value) return userCustomFonts.value
  return userCustomFonts.value.filter((f) =>
    f.name.toLowerCase().includes(fontSearchQuery.value.toLowerCase())
  )
})

const filteredSystemFonts = computed(() => {
  if (!fontSearchQuery.value) return systemFonts
  return systemFonts.filter((f) =>
    f.name.toLowerCase().includes(fontSearchQuery.value.toLowerCase())
  )
})

const isOriginalLocale = computed(() => i18nStore.currentLocale === 'pt') // 'pt' is original

// Show toolbar when hovered or toolbar is hovered
const showToolbar = computed(
  () => (hovered.value || toolbarHovered.value) && !isInlineEditing.value
)

// Port color based on connection type or default
const portColor = computed(() => {
  return props.element.color || '#b55d3a'
})

function getTextValue(forLocale) {
  const val = props.element.content?.text
  if (!val) return ''
  if (typeof val === 'object') return val[forLocale] ?? val.pt ?? val.en ?? ''
  return val
}

// Use i18nStore locale for reactivity - this is the key fix!
const displayText = computed(() => getTextValue(i18nStore.currentLocale))

// Format text with basic HTML (preserves newlines and inline formatting)
const formattedText = computed(() => {
  let text = displayText.value
  if (!text) return ''

  // If text already contains HTML tags (from inline formatting), preserve them
  if (text.includes('<')) {
    // Only convert newlines to <br> if not already inside HTML tags
    text = text.replace(/(?<!<\/?(?:b|strong|i|em|u|s|strike|span)[^>]*)>\n/g, '><br>')
    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'span', 'br', 'a'],
      ALLOWED_ATTR: ['style', 'href', 'target', 'rel']
    })
  }

  // Escape HTML and convert newlines to <br> for plain text
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  text = text.replace(/\n/g, '<br>')
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: ['br'],
    ALLOWED_ATTR: []
  })
})

const textStyle = computed(() => {
  const el = props.element
  const style = el.style || {}

  // Build transform string with rotation and scale
  let transform = `rotate(${el.rotation || 0}deg)`
  if (style.scaleX && style.scaleX !== 1) {
    transform = `scaleX(${style.scaleX}) ${transform}`
  }
  if (style.scaleY && style.scaleY !== 1) {
    transform = `scaleY(${style.scaleY}) ${transform}`
  }

  // Build border radius CSS
  let borderRadius = '0'
  if (style.borderRadius) {
    if (typeof style.borderRadius === 'number') {
      borderRadius = `${style.borderRadius}px`
    } else if (typeof style.borderRadius === 'object') {
      const { topLeft = 0, topRight = 0, bottomRight = 0, bottomLeft = 0 } = style.borderRadius
      borderRadius = `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`
    } else if (typeof style.borderRadius === 'string') {
      borderRadius = style.borderRadius
    }
  }

  // Build box-shadow CSS
  let boxShadow = 'none'
  if (style.shadow) {
    const { x = 0, y = 4, blur = 8, spread = 0, color = '#000000', opacity = 0.25 } = style.shadow
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    boxShadow = `${x}px ${y}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  // Build border CSS
  const borderWidth = style.borderWidth || 0
  const borderColor = style.borderColor || 'var(--moss)'
  const borderStyle = style.borderStyle || 'solid'
  const border = borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none'

  return {
    left: `${el.position_x}px`,
    top: `${el.position_y}px`,
    width: `${el.width}px`,
    minHeight: `${currentHeight.value}px`,
    fontSize: `${el.font_size || 14}px`,
    fontFamily: style.fontFamily || 'inherit',
    fontWeight: style.fontWeight || 'normal',
    fontStyle: style.fontStyle || 'normal',
    textDecoration: style.textDecoration || 'none',
    lineHeight: style.lineHeight || 1.5,
    letterSpacing: style.letterSpacing || 'normal',
    color: el.text_color || 'var(--paper)',
    backgroundColor: el.background || 'transparent',
    borderColor: borderColor,
    transform: transform,
    zIndex: el.z_index || 0,
    opacity: style.opacity ?? 1,
    borderRadius: borderRadius,
    boxShadow: boxShadow,
    border: border
  }
})

const editableStyle = computed(() => ({
  fontSize: `${props.element.font_size || 14}px`,
  fontFamily: props.element.style?.fontFamily || 'inherit',
  fontWeight: props.element.style?.fontWeight || 'normal',
  fontStyle: props.element.style?.fontStyle || 'normal',
  color: props.element.text_color || 'var(--paper)',
  lineHeight: props.element.style?.lineHeight || 1.5,
  minHeight: `${props.element.height}px`,
  width: '100%',
  outline: 'none',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word'
}))

const displayStyle = computed(() => ({
  fontWeight: props.element.style?.fontWeight || 'normal',
  fontStyle: props.element.style?.fontStyle || 'normal',
  textDecoration: props.element.style?.textDecoration || 'none'
}))

// Toolbar position: dynamically centered based on selection (character/word/phrase/text)
const toolbarStyle = computed(() => {
  const toolbarWidth = 420 // Updated for modern design
  const toolbarHeight = 50

  // If we have a selection rect, position centered above the specific selection
  if (selectionRect.value) {
    const rect = selectionRect.value
    const left = rect.left + rect.width / 2 - toolbarWidth / 2
    return {
      position: 'fixed',
      left: `${Math.max(10, Math.min(window.innerWidth - toolbarWidth - 10, left))}px`,
      top: `${Math.max(70, rect.top - toolbarHeight - 10)}px`,
      zIndex: 9000
    }
  }

  // Fallback: position above element center when hovering without selection
  const el = props.element
  const screenX = el.position_x * viewport.zoom + viewport.translateX
  const screenY = el.position_y * viewport.zoom + viewport.translateY
  const elWidth = el.width * viewport.zoom

  return {
    position: 'fixed',
    left: `${Math.max(10, screenX + elWidth / 2 - toolbarWidth / 2)}px`,
    top: `${Math.max(70, screenY - toolbarHeight - 10)}px`,
    zIndex: 9000
  }
})

// Font size resize handle position: bottom-right corner
const fontSizeResizeHandleStyle = computed(() => ({
  right: '-6px',
  bottom: '-6px'
}))

// Update selection rect when text is selected or mouse moves over text
function updateSelectionRect() {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      selectionRect.value = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      }
      // Detect current formatting at selection
      detectCurrentFormat()
      return
    }
  }
  // No selection - use element position for hover
  if (elementRef.value) {
    const rect = elementRef.value.getBoundingClientRect()
    selectionRect.value = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    }
    // Reset to element-level formatting
    currentFormatState.value = {
      bold: props.element.style?.fontWeight === 'bold',
      italic: props.element.style?.fontStyle === 'italic',
      underline: props.element.style?.textDecoration === 'underline',
      strikethrough: props.element.style?.textDecoration === 'line-through',
      fontSize: props.element.font_size || 14,
      fontFamily: props.element.style?.fontFamily || 'inherit'
    }
  }
}

// Detect current formatting state at cursor/selection position
function detectCurrentFormat() {
  if (!editableRef.value) return

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return

  const range = sel.getRangeAt(0)
  if (!range.commonAncestorContainer) return

  // Get the node at the current selection
  let node = range.commonAncestorContainer
  if (node.nodeType === 3) {
    // Text node
    node = node.parentNode
  }

  // Check if we're inside the editable area
  if (!editableRef.value.contains(node)) return

  // Get computed styles
  const computedStyle =
    window.getSelection().anchorNode?.nodeType === 3
      ? window.getSelection().anchorNode.parentElement?.style
      : node.style

  // Also check parent elements for inline formatting
  let currentNode = node
  let hasBold = false,
    hasItalic = false,
    hasUnderline = false,
    hasStrike = false

  while (currentNode && currentNode !== editableRef.value) {
    if (currentNode.nodeType === 1) {
      // Element node
      const tagName = currentNode.tagName.toLowerCase()
      const style = currentNode.style

      // Check tag names
      if (tagName === 'b' || tagName === 'strong') hasBold = true
      if (tagName === 'i' || tagName === 'em') hasItalic = true
      if (tagName === 'u') hasUnderline = true
      if (tagName === 's' || tagName === 'strike') hasStrike = true

      // Check inline styles
      if (style) {
        if (style.fontWeight === 'bold' || (style.fontWeight && parseInt(style.fontWeight) >= 600))
          hasBold = true
        if (style.fontStyle === 'italic') hasItalic = true
        if (style.textDecoration?.includes('underline')) hasUnderline = true
        if (style.textDecoration?.includes('line-through')) hasStrike = true
      }
    }
    currentNode = currentNode.parentNode
  }

  // Update format state
  currentFormatState.value = {
    bold:
      hasBold ||
      computedStyle?.fontWeight === 'bold' ||
      parseInt(computedStyle?.fontWeight || '400') >= 600,
    italic: hasItalic || computedStyle?.fontStyle === 'italic',
    underline: hasUnderline || computedStyle?.textDecoration?.includes('underline'),
    strikethrough: hasStrike || computedStyle?.textDecoration?.includes('line-through'),
    fontSize: parseInt(computedStyle?.fontSize) || props.element.font_size || 14,
    fontFamily:
      computedStyle?.fontFamily?.replace(/['"]/g, '') ||
      props.element.style?.fontFamily ||
      'inherit'
  }
}

function onTextMouseUp() {
  updateSelectionRect()
}

// Font size resize handler - drag diagonally to change font size
function onFontSizeResizeStart(e) {
  e.preventDefault()
  const startY = e.clientY
  const startSize = props.element.font_size || 14

  const onMove = (me) => {
    const dy = me.clientY - startY
    // Sensitivity: every 2 pixels = 1 font size unit
    const newSize = Math.max(8, Math.min(200, startSize + dy / 2))
    elements.updateElement(props.element.id, { font_size: Math.round(newSize) })
  }

  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onMouseLeave() {
  // Small delay to allow moving to toolbar
  setTimeout(() => {
    if (!toolbarHovered.value) {
      hovered.value = false
      selectionRect.value = null
    }
  }, 100)
}

function startInlineEdit(target) {
  if (!permissions.canEdit) return
  isCancelling.value = false
  editingTarget.value = target
  isInlineEditing.value = true
  showFontPicker.value = false
  nextTick(() => {
    if (editableRef.value) {
      const editLocale = target === 'original' ? 'pt' : i18nStore.currentLocale
      // Load HTML content to preserve/show existing formatting
      editableRef.value.innerHTML = getTextValue(editLocale)
      editableRef.value.focus()
      // Select all text initially
      const range = document.createRange()
      range.selectNodeContents(editableRef.value)
      range.collapse(false)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      // Initialize format state based on element styles
      currentFormatState.value = {
        bold: props.element.style?.fontWeight === 'bold',
        italic: props.element.style?.fontStyle === 'italic',
        underline: props.element.style?.textDecoration === 'underline',
        strikethrough: props.element.style?.textDecoration === 'line-through',
        fontSize: props.element.font_size || 14,
        fontFamily: props.element.style?.fontFamily || 'inherit'
      }
    }
  })
}

function onInput() {
  if (!editableRef.value) return
  // Auto-resize height based on content
  currentHeight.value = Math.max(props.element.height, editableRef.value.scrollHeight)
  // Detect current formatting as user types
  detectCurrentFormat()
  // Auto-convert markdown patterns
  convertMarkdownPatterns()
}

// Convert markdown-like patterns to HTML formatting
function convertMarkdownPatterns() {
  if (!editableRef.value || !isInlineEditing.value) return

  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return

  const range = sel.getRangeAt(0)
  const textNode = range.startContainer

  // Only process text nodes
  if (textNode.nodeType !== 3) return

  const text = textNode.textContent
  let modified = false

  // Pattern matching for markdown-style formatting
  // **bold** or __bold__
  const boldPattern = /(?:\*\*|__)(.+?)(?:\*\*|__)/g
  // *italic* or _italic_
  const italicPattern = /(?:\*|_)(.+?)(?:\*|_)/g
  // ~~strikethrough~~ or --strikethrough--
  const strikePattern = /(?:~~|--)(.+?)(?:~~|--)/g

  // Check if any patterns match
  if (boldPattern.test(text) || italicPattern.test(text) || strikePattern.test(text)) {
    // Reset regex for actual replacement
    boldPattern.lastIndex = 0
    italicPattern.lastIndex = 0
    strikePattern.lastIndex = 0

    let newText = text

    // Apply strikethrough first (to avoid conflicts)
    newText = newText.replace(strikePattern, '<s>$1</s>')

    // Apply bold
    newText = newText.replace(boldPattern, '<strong>$1</strong>')

    // Apply italic
    newText = newText.replace(italicPattern, '<em>$1</em>')

    // Replace the text node with HTML
    const span = document.createElement('span')
    span.innerHTML = newText

    // Preserve cursor position
    const offset = range.startOffset
    textNode.parentNode.replaceChild(span, textNode)

    // Restore cursor
    const newRange = document.createRange()
    const selObj = window.getSelection()

    // Try to position cursor at the end of the converted text
    let newPos = Math.min(offset, span.textContent.length)
    newRange.setStart(span.firstChild || span, newPos)
    newRange.collapse(true)
    selObj.removeAllRanges()
    selObj.addRange(newRange)

    modified = true
  }

  if (modified) {
    hasInlineFormatting.value = true
  }
}

function onBlur() {
  // Delay to check if we're clicking toolbar
  setTimeout(() => {
    if (!isCancelling.value && isInlineEditing.value) {
      saveEdit()
    }
  }, 150)
}

function saveEdit() {
  if (!isInlineEditing.value) return
  isInlineEditing.value = false
  // Use innerHTML to preserve inline formatting (bold, italic, etc.)
  const newText = editableRef.value?.innerHTML || ''
  const targetLocale = editingTarget.value === 'original' ? 'pt' : i18nStore.currentLocale
  const currentVal = props.element.content?.text
  const updated =
    typeof currentVal === 'object' && currentVal !== null
      ? { ...currentVal, [targetLocale]: newText }
      : { pt: newText }
  elements.updateElement(props.element.id, {
    content: { ...props.element.content, text: updated },
    height: Math.max(props.element.height, currentHeight.value)
  })
  hasInlineFormatting.value = false
}

function cancelEdit() {
  isCancelling.value = true
  isInlineEditing.value = false
  currentHeight.value = props.element.height
}

// Toggle inline style for selected text or whole element
function toggleStyle(key, onValue, offValue) {
  // Check if there's a text selection in the editable area
  const sel = window.getSelection()
  const hasSelection =
    sel && !sel.isCollapsed && editableRef.value && editableRef.value.contains(sel.anchorNode)

  if (hasSelection) {
    // Apply formatting to selected text only using execCommand
    const command =
      key === 'fontWeight'
        ? 'bold'
        : key === 'fontStyle'
          ? 'italic'
          : key === 'textDecoration' && onValue === 'underline'
            ? 'underline'
            : key === 'textDecoration' && onValue === 'line-through'
              ? 'strikeThrough'
              : null

    if (command) {
      document.execCommand(command, false, '')
    }

    // Mark that we have inline formatting
    hasInlineFormatting.value = true

    // Update format state immediately
    setTimeout(() => detectCurrentFormat(), 10)
  } else {
    // Apply to entire element (existing behavior)
    const currentValue = props.element.style?.[key]
    const newValue = currentValue === onValue ? offValue : onValue
    elements.updateElement(props.element.id, {
      style: { ...(props.element.style || {}), [key]: newValue }
    })

    // Update format state
    if (key === 'fontWeight') {
      currentFormatState.value.bold = newValue === 'bold'
    } else if (key === 'fontStyle') {
      currentFormatState.value.italic = newValue === 'italic'
    } else if (key === 'textDecoration') {
      if (onValue === 'underline') {
        currentFormatState.value.underline = newValue === 'underline'
      } else if (onValue === 'line-through') {
        currentFormatState.value.strikethrough = newValue === 'line-through'
      }
    }
  }

  // Keep focus and update toolbar state
  editableRef.value?.focus()
  updateSelectionRect()
}

function insertLink() {
  const url = prompt('Enter URL:')
  if (!url) return
  // For now, just store in content; could enhance later with proper link handling
  const currentText = displayText.value
  const linkText = `[${currentText}](${url})`
  if (!isInlineEditing.value) {
    startInlineEdit('original')
    nextTick(() => {
      if (editableRef.value) {
        editableRef.value.innerText = linkText
      }
    })
  }
}

function applyFont(font) {
  showFontPicker.value = false
  elements.updateElement(props.element.id, {
    style: { ...(props.element.style || {}), fontFamily: font }
  })
}

// Update font size
function updateFontSize(size) {
  const newSize = Math.max(8, Math.min(200, parseInt(size) || 14))
  elements.updateElement(props.element.id, { font_size: newSize })
  currentFormatState.value.fontSize = newSize
}

// Scrub font size with mouse wheel
function scrubFontSize(e) {
  const delta = Math.sign(e.deltaY) * -1
  const newSize = Math.max(
    8,
    Math.min(
      200,
      (isInlineEditing.value ? currentFormatState.value.fontSize : element.font_size || 14) + delta
    )
  )
  updateFontSize(newSize)
}

// Font size scrubbing state
let fontSizeScrubbing = false
let fontSizeScrubStart = 0
let fontSizeScrubStartValue = 0

function startFontSizeScrubbing(e) {
  if (e.button !== 0) return // Only left click
  fontSizeScrubbing = true
  fontSizeScrubStart = e.clientY
  fontSizeScrubStartValue = isInlineEditing.value
    ? currentFormatState.value.fontSize
    : element.font_size || 14

  document.addEventListener('mousemove', handleFontSizeScrubbing)
  document.addEventListener('mouseup', stopFontSizeScrubbing)
  document.body.style.cursor = 'ns-resize'
}

function handleFontSizeScrubbing(e) {
  if (!fontSizeScrubbing) return
  const deltaY = fontSizeScrubStart - e.clientY
  const newSize = Math.max(8, Math.min(200, fontSizeScrubStartValue + deltaY))
  updateFontSize(newSize)
}

function stopFontSizeScrubbing() {
  fontSizeScrubbing = false
  document.removeEventListener('mousemove', handleFontSizeScrubbing)
  document.removeEventListener('mouseup', stopFontSizeScrubbing)
  document.body.style.cursor = ''
}

// Font upload functionality with validation
async function onFontUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2)
    alert(t({ category: 'fontUpload', message: 'fileSizeExceeded' }, { size: sizeMB }))
    e.target.value = '' // Reset file input
    return
  }

  // Validate MIME type
  const allowedTypes = [
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    'application/x-font-ttf',
    'application/x-font-otf',
    'application/font-woff',
    'application/font-woff2'
  ]
  if (!allowedTypes.includes(file.type) && !/\.(ttf|otf|woff|woff2)$/i.test(file.name)) {
    alert(t({ category: 'fontUpload', message: 'invalidFileType' }))
    e.target.value = '' // Reset file input
    return
  }

  const ext = file.name.split('.').pop()
  const fontName = file.name.replace(/\.[^.]+$/, '')

  // Load font in browser
  const fontUrl = URL.createObjectURL(file)
  const fontFace = new FontFace(fontName, `url(${fontUrl})`)

  try {
    await fontFace.load()
    document.fonts.add(fontFace)

    // Add to user's font list
    userCustomFonts.value.push({ name: fontName, isCustom: true, url: fontUrl })

    // Save to Supabase for persistence
    if (isSupabaseConfigured && auth.userId) {
      const path = `fonts/${auth.userId}/${fontName}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(path, file, { upsert: true })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
        if (urlData?.publicUrl) {
          await supabase.from('custom_fonts').upsert({
            user_id: auth.userId,
            font_name: fontName,
            file_url: urlData.publicUrl
          })
        }
      } else {
        console.error('[Text] Font upload failed:', uploadError)
        alert(t({ category: 'fontUpload', message: 'uploadFailed' }))
      }
    }

    // Apply the font
    applyFont(fontName)
  } catch (err) {
    console.error('[Text] Failed to load font:', err)
    alert(t({ category: 'fontUpload', message: 'loadFailed' }))
  } finally {
    e.target.value = '' // Reset file input
  }
}

// Load user's custom fonts from Supabase
async function loadUserFonts() {
  if (!isSupabaseConfigured || !auth.userId) return

  const { data, error } = await supabase.from('custom_fonts').select('*').eq('user_id', auth.userId)

  if (!error && data) {
    for (const font of data) {
      try {
        const fontFace = new FontFace(font.font_name, `url(${font.file_url})`)
        await fontFace.load()
        document.fonts.add(fontFace)
        userCustomFonts.value.push({
          name: font.font_name,
          isCustom: true,
          url: font.file_url
        })
      } catch (err) {
        console.error('Failed to load custom font:', font.font_name, err)
      }
    }
  }
}

// Resize functionality
function onResizeStart(e, handle) {
  e.preventDefault()
  const startX = e.clientX
  const startY = e.clientY
  const startW = props.element.width
  const startH = props.element.height
  const startPX = props.element.position_x
  const startPY = props.element.position_y

  const onMove = (me) => {
    const dx = (me.clientX - startX) / viewport.zoom
    const dy = (me.clientY - startY) / viewport.zoom
    let newW = startW,
      newH = startH,
      newX = startPX,
      newY = startPY

    if (handle.includes('e')) newW = Math.max(50, startW + dx)
    if (handle.includes('w')) {
      newW = Math.max(50, startW - dx)
      newX = startPX + (startW - newW)
    }
    if (handle.includes('s')) newH = Math.max(30, startH + dy)
    if (handle.includes('n')) {
      newH = Math.max(30, startH - dy)
      newY = startPY + (startH - newH)
    }

    elements.updateElement(props.element.id, {
      width: newW,
      height: newH,
      position_x: newX,
      position_y: newY
    })
    currentHeight.value = newH
  }

  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// Sync height when element changes externally
watch(
  () => props.element.height,
  (h) => {
    currentHeight.value = h
  }
)

// Keyboard shortcuts for formatting
function handleKeyDown(e) {
  if (!isInlineEditing.value || !editableRef.value) return

  // Check for Ctrl/Cmd key combinations
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const ctrlKey = isMac ? e.metaKey : e.ctrlKey

  if (ctrlKey) {
    switch (e.key.toLowerCase()) {
      case 'b':
        e.preventDefault()
        toggleStyle('fontWeight', 'bold', 'normal')
        break
      case 'i':
        e.preventDefault()
        toggleStyle('fontStyle', 'italic', 'normal')
        break
      case 'u':
        e.preventDefault()
        toggleStyle('textDecoration', 'underline', 'none')
        break
      case 'k':
        e.preventDefault()
        insertLink()
        break
    }
  }
}

// Load fonts and setup on mount
onMounted(() => {
  loadUserFonts()
  // Add keyboard listener when inline editing
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  // Clean up font size scrubbing listeners if active
  if (fontSizeScrubbing) {
    document.removeEventListener('mousemove', handleFontSizeScrubbing)
    document.removeEventListener('mouseup', stopFontSizeScrubbing)
    document.body.style.cursor = ''
  }
})

watch(displayText, () => {
  // Text changed - font size handle will update automatically
})
</script>

<style scoped>
.canvas-text {
  position: absolute;
  padding: 0.5rem;
  cursor: pointer;
  white-space: pre-wrap;
  word-wrap: break-word;
  /* No border/outline by default - clean look */
}

/* Only show box when explicitly enabled */
.canvas-text.with-box {
  background: rgba(20, 20, 18, 0.9);
  border: 1px solid;
}

.canvas-text.permanent-box {
  border: 1px solid var(--moss);
}

/* Selection outline only when selected AND not inline editing */
.canvas-text.selected {
  outline: 2px solid var(--terracotta);
  outline-offset: 2px;
}

.canvas-text.is-editing {
  outline: 2px solid var(--stencil-orange);
  outline-offset: 0;
  background: rgba(20, 20, 18, 0.95);
}

.text-editable {
  display: block;
  cursor: text;
  caret-color: var(--terracotta);
  padding: 2px;
}

.text-display {
  display: block;
}

/* Resize handles */
.resize-handle {
  position: absolute;
  background: var(--terracotta);
  border: 1px solid var(--paper);
  z-index: 10;
}

.resize-handle.e {
  right: clamp(-3px, -0.4vw, -4px);
  top: calc(50% - clamp(6px, 0.8vh, 8px));
  width: clamp(6px, 0.8vw, 8px);
  height: clamp(12px, 1.5vh, 16px);
  cursor: e-resize;
}
.resize-handle.w {
  left: clamp(-3px, -0.4vw, -4px);
  top: calc(50% - clamp(6px, 0.8vh, 8px));
  width: clamp(6px, 0.8vw, 8px);
  height: clamp(12px, 1.5vh, 16px);
  cursor: w-resize;
}
.resize-handle.se {
  right: clamp(-3px, -0.4vw, -4px);
  bottom: clamp(-3px, -0.4vw, -4px);
  width: clamp(6px, 0.8vw, 8px);
  height: clamp(6px, 0.8vw, 8px);
  cursor: se-resize;
}
.resize-handle.sw {
  left: clamp(-3px, -0.4vw, -4px);
  bottom: clamp(-3px, -0.4vw, -4px);
  width: clamp(6px, 0.8vw, 8px);
  height: clamp(6px, 0.8vw, 8px);
  cursor: sw-resize;
}

/* Font size resize handle */
.font-size-resize-handle {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(2px, 0.3vw, 4px);
  width: auto;
  height: clamp(24px, 3vh, 28px);
  padding: 0 clamp(6px, 0.8vw, 8px);
  background: linear-gradient(135deg, rgba(181, 93, 58, 0.4) 0%, rgba(181, 93, 58, 0.3) 100%);
  border: 1px solid var(--terracotta);
  border-radius: clamp(4px, 0.6vw, 6px);
  cursor: nwse-resize;
  z-index: 12;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 clamp(3px, 0.5vh, 4px) clamp(8px, 1.5vh, 12px) rgba(181, 93, 58, 0.3);
  backdrop-filter: blur(clamp(3px, 0.5vh, 4px));
}

.canvas-text:hover .font-size-resize-handle,
.canvas-text.selected .font-size-resize-handle {
  opacity: 1;
  transform: scale(1.05);
}

.font-size-resize-handle:hover {
  background: linear-gradient(135deg, rgba(181, 93, 58, 0.6) 0%, rgba(181, 93, 58, 0.4) 100%);
  box-shadow: 0 clamp(4px, 0.6vh, 6px) clamp(12px, 2vh, 16px) rgba(181, 93, 58, 0.5);
  transform: scale(1.1);
}

.font-size-resize-handle svg {
  color: var(--paper);
  flex-shrink: 0;
}

.font-size-preview {
  font-family: 'Space Mono', monospace;
  font-size: clamp(9px, 1.1vw, 10px);
  font-weight: 700;
  color: var(--paper);
  white-space: nowrap;
  user-select: none;
}
</style>

<!-- Global styles for teleported toolbar -->
<style>
.text-hover-toolbar {
  display: flex;
  align-items: center;
  gap: clamp(2px, 0.3vw, 4px);
  background: linear-gradient(135deg, rgba(20, 20, 18, 0.98) 0%, rgba(30, 30, 28, 0.95) 100%);
  border: 1px solid rgba(106, 125, 91, 0.4);
  padding: clamp(4px, 0.6vh, 6px) clamp(6px, 0.8vw, 8px);
  border-radius: clamp(6px, 1vw, 8px);
  box-shadow:
    0 clamp(6px, 1vh, 8px) clamp(24px, 4vh, 32px) rgba(0, 0, 0, 0.4),
    0 clamp(2px, 0.3vh, 3px) clamp(6px, 1vh, 8px) rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  pointer-events: all;
  flex-wrap: nowrap;
  backdrop-filter: blur(clamp(10px, 1.5vh, 12px));
  max-width: none;
  position: relative;
  transition: all 0.2s ease;
}

.text-hover-toolbar::before {
  content: '';
  position: absolute;
  bottom: clamp(-4px, -0.6vh, -6px);
  left: 50%;
  transform: translateX(-50%);
  width: clamp(10px, 1.2vw, 12px);
  height: clamp(10px, 1.2vw, 12px);
  background: inherit;
  border-right: 1px solid rgba(106, 125, 91, 0.4);
  border-bottom: 1px solid rgba(106, 125, 91, 0.4);
  transform: translateX(-50%) rotate(45deg);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: clamp(2px, 0.3vw, 3px);
}

.toolbar-group + .toolbar-group {
  border-left: 1px solid rgba(106, 125, 91, 0.3);
  padding-left: clamp(6px, 0.8vw, 8px);
  margin-left: clamp(4px, 0.6vw, 6px);
}

.tb-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  color: var(--paper);
  padding: clamp(4px, 0.6vh, 6px) clamp(6px, 0.8vw, 8px);
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.65rem, 0.8vw, 0.75rem);
  cursor: pointer;
  border-radius: clamp(3px, 0.5vw, 4px);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  min-width: clamp(28px, 3.5vw, 32px);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(2px, 0.3vw, 4px);
}

.tb-btn:hover {
  background: rgba(106, 125, 91, 0.2);
  border-color: rgba(106, 125, 91, 0.5);
  transform: translateY(clamp(-1px, -0.2vh, -2px));
  box-shadow: 0 clamp(3px, 0.5vh, 4px) clamp(6px, 1vw, 8px) rgba(0, 0, 0, 0.2);
}

.tb-btn.active {
  background: linear-gradient(135deg, rgba(181, 93, 58, 0.3) 0%, rgba(181, 93, 58, 0.2) 100%);
  border-color: var(--terracotta);
  color: var(--terracotta);
  box-shadow: inset 0 clamp(1px, 0.2vh, 2px) clamp(3px, 0.5vh, 4px) rgba(181, 93, 58, 0.2);
}

.tb-btn b,
.tb-btn i,
.tb-btn s,
.tb-btn u {
  font-weight: inherit;
  font-style: inherit;
  text-decoration: inherit;
}

.trans-btn {
  color: var(--stencil-orange);
  font-size: clamp(0.6rem, 0.75vw, 0.7rem);
  padding: clamp(4px, 0.6vh, 6px) clamp(8px, 1vw, 10px);
}

.trans-btn.active {
  background: linear-gradient(135deg, rgba(255, 95, 31, 0.25) 0%, rgba(255, 95, 31, 0.15) 100%);
  border-color: rgba(255, 95, 31, 0.4);
}

/* Font dropdown wrapper */
.font-dropdown-wrapper {
  position: relative;
}

.font-controls-row {
  display: flex;
  align-items: center;
  gap: clamp(2px, 0.3vw, 3px);
}

.tb-font-btn {
  min-width: clamp(42px, 5vw, 48px);
}

/* Font size indicator */
.font-size-indicator {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(106, 125, 91, 0.3);
  border-radius: clamp(3px, 0.5vw, 4px);
  padding: clamp(2px, 0.3vh, 3px) clamp(4px, 0.6vw, 6px);
  gap: clamp(2px, 0.3vw, 4px);
  transition: all 0.15s;
}

.font-size-indicator:hover {
  border-color: rgba(106, 125, 91, 0.5);
  background: rgba(255, 255, 255, 0.05);
}

.tb-font-size-input {
  width: clamp(36px, 4.5vw, 42px);
  background: transparent;
  border: none;
  color: var(--paper);
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.65rem, 0.8vw, 0.75rem);
  font-weight: 600;
  text-align: right;
  padding: clamp(2px, 0.3vh, 3px) 0;
  outline: none;
  -moz-appearance: textfield;
}

.tb-font-size-input::-webkit-outer-spin-button,
.tb-font-size-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.tb-font-size-input:focus {
  color: var(--terracotta);
}

.size-unit {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.55rem, 0.7vw, 0.65rem);
  color: var(--moss-light);
  user-select: none;
}

.font-preview {
  font-size: clamp(0.75rem, 0.9vw, 0.85rem);
  font-weight: 600;
}

.chevron {
  opacity: 0.6;
  transition: transform 0.2s;
}

.showFontPicker .chevron {
  transform: rotate(180deg);
}

/* Modern Font picker */
.modern-font-picker {
  position: absolute;
  top: calc(100% + clamp(6px, 0.8vh, 8px));
  left: 0;
  width: clamp(280px, 35vw, 320px);
  max-height: clamp(380px, 50vh, 420px);
  background: linear-gradient(180deg, rgba(20, 20, 18, 0.98) 0%, rgba(25, 25, 23, 0.98) 100%);
  border: 1px solid rgba(106, 125, 91, 0.4);
  border-radius: clamp(10px, 1.5vw, 12px);
  box-shadow:
    0 clamp(12px, 2vh, 16px) clamp(32px, 6vh, 48px) rgba(0, 0, 0, 0.5),
    0 clamp(3px, 0.5vh, 4px) clamp(8px, 1.5vh, 12px) rgba(0, 0, 0, 0.3);
  z-index: 9002;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(clamp(12px, 2vh, 16px));
}

.modern-font-picker::before {
  content: '';
  position: absolute;
  top: clamp(-4px, -0.6vh, -6px);
  left: clamp(16px, 2vw, 20px);
  width: clamp(10px, 1.2vw, 12px);
  height: clamp(10px, 1.2vw, 12px);
  background: inherit;
  border-left: 1px solid rgba(106, 125, 91, 0.4);
  border-top: 1px solid rgba(106, 125, 91, 0.4);
  transform: rotate(45deg);
}

.font-search-box {
  position: relative;
  padding: clamp(10px, 1.5vh, 12px);
  border-bottom: 1px solid rgba(106, 125, 91, 0.2);
}

.search-icon {
  position: absolute;
  left: clamp(12px, 1.5vw, 14px);
  top: 50%;
  transform: translateY(-50%);
  color: var(--moss-light);
  pointer-events: none;
}

.font-search-input {
  width: 100%;
  padding: clamp(8px, 1.2vh, 10px) clamp(12px, 1.5vw, 14px) clamp(8px, 1.2vh, 10px)
    clamp(32px, 4.5vw, 40px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(106, 125, 91, 0.3);
  border-radius: clamp(6px, 1vw, 8px);
  color: var(--paper);
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.7rem, 0.85vw, 0.8rem);
  outline: none;
  transition: all 0.2s;
}

.font-search-input:focus {
  background: rgba(255, 255, 255, 0.07);
  border-color: var(--terracotta);
  box-shadow: 0 0 0 clamp(2px, 0.3vw, 3px) rgba(181, 93, 58, 0.15);
}

.font-section-title {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.55rem, 0.7vw, 0.65rem);
  color: var(--moss-light);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: clamp(8px, 1.2vh, 10px) clamp(10px, 1.5vw, 12px) clamp(4px, 0.6vh, 6px);
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(106, 125, 91, 0.15);
}

.modern-font-list {
  max-height: clamp(120px, 18vh, 140px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(106, 125, 91, 0.4) transparent;
}

.modern-font-list::-webkit-scrollbar {
  width: clamp(5px, 0.7vw, 6px);
}

.modern-font-list::-webkit-scrollbar-track {
  background: transparent;
}

.modern-font-list::-webkit-scrollbar-thumb {
  background: rgba(106, 125, 91, 0.4);
  border-radius: clamp(2px, 0.3vw, 3px);
}

.modern-font-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(8px, 1.2vh, 10px) clamp(12px, 1.5vw, 14px);
  font-size: clamp(0.8rem, 0.95vw, 0.9rem);
  color: var(--paper);
  cursor: pointer;
  transition: all 0.15s;
  border-bottom: 1px solid rgba(106, 125, 91, 0.08);
}

.modern-font-option:last-child {
  border-bottom: none;
}

.modern-font-option:hover {
  background: linear-gradient(90deg, rgba(106, 125, 91, 0.15) 0%, rgba(106, 125, 91, 0.08) 100%);
  border-left: 3px solid var(--moss);
  padding-left: clamp(9px, 1.3vw, 11px);
}

.modern-font-option.active {
  background: linear-gradient(90deg, rgba(181, 93, 58, 0.25) 0%, rgba(181, 93, 58, 0.15) 100%);
  color: var(--terracotta);
  border-left: 3px solid var(--terracotta);
  padding-left: clamp(9px, 1.3vw, 11px);
}

.font-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-badge {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.5rem, 0.65vw, 0.6rem);
  color: var(--stencil-orange);
  background: rgba(255, 95, 31, 0.15);
  padding: clamp(2px, 0.3vh, 3px) clamp(4px, 0.6vw, 6px);
  border-radius: clamp(2px, 0.3vw, 3px);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.font-picker-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(106, 125, 91, 0.3) 50%, transparent 100%);
  margin: clamp(6px, 0.8vh, 8px) 0;
}

.upload-font-btn-modern {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(4px, 0.6vh, 6px);
  padding: clamp(14px, 2vh, 16px) clamp(10px, 1.5vw, 12px);
  margin: clamp(6px, 0.8vh, 8px) clamp(10px, 1.5vw, 12px) clamp(10px, 1.5vh, 12px);
  background: linear-gradient(135deg, rgba(106, 125, 91, 0.15) 0%, rgba(106, 125, 91, 0.08) 100%);
  border: 1px dashed rgba(106, 125, 91, 0.4);
  border-radius: clamp(6px, 1vw, 8px);
  color: var(--paper);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.upload-font-btn-modern:hover {
  background: linear-gradient(135deg, rgba(106, 125, 91, 0.25) 0%, rgba(106, 125, 91, 0.15) 100%);
  border-color: var(--terracotta);
  transform: translateY(clamp(-2px, -0.3vh, -3px));
  box-shadow: 0 clamp(6px, 1vh, 8px) clamp(12px, 2vh, 16px) rgba(0, 0, 0, 0.2);
}

.upload-font-btn-modern svg {
  color: var(--stencil-orange);
  margin-bottom: clamp(3px, 0.5vh, 4px);
}

.upload-font-btn-modern span {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.65rem, 0.8vw, 0.75rem);
  font-weight: 600;
}

.upload-hint {
  font-size: clamp(0.55rem, 0.7vw, 0.65rem) !important;
  color: var(--moss-light) !important;
  font-weight: normal !important;
}
</style>
