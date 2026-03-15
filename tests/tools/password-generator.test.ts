import { describe, it, expect } from 'vitest'
import { generatePasswords } from '../../src/tools/password-generator'

describe('generatePasswords', () => {
  it('returns error when no charset is selected', () => {
    const result = generatePasswords({
      length: 12,
      count: 1,
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('NO_CHARSET')
    }
  })

  it('returns error when length is shorter than selected charsets', () => {
    const result = generatePasswords({
      length: 2,
      count: 1,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('LENGTH_TOO_SHORT')
    }
  })

  it('generates the requested number of passwords', () => {
    const result = generatePasswords({
      length: 16,
      count: 5,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(5)
    }
  })

  it('generates passwords of the requested length', () => {
    const result = generatePasswords({
      length: 20,
      count: 3,
      uppercase: true,
      lowercase: true,
      numbers: false,
      symbols: false,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      result.value.forEach(pw => {
        expect(pw).toHaveLength(20)
      })
    }
  })

  it('includes at least one character from each selected charset', () => {
    const result = generatePasswords({
      length: 16,
      count: 10,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      result.value.forEach(pw => {
        expect(pw).toMatch(/[A-Z]/)
        expect(pw).toMatch(/[a-z]/)
        expect(pw).toMatch(/[0-9]/)
        expect(pw).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/)
      })
    }
  })

  it('caps count at 20', () => {
    const result = generatePasswords({
      length: 8,
      count: 100,
      uppercase: false,
      lowercase: true,
      numbers: false,
      symbols: false,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(20)
    }
  })

  it('generates passwords with only lowercase when only lowercase selected', () => {
    const result = generatePasswords({
      length: 12,
      count: 5,
      uppercase: false,
      lowercase: true,
      numbers: false,
      symbols: false,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      result.value.forEach(pw => {
        expect(pw).toMatch(/^[a-z]+$/)
      })
    }
  })
})
