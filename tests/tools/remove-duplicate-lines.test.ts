import { describe, it, expect } from 'vitest'
import { removeDuplicateLines } from '../../src/tools/remove-duplicate-lines'

describe('removeDuplicateLines', () => {
  it('returns error for empty input', () => {
    const result = removeDuplicateLines('', { caseSensitive: true, preserveOrder: true })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('removes duplicate lines preserving order', () => {
    const result = removeDuplicateLines('a\nb\na\nc\nb', { caseSensitive: true, preserveOrder: true })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('a\nb\nc')
    }
  })

  it('removes duplicates and sorts when preserveOrder is false', () => {
    const result = removeDuplicateLines('c\na\nb\na', { caseSensitive: true, preserveOrder: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('a\nb\nc')
    }
  })

  it('case-insensitive deduplication keeps first occurrence', () => {
    const result = removeDuplicateLines('Hello\nhello\nHELLO', { caseSensitive: false, preserveOrder: true })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('Hello')
    }
  })

  it('case-sensitive treats different cases as unique', () => {
    const result = removeDuplicateLines('Hello\nhello\nHELLO', { caseSensitive: true, preserveOrder: true })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('Hello\nhello\nHELLO')
    }
  })

  it('handles input with no duplicates', () => {
    const result = removeDuplicateLines('a\nb\nc', { caseSensitive: true, preserveOrder: true })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('a\nb\nc')
    }
  })

  it('handles single line', () => {
    const result = removeDuplicateLines('only', { caseSensitive: true, preserveOrder: true })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('only')
    }
  })
})
