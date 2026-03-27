/**
 * Design Tokens System
 * Centralized UI constants for consistent styling across the application
 */

export const designTokens = {
  // Dimensions
  dimensions: {
    cardMinWidth: 150,
    cardMinHeight: 100,
    textMinWidth: 50,
    textMinHeight: 30,
    resizeHandleSize: 10,
    portSize: 8,
    detectionRadius: 50,
    snapThreshold: 20
  },

  // Spacing
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '0.75rem', // 12px
    lg: '1rem', // 16px
    xl: '1.5rem', // 24px
    xxl: '2rem' // 32px
  },

  // Typography
  typography: {
    fontFamily: "'Space Mono', monospace",
    fontSize: {
      xs: '0.6rem', // 9.6px
      sm: '0.7rem', // 11.2px
      md: '0.75rem', // 12px
      lg: '0.9rem', // 14.4px
      xl: '1rem' // 16px
    }
  },

  // Colors (CSS variable references)
  colors: {
    moss: 'var(--moss)',
    mossLight: 'var(--moss-light)',
    terracotta: 'var(--terracotta)',
    paper: 'var(--paper)',
    stencilOrange: 'var(--stencil-orange)'
  },

  // Connection colors by type
  connectionColors: {
    subProject: '#b55d3a',
    dependency: '#3b82f6',
    related: '#10b981',
    reference: '#8b5cf6',
    parent: '#f59e0b',
    child: '#ec4899',
    link: '#6b7280'
  },

  // Z-index layers
  zIndex: {
    canvas: 0,
    elements: 1,
    ports: 5,
    resizeHandles: 10,
    toolbars: 9000,
    menus: 9999
  },

  // Font upload constraints
  fontUpload: {
    maxSizeMB: 5,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedExtensions: ['ttf', 'otf', 'woff', 'woff2'],
    allowedMimeTypes: [
      'font/ttf',
      'font/otf',
      'font/woff',
      'font/woff2',
      'application/x-font-ttf',
      'application/x-font-otf',
      'application/font-woff',
      'application/font-woff2'
    ]
  }
}
