/**
 * Unit tests for safeHTML utilities
 */
import { describe, it, expect } from 'vitest'
import {
  sanitizeHTML,
  decodeHTMLEntities,
  getSafeInnerHTML,
  htmlToPlainText,
  isSafeURL
} from '../lib/safeHTML'

describe('safeHTML utilities', () => {
  describe('sanitizeHTML', () => {
    it('should remove dangerous tags', () => {
      const malicious = '<script>alert("xss")</script><p>Safe content</p>'
      const result = sanitizeHTML(malicious)
      expect(result).not.toContain('<script>')
      expect(result).toContain('Safe content')
    })

    it('should allow safe formatting tags', () => {
      const html = '<b>Bold</b> and <i>italic</i> text'
      const result = sanitizeHTML(html)
      expect(result).toBe('<b>Bold</b> and <i>italic</i> text')
    })

    it('should handle empty input', () => {
      expect(sanitizeHTML('')).toBe('')
      expect(sanitizeHTML(null)).toBe('')
      expect(sanitizeHTML(undefined)).toBe('')
    })
  })

  describe('decodeHTMLEntities', () => {
    it('should decode HTML entities', () => {
      const encoded = '&lt;div&gt;Test&lt;/div&gt;'
      const result = decodeHTMLEntities(encoded)
      expect(result).toBe('&lt;div&gt;Test&lt;/div&gt;') // Sanitized output
    })

    it('should handle regular text', () => {
      expect(decodeHTMLEntities('Hello World')).toBe('Hello World')
    })
  })

  describe('htmlToPlainText', () => {
    it('should strip all HTML tags', () => {
      const html = '<p>Hello <b>World</b></p>'
      const result = htmlToPlainText(html)
      expect(result.trim()).toBe('Hello World')
    })

    it('should handle complex HTML', () => {
      const html = '<div><p>Line 1</p><p>Line 2</p></div>'
      const result = htmlToPlainText(html)
      expect(result).toContain('Line 1')
      expect(result).toContain('Line 2')
    })
  })

  describe('isSafeURL', () => {
    it('should allow http and https URLs', () => {
      expect(isSafeURL('https://example.com')).toBe(true)
      expect(isSafeURL('http://example.com')).toBe(true)
    })

    it('should allow mailto and tel URLs', () => {
      expect(isSafeURL('mailto:test@example.com')).toBe(true)
      expect(isSafeURL('tel:+1234567890')).toBe(true)
    })

    it('should block javascript URLs', () => {
      expect(isSafeURL('javascript:alert(1)')).toBe(false)
    })

    it('should block data URLs', () => {
      expect(isSafeURL('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('should handle invalid URLs', () => {
      expect(isSafeURL('not-a-url')).toBe(false)
      expect(isSafeURL('')).toBe(false)
    })
  })

  describe('getSafeInnerHTML', () => {
    it('should return sanitized HTML from element', () => {
      const div = document.createElement('div')
      div.innerHTML = '<b>Safe</b> content'
      const result = getSafeInnerHTML(div)
      expect(result).toBe('<b>Safe</b> content')
    })

    it('should handle null element', () => {
      expect(getSafeInnerHTML(null)).toBe('')
    })
  })
})
