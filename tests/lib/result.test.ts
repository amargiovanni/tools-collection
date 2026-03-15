import { describe, it, expect } from 'vitest'
import { ok, err } from '../../src/lib/result'
import type { Result } from '../../src/lib/result'

describe('Result', () => {
  it('ok wraps a value', () => {
    const r = ok(42)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(42)
  })

  it('ok wraps a string', () => {
    const r = ok('hello')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe('hello')
  })

  it('err wraps an error', () => {
    const r = err('INVALID', 'bad input')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.code).toBe('INVALID')
      expect(r.error.message).toBe('bad input')
    }
  })

  it('Result type narrows correctly', () => {
    const r: Result<number> = ok(10)
    if (r.ok) {
      const n: number = r.value
      expect(n).toBe(10)
    }
  })

  it('err is assignable to Result<T>', () => {
    const r: Result<string> = err('FAIL', 'oops')
    expect(r.ok).toBe(false)
  })
})
