// Vitest Test Setup
import { config } from '@vue/test-utils'

// Global mocks for tests
config.global.mocks = {
  $t: (key) => key // Mock i18n translation function
}

// Provide any global plugins or components here
config.global.components = {}

// Suppress console warnings during tests (optional)
// const originalWarn = console.warn
// console.warn = (...args) => {
//   if (args[0]?.includes?.('Failed to resolve component')) return
//   originalWarn(...args)
// }
