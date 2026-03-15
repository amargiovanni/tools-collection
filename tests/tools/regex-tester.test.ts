import { describe, it, expect } from 'vitest'
import { testRegex } from '../../src/tools/regex-tester'

const defaultFlags = { global: true, caseInsensitive: false, multiline: false }

describe('testRegex', () => {
  it('returns error for empty pattern', () => {
    const result = testRegex('', 'hello', defaultFlags)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error for empty text', () => {
    const result = testRegex('hello', '', defaultFlags)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error for invalid regex', () => {
    const result = testRegex('[invalid', 'test', defaultFlags)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_REGEX')
    }
  })

  it('finds simple matches', () => {
    const result = testRegex('\\d+', 'abc 123 def 456', defaultFlags)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(2)
      expect(result.value[0]?.fullMatch).toBe('123')
      expect(result.value[0]?.index).toBe(4)
      expect(result.value[1]?.fullMatch).toBe('456')
      expect(result.value[1]?.index).toBe(12)
    }
  })

  it('returns empty array when no matches', () => {
    const result = testRegex('xyz', 'hello world', defaultFlags)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(0)
    }
  })

  it('handles capture groups', () => {
    const result = testRegex('(\\w+)@(\\w+)', 'user@domain', defaultFlags)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(1)
      expect(result.value[0]?.fullMatch).toBe('user@domain')
      expect(result.value[0]?.groups).toEqual(['user', 'domain'])
    }
  })

  it('parses /pattern/flags format', () => {
    const result = testRegex('/hello/i', 'Hello World', { global: false, caseInsensitive: false, multiline: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(1)
      expect(result.value[0]?.fullMatch).toBe('Hello')
    }
  })

  it('respects case insensitive flag', () => {
    const result = testRegex('hello', 'Hello HELLO hello', { global: true, caseInsensitive: true, multiline: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(3)
    }
  })

  it('respects multiline flag', () => {
    const result = testRegex('^line', 'line1\nline2\nline3', { global: true, caseInsensitive: false, multiline: true })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(3)
    }
  })
})
