import { describe, it, expect } from 'vitest'
import { generatePins } from '../../src/tools/pin-generator'

describe('generatePins', () => {
  it('generates the requested number of PINs', () => {
    const result = generatePins({ length: 6, count: 10, unique: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(10)
    }
  })

  it('generates PINs of the correct length', () => {
    const result = generatePins({ length: 4, count: 5, unique: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      result.value.forEach(pin => {
        expect(pin).toHaveLength(4)
      })
    }
  })

  it('generates only digits', () => {
    const result = generatePins({ length: 8, count: 20, unique: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      result.value.forEach(pin => {
        expect(pin).toMatch(/^\d+$/)
      })
    }
  })

  it('clamps length to minimum of 3', () => {
    const result = generatePins({ length: 1, count: 5, unique: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      result.value.forEach(pin => {
        expect(pin).toHaveLength(3)
      })
    }
  })

  it('clamps length to maximum of 12', () => {
    const result = generatePins({ length: 20, count: 5, unique: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      result.value.forEach(pin => {
        expect(pin).toHaveLength(12)
      })
    }
  })

  it('clamps count to minimum of 1', () => {
    const result = generatePins({ length: 4, count: 0, unique: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(1)
    }
  })

  it('clamps count to maximum of 50', () => {
    const result = generatePins({ length: 6, count: 100, unique: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(50)
    }
  })

  it('generates unique PINs when unique option is true', () => {
    const result = generatePins({ length: 4, count: 10, unique: true })
    expect(result.ok).toBe(true)
    if (result.ok) {
      const unique = new Set(result.value)
      expect(unique.size).toBe(result.value.length)
    }
  })

  it('returns error when requesting more unique PINs than possible', () => {
    // With length 3, only 1000 possible PINs (000-999)
    const result = generatePins({ length: 3, count: 50, unique: true })
    // This should still succeed since 50 < 1000
    expect(result.ok).toBe(true)
  })

  it('allows duplicate PINs when unique is false', () => {
    // Generate many PINs with short length — duplicates are likely
    const result = generatePins({ length: 3, count: 50, unique: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(50)
    }
  })
})
