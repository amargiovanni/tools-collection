import { describe, it, expect } from 'vitest'
import { validateNonEmpty } from '../../src/lib/validation'

describe('validateNonEmpty', () => {
  it('returns error for empty string', () => {
    const result = validateNonEmpty('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error for whitespace-only string', () => {
    const result = validateNonEmpty('   ')
    expect(result.ok).toBe(false)
  })

  it('returns trimmed value for non-empty string', () => {
    const result = validateNonEmpty('  hello  ')
    expect(result).toEqual({ ok: true, value: 'hello' })
  })

  it('returns value as-is when no trimming needed', () => {
    const result = validateNonEmpty('hello')
    expect(result).toEqual({ ok: true, value: 'hello' })
  })
})
