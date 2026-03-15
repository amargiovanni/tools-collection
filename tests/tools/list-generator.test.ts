import { describe, it, expect } from 'vitest'
import { generateList } from '../../src/tools/list-generator'
import type { ListFormat } from '../../src/tools/list-generator'

describe('generateList', () => {
  it('returns error for empty input', () => {
    const result = generateList('', 'numbered')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error for whitespace-only input', () => {
    const result = generateList('   \n  \n   ', 'bulleted')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('creates a numbered list', () => {
    const result = generateList('apple\nbanana\ncherry', 'numbered')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('1. apple\n2. banana\n3. cherry')
    }
  })

  it('creates a bulleted list', () => {
    const result = generateList('apple\nbanana\ncherry', 'bulleted')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('• apple\n• banana\n• cherry')
    }
  })

  it('creates a comma-separated list', () => {
    const result = generateList('apple\nbanana\ncherry', 'comma')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('apple, banana, cherry')
    }
  })

  it('creates a pipe-separated list', () => {
    const result = generateList('apple\nbanana\ncherry', 'pipe')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('apple | banana | cherry')
    }
  })

  it('filters out empty lines', () => {
    const result = generateList('apple\n\nbanana\n\n\ncherry', 'numbered')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('1. apple\n2. banana\n3. cherry')
    }
  })

  it('handles a single line', () => {
    const result = generateList('only', 'comma')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('only')
    }
  })
})
