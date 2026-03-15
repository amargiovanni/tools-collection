import { describe, it, expect } from 'vitest'
import { countDuplicates } from '../../src/tools/count-duplicates'

describe('countDuplicates', () => {
  it('returns error on empty input', () => {
    const result = countDuplicates('', { caseSensitive: false, sortByCount: false })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error on whitespace-only input', () => {
    const result = countDuplicates('  \n  ', { caseSensitive: false, sortByCount: false })
    expect(result.ok).toBe(false)
  })

  it('counts occurrences correctly', () => {
    const input = 'apple\nbanana\napple\napple\nbanana'
    const result = countDuplicates(input, { caseSensitive: false, sortByCount: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual([
        { value: 'apple', count: 3, percentage: 60 },
        { value: 'banana', count: 2, percentage: 40 },
      ])
    }
  })

  it('respects case sensitivity', () => {
    const input = 'Apple\napple\nAPPLE'
    const result = countDuplicates(input, { caseSensitive: true, sortByCount: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(3)
      expect(result.value.every(e => e.count === 1)).toBe(true)
    }
  })

  it('merges case variants when case insensitive', () => {
    const input = 'Apple\napple\nAPPLE'
    const result = countDuplicates(input, { caseSensitive: false, sortByCount: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(1)
      expect(result.value[0]!.count).toBe(3)
      expect(result.value[0]!.value).toBe('Apple') // first occurrence preserved
    }
  })

  it('sorts by count when sortByCount is true', () => {
    const input = 'b\na\nb\nb\na'
    const result = countDuplicates(input, { caseSensitive: true, sortByCount: true })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value[0]!.value).toBe('b')
      expect(result.value[0]!.count).toBe(3)
      expect(result.value[1]!.value).toBe('a')
      expect(result.value[1]!.count).toBe(2)
    }
  })

  it('sorts alphabetically by default', () => {
    const input = 'cherry\napple\nbanana'
    const result = countDuplicates(input, { caseSensitive: true, sortByCount: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.map(e => e.value)).toEqual(['apple', 'banana', 'cherry'])
    }
  })

  it('calculates percentages correctly', () => {
    const input = 'a\nb\nc\nd'
    const result = countDuplicates(input, { caseSensitive: true, sortByCount: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.every(e => e.percentage === 25)).toBe(true)
    }
  })

  it('handles single item', () => {
    const input = 'only'
    const result = countDuplicates(input, { caseSensitive: true, sortByCount: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual([{ value: 'only', count: 1, percentage: 100 }])
    }
  })
})
