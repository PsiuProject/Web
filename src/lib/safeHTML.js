/**
 * Safe HTML Utilities
 * Provides XSS-safe methods for handling HTML content
 */
import DOMPurify from 'dompurify'

// Allowed tags and attributes for rich text formatting
const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'span', 'br', 'p', 'a']
const ALLOWED_ATTR = ['style', 'href', 'target', 'rel']

/**
 * Sanitize HTML string to prevent XSS attacks
 * @param {string} html - Raw HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR
  })
}

/**
 * Decode HTML entities safely
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded and sanitized text
 */
export function decodeHTMLEntities(text) {
  if (!text) return ''

  // Create a temporary element to decode entities
  const div = document.createElement('div')
  div.textContent = text
  const decoded = div.innerHTML

  // Always sanitize after decoding
  return sanitizeHTML(decoded)
}

/**
 * Get safe innerHTML from an element
 * This should be used instead of directly accessing element.innerHTML
 * @param {HTMLElement} element - DOM element
 * @returns {string} Sanitized HTML content
 */
export function getSafeInnerHTML(element) {
  if (!element) return ''
  return sanitizeHTML(element.innerHTML)
}

/**
 * Set safe innerHTML on an element
 * @param {HTMLElement} element - DOM element
 * @param {string} html - HTML to set (will be sanitized)
 */
export function setSafeInnerHTML(element, html) {
  if (!element) return
  element.innerHTML = sanitizeHTML(html)
}

/**
 * Extract plain text from HTML (strips all tags)
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export function htmlToPlainText(html) {
  if (!html) return ''

  const temp = document.createElement('div')
  temp.innerHTML = html
  // Get text content and normalize whitespace
  return temp.textContent || temp.innerText || ''
}

/**
 * Validate if a URL is safe for use in links
 * Prevents javascript: and data: URLs
 * @param {string} url - URL to validate
 * @returns {boolean} True if safe
 */
export function isSafeURL(url) {
  if (!url) return false

  try {
    const parsed = new URL(url, window.location.origin)
    // Allow http, https, mailto, tel protocols
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:']
    return safeProtocols.includes(parsed.protocol)
  } catch {
    // Invalid URL format
    return false
  }
}
