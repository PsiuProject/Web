import { ref } from 'vue'

/**
 * Composable for managing context menus
 * @param {string} id - Unique identifier for this menu instance
 */
export function useContextMenu(id = 'default') {
  const isVisible = ref(false)
  const position = ref({ x: 0, y: 0 })
  const menuItems = ref([])
  const menuTitle = ref('')

  function show(x, y, items, title = '') {
    position.value = { x, y }
    menuItems.value = items || []
    menuTitle.value = title || ''
    isVisible.value = true
  }

  function hide() {
    isVisible.value = false
  }

  function toggle(x, y, items, title = '') {
    if (isVisible.value) {
      hide()
    } else {
      show(x, y, items, title)
    }
  }

  return {
    isVisible,
    position,
    menuItems,
    menuTitle,
    show,
    hide,
    toggle
  }
}

// Common menu item factories
export const MenuItems = {
  // Canvas menu items
  canvas: (permissions) => [
    {
      label: 'Add Text',
      icon: 'T',
      action: 'add-text',
      shortcut: 'T'
    },
    {
      label: 'Add Image',
      icon: '📷',
      action: 'add-image',
      shortcut: 'I'
    },
    {
      label: 'Add Button',
      icon: '☐',
      action: 'add-button',
      shortcut: 'B'
    },
    {
      label: 'Add Link',
      icon: '🔗',
      action: 'add-link',
      shortcut: 'L'
    },
    { separator: true },
    {
      label: 'Add Card',
      icon: '▦',
      action: 'add-card',
      shortcut: 'C'
    },
    { separator: true },
    {
      label: 'Toggle Grid',
      icon: '⊞',
      action: 'toggle-grid'
    },
    {
      label: 'Center View',
      icon: '◎',
      action: 'center-view'
    },
    ...(permissions?.canEdit
      ? [
          { separator: true },
          {
            label: 'Clear All',
            icon: '🗑',
            action: 'clear-all',
            danger: true
          }
        ]
      : [])
  ],

  // Card menu items
  card: (element, permissions) => [
    {
      label: 'Edit Card',
      icon: '✎',
      action: 'edit-card'
    },
    {
      label: 'Duplicate',
      icon: '❐',
      action: 'duplicate-card',
      shortcut: 'D'
    },
    { separator: true },
    {
      label: 'Bring to Front',
      icon: '⇪',
      action: 'bring-front'
    },
    {
      label: 'Send to Back',
      icon: '⇩',
      action: 'send-back'
    },
    { separator: true },
    {
      label: 'Connection Type',
      icon: '🔌',
      action: 'connection-type'
    },
    ...(permissions?.canEdit
      ? [
          { separator: true },
          {
            label: 'Delete',
            icon: '🗑',
            action: 'delete-card',
            danger: true,
            shortcut: 'Del'
          }
        ]
      : [])
  ],

  // Text cell menu items
  textCell: (cell, permissions) => [
    {
      label: 'Edit Text',
      icon: '✎',
      action: 'edit-text'
    },
    {
      label: 'Bold',
      icon: 'B',
      action: 'format-bold',
      shortcut: 'Ctrl+B'
    },
    {
      label: 'Italic',
      icon: 'I',
      action: 'format-italic',
      shortcut: 'Ctrl+I'
    },
    {
      label: 'Underline',
      icon: 'U',
      action: 'format-underline',
      shortcut: 'Ctrl+U'
    },
    { separator: true },
    {
      label: 'Increase Font',
      icon: 'A+',
      action: 'font-increase'
    },
    {
      label: 'Decrease Font',
      icon: 'A-',
      action: 'font-decrease'
    },
    { separator: true },
    {
      label: 'Align Left',
      icon: '≡',
      action: 'align-left'
    },
    {
      label: 'Align Center',
      icon: '≡',
      action: 'align-center'
    },
    {
      label: 'Align Right',
      icon: '≡',
      action: 'align-right'
    },
    ...(permissions?.canEdit
      ? [
          { separator: true },
          {
            label: 'Delete Cell',
            icon: '🗑',
            action: 'delete-cell',
            danger: true
          }
        ]
      : [])
  ],

  // Image cell menu items
  imageCell: (cell, permissions) => [
    {
      label: 'Replace Image',
      icon: '📷',
      action: 'replace-image'
    },
    {
      label: 'Remove Image',
      icon: '🗑',
      action: 'remove-image'
    },
    { separator: true },
    {
      label: 'Fit Cover',
      icon: '⛶',
      action: 'fit-cover'
    },
    {
      label: 'Fit Contain',
      icon: '⛶',
      action: 'fit-contain'
    },
    { separator: true },
    {
      label: 'Open Original',
      icon: '🔗',
      action: 'open-original'
    },
    ...(permissions?.canEdit
      ? [
          { separator: true },
          {
            label: 'Delete Cell',
            icon: '🗑',
            action: 'delete-cell',
            danger: true
          }
        ]
      : [])
  ],

  // Button cell menu items
  buttonCell: (cell, permissions) => [
    {
      label: 'Edit Button',
      icon: '✎',
      action: 'edit-button'
    },
    {
      label: 'Edit URL',
      icon: '🔗',
      action: 'edit-url'
    },
    { separator: true },
    {
      label: 'Change Color',
      icon: '🎨',
      action: 'change-color'
    },
    {
      label: 'Test Link',
      icon: '↗',
      action: 'test-link'
    },
    ...(permissions?.canEdit
      ? [
          { separator: true },
          {
            label: 'Delete Cell',
            icon: '🗑',
            action: 'delete-cell',
            danger: true
          }
        ]
      : [])
  ],

  // Link cell menu items
  linkCell: (cell, permissions) => [
    {
      label: 'Edit Link',
      icon: '✎',
      action: 'edit-link'
    },
    {
      label: 'Edit URL',
      icon: '🔗',
      action: 'edit-url'
    },
    { separator: true },
    {
      label: 'Open in New Tab',
      icon: '↗',
      action: 'open-new-tab'
    },
    {
      label: 'Copy URL',
      icon: '❐',
      action: 'copy-url'
    },
    ...(permissions?.canEdit
      ? [
          { separator: true },
          {
            label: 'Delete Cell',
            icon: '🗑',
            action: 'delete-cell',
            danger: true
          }
        ]
      : [])
  ],

  // Connection menu items
  connection: (connection) => [
    {
      label: 'Edit Connection',
      icon: '✎',
      action: 'edit-connection'
    },
    {
      label: 'Change Type',
      icon: '🔌',
      action: 'change-type'
    },
    {
      label: 'Change Color',
      icon: '🎨',
      action: 'change-color'
    },
    { separator: true },
    {
      label: 'Reverse Direction',
      icon: '⇄',
      action: 'reverse-direction'
    },
    { separator: true },
    {
      label: 'Delete Connection',
      icon: '🗑',
      action: 'delete-connection',
      danger: true
    }
  ],

  // Toolbar menu items
  toolbar: () => [
    {
      label: 'Customize Toolbar',
      icon: '⚙',
      action: 'customize-toolbar'
    },
    { separator: true },
    {
      label: 'Show Shortcuts',
      icon: '⌨',
      action: 'show-shortcuts'
    },
    {
      label: 'Reset Layout',
      icon: '↺',
      action: 'reset-layout'
    }
  ],

  // Properties panel menu items
  propertiesPanel: (element) => [
    {
      label: 'Reset Position',
      icon: '⊞',
      action: 'reset-position'
    },
    {
      label: 'Reset Size',
      icon: '⤢',
      action: 'reset-size'
    },
    {
      label: 'Reset Rotation',
      icon: '↻',
      action: 'reset-rotation'
    },
    { separator: true },
    {
      label: 'Reset All',
      icon: '↺',
      action: 'reset-all',
      danger: true
    },
    { separator: true },
    {
      label: 'Copy Style',
      icon: '❐',
      action: 'copy-style'
    },
    {
      label: 'Paste Style',
      icon: '📋',
      action: 'paste-style'
    }
  ]
}
