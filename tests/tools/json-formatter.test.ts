import { describe, it, expect } from 'vitest'
import { formatJson, validateJson } from '../../src/tools/json-formatter'

describe('formatJson', () => {
  it('returns error for empty input', () => {
    const result = formatJson('', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error for whitespace-only input', () => {
    const result = formatJson('   ', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error for invalid JSON', () => {
    const result = formatJson('{invalid}', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_JSON')
    }
  })

  it('formats with 2-space indent', () => {
    const result = formatJson('{"a":1,"b":2}', 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('{\n  "a": 1,\n  "b": 2\n}')
    }
  })

  it('formats with 4-space indent', () => {
    const result = formatJson('{"a":1}', 4)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('{\n    "a": 1\n}')
    }
  })

  it('formats with tab indent', () => {
    const result = formatJson('{"a":1}', 'tab')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('{\n\t"a": 1\n}')
    }
  })

  it('formats compact (no whitespace)', () => {
    const result = formatJson('{ "a" : 1 , "b" : 2 }', 'compact')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('{"a":1,"b":2}')
    }
  })

  it('handles arrays', () => {
    const result = formatJson('[1,2,3]', 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('[\n  1,\n  2,\n  3\n]')
    }
  })

  it('handles nested objects', () => {
    const result = formatJson('{"a":{"b":1}}', 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('"b": 1')
    }
  })
})

describe('validateJson', () => {
  it('returns error for empty input', () => {
    const result = validateJson('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns true for valid JSON', () => {
    const result = validateJson('{"key":"value"}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(true)
    }
  })

  it('returns error for invalid JSON', () => {
    const result = validateJson('{bad json}')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_JSON')
    }
  })

  it('validates JSON arrays', () => {
    const result = validateJson('[1, 2, 3]')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(true)
    }
  })

  it('validates primitive values', () => {
    expect(validateJson('"hello"').ok).toBe(true)
    expect(validateJson('42').ok).toBe(true)
    expect(validateJson('true').ok).toBe(true)
    expect(validateJson('null').ok).toBe(true)
  })
})
