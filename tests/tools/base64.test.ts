import { describe, it, expect } from 'vitest'
import { encodeBase64, decodeBase64 } from '../../src/tools/base64'

describe('encodeBase64', () => {
  it('returns error on empty input', () => {
    const result = encodeBase64('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error on whitespace-only input', () => {
    const result = encodeBase64('   ')
    expect(result.ok).toBe(false)
  })

  it('encodes ASCII text correctly', () => {
    const result = encodeBase64('Hello, World!')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('SGVsbG8sIFdvcmxkIQ==')
    }
  })

  it('encodes UTF-8 characters correctly', () => {
    const result = encodeBase64('\u00e9\u00e0\u00fc')
    expect(result.ok).toBe(true)
    if (result.ok) {
      // Verify it round-trips
      const decoded = decodeBase64(result.value)
      expect(decoded.ok).toBe(true)
      if (decoded.ok) {
        expect(decoded.value).toBe('\u00e9\u00e0\u00fc')
      }
    }
  })

  it('handles emoji (multi-byte UTF-8)', () => {
    const result = encodeBase64('\u{1F680}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const decoded = decodeBase64(result.value)
      expect(decoded.ok).toBe(true)
      if (decoded.ok) {
        expect(decoded.value).toBe('\u{1F680}')
      }
    }
  })
})

describe('decodeBase64', () => {
  it('returns error on empty input', () => {
    const result = decodeBase64('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('decodes valid Base64 correctly', () => {
    const result = decodeBase64('SGVsbG8sIFdvcmxkIQ==')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('Hello, World!')
    }
  })

  it('returns error on invalid Base64 input', () => {
    const result = decodeBase64('not-valid-base64!!!')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('DECODE_ERROR')
    }
  })

  it('round-trips plain text', () => {
    const original = 'The quick brown fox jumps over the lazy dog'
    const encoded = encodeBase64(original)
    expect(encoded.ok).toBe(true)
    if (encoded.ok) {
      const decoded = decodeBase64(encoded.value)
      expect(decoded.ok).toBe(true)
      if (decoded.ok) {
        expect(decoded.value).toBe(original)
      }
    }
  })
})
