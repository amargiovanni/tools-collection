import { describe, it, expect } from 'vitest'
import { checkPasswordStrength } from '../../src/tools/password-strength'

describe('checkPasswordStrength', () => {
  it('returns error on empty input', () => {
    const result = checkPasswordStrength('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('rates a short simple password as weak', () => {
    const result = checkPasswordStrength('abc')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.level).toBe('weak')
      expect(result.value.score).toBeLessThanOrEqual(3)
    }
  })

  it('rates a medium complexity password correctly', () => {
    const result = checkPasswordStrength('Abcdef12')
    expect(result.ok).toBe(true)
    if (result.ok) {
      // len>=8: +2, uppercase: +1, lowercase: +1, numbers: +1 = 5
      expect(result.value.score).toBe(5)
      expect(result.value.level).toBe('medium')
    }
  })

  it('rates a strong password correctly', () => {
    const result = checkPasswordStrength('MyStr0ng!Pass#2024')
    expect(result.ok).toBe(true)
    if (result.ok) {
      // len>=8: +2, len>=12: +1, uppercase: +1, lowercase: +1, numbers: +1, symbols: +2, len>=16: +1 = 9 clamped to 8
      expect(result.value.score).toBe(8)
      expect(result.value.level).toBe('strong')
    }
  })

  it('penalizes repeated characters (3 repeats)', () => {
    const result = checkPasswordStrength('Aaaa1234!')
    expect(result.ok).toBe(true)
    if (result.ok) {
      // len>=8: +2, upper: +1, lower: +1, numbers: +1, symbols: +2 = 8
      // 'aaa' matches (.)\1{2,} => -1 => 7
      // But 'aaaa' also matches (.)\1{3,} => use -2 instead (no double penalty) => 6
      expect(result.value.score).toBe(6)
      expect(result.value.level).toBe('strong')
    }
  })

  it('penalizes 3 consecutive repeats with -1', () => {
    const result = checkPasswordStrength('Abccc12!')
    expect(result.ok).toBe(true)
    if (result.ok) {
      // len>=8: +2, upper: +1, lower: +1, numbers: +1, symbols: +2 = 7
      // 'ccc' matches (.)\1{2,} but not (.)\1{3,} => -1 => 6
      expect(result.value.score).toBe(6)
      expect(result.value.level).toBe('strong')
    }
  })

  it('provides correct checks structure', () => {
    const result = checkPasswordStrength('Test123!')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.checks).toEqual([
        { name: 'length', passed: true },
        { name: 'uppercase', passed: true },
        { name: 'lowercase', passed: true },
        { name: 'numbers', passed: true },
        { name: 'symbols', passed: true },
      ])
    }
  })

  it('provides suggestions for weak passwords', () => {
    const result = checkPasswordStrength('abc')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.suggestions.length).toBeGreaterThan(0)
      expect(result.value.suggestions).toContain('Use at least 8 characters')
    }
  })

  it('clamps score to minimum 0', () => {
    const result = checkPasswordStrength('aaa')
    expect(result.ok).toBe(true)
    if (result.ok) {
      // lowercase: +1, (.)\1{2,}: -1 = 0
      expect(result.value.score).toBe(0)
      expect(result.value.level).toBe('weak')
    }
  })

  it('clamps score to maximum 8', () => {
    const result = checkPasswordStrength('A1b2C3d4E5f6G7h!')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.score).toBeLessThanOrEqual(8)
    }
  })

  it('checks missing for numbers and symbols', () => {
    const result = checkPasswordStrength('abcdefgh')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const numbersCheck = result.value.checks.find(c => c.name === 'numbers')
      const symbolsCheck = result.value.checks.find(c => c.name === 'symbols')
      expect(numbersCheck?.passed).toBe(false)
      expect(symbolsCheck?.passed).toBe(false)
    }
  })
})
