import { describe, it, expect } from 'vitest'
import { encodeUrl, decodeUrl } from '../../src/tools/url-encoder'

describe('encodeUrl', () => {
  it('returns error on empty input', () => {
    const result = encodeUrl('', 'full')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error on whitespace-only input', () => {
    const result = encodeUrl('   ', 'component')
    expect(result.ok).toBe(false)
  })

  it('encodes full URL preserving structure', () => {
    const result = encodeUrl('https://example.com/path with spaces?q=hello world', 'full')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('https://example.com/path%20with%20spaces?q=hello%20world')
    }
  })

  it('encodes component aggressively', () => {
    const result = encodeUrl('hello world&foo=bar', 'component')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello%20world%26foo%3Dbar')
    }
  })

  it('component mode encodes slashes and colons', () => {
    const result = encodeUrl('https://example.com/', 'component')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('%3A')
      expect(result.value).toContain('%2F')
    }
  })

  it('full mode preserves colons and slashes', () => {
    const result = encodeUrl('https://example.com/', 'full')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('https://example.com/')
    }
  })
})

describe('decodeUrl', () => {
  it('returns error on empty input', () => {
    const result = decodeUrl('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('decodes encoded URL correctly', () => {
    const result = decodeUrl('https://example.com/path%20with%20spaces')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('https://example.com/path with spaces')
    }
  })

  it('returns error on malformed encoded URL', () => {
    const result = decodeUrl('%E0%A4%A')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('DECODE_ERROR')
    }
  })

  it('round-trips with full encode mode', () => {
    const original = 'https://example.com/search?q=hello world'
    const encoded = encodeUrl(original, 'full')
    expect(encoded.ok).toBe(true)
    if (encoded.ok) {
      const decoded = decodeUrl(encoded.value)
      expect(decoded.ok).toBe(true)
      if (decoded.ok) {
        expect(decoded.value).toBe(original)
      }
    }
  })

  it('handles special characters', () => {
    const result = decodeUrl('%C3%A9%C3%A0%C3%BC')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('\u00e9\u00e0\u00fc')
    }
  })
})
