import { describe, it, expect } from 'vitest'
import { generateAesKey } from '../../src/tools/aes-key-generator'

describe('generateAesKey', () => {
  it('generates a 128-bit key with the expected output sizes', () => {
    const result = generateAesKey(128)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.sizeBits).toBe(128)
      expect(result.value.sizeBytes).toBe(16)
      expect(result.value.hex).toMatch(/^[0-9A-F]{32}$/)
      expect(result.value.base64).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
    }
  })

  it('generates a 256-bit key with the expected hex length', () => {
    const result = generateAesKey(256)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.sizeBits).toBe(256)
      expect(result.value.sizeBytes).toBe(32)
      expect(result.value.hex).toHaveLength(64)
    }
  })

  it('rejects unsupported key sizes', () => {
    const result = generateAesKey(64)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_AES_KEY_SIZE')
    }
  })
})
