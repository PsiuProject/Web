/**
 * Logger utility with environment-based filtering
 * Replaces console.log/warn/error calls throughout the application
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
}

// Set log level based on environment
const currentLevel = import.meta.env.PROD ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG

const formatMessage = (level, ...args) => {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level}]`
  return [prefix, ...args]
}

export const logger = {
  debug: (...args) => {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.debug(...formatMessage('DEBUG', ...args))
    }
  },

  info: (...args) => {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.info(...formatMessage('INFO', ...args))
    }
  },

  warn: (...args) => {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(...formatMessage('WARN', ...args))
    }
  },

  error: (...args) => {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(...formatMessage('ERROR', ...args))
    }
  }
}
