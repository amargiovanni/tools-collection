import { describe, it, expect } from 'vitest'
import { removeLinesContaining } from '../../src/tools/remove-lines-containing'

describe('removeLinesContaining', () => {
  it('returns error for empty input', () => {
    const result = removeLinesContaining('', { terms: ['foo'], caseSensitive: false })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns all lines when terms array is empty', () => {
    const result = removeLinesContaining('hello\nworld', { terms: [], caseSensitive: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.output).toBe('hello\nworld')
      expect(result.value.removed).toBe(0)
      expect(result.value.kept).toBe(2)
    }
  })

  it('removes lines containing a term (case-insensitive)', () => {
    const input = 'hello world\ngoodbye world\nhello there'
    const result = removeLinesContaining(input, { terms: ['goodbye'], caseSensitive: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.output).toBe('hello world\nhello there')
      expect(result.value.removed).toBe(1)
      expect(result.value.kept).toBe(2)
    }
  })

  it('case-insensitive matching removes regardless of case', () => {
    const input = 'Hello World\nhello world\nHELLO WORLD'
    const result = removeLinesContaining(input, { terms: ['hello'], caseSensitive: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.output).toBe('')
      expect(result.value.removed).toBe(3)
      expect(result.value.kept).toBe(0)
    }
  })

  it('case-sensitive matching only removes exact case matches', () => {
    const input = 'Hello World\nhello world\nHELLO WORLD'
    const result = removeLinesContaining(input, { terms: ['hello'], caseSensitive: true })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.output).toBe('Hello World\nHELLO WORLD')
      expect(result.value.removed).toBe(1)
      expect(result.value.kept).toBe(2)
    }
  })

  it('removes lines matching any of multiple terms', () => {
    const input = 'apple pie\nbanana split\ncherry tart\ndate cake'
    const result = removeLinesContaining(input, { terms: ['apple', 'cherry'], caseSensitive: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.output).toBe('banana split\ndate cake')
      expect(result.value.removed).toBe(2)
      expect(result.value.kept).toBe(2)
    }
  })

  it('handles single line input', () => {
    const result = removeLinesContaining('hello', { terms: ['hello'], caseSensitive: true })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.output).toBe('')
      expect(result.value.removed).toBe(1)
      expect(result.value.kept).toBe(0)
    }
  })
})
