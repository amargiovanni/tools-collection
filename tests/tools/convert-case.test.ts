import { describe, it, expect } from 'vitest'
import { convertCase } from '../../src/tools/convert-case'

describe('convertCase', () => {
  it('returns error for empty input', () => {
    const result = convertCase('', 'upper')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('converts to uppercase', () => {
    const result = convertCase('hello world', 'upper')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('HELLO WORLD')
    }
  })

  it('converts to lowercase', () => {
    const result = convertCase('Hello World', 'lower')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello world')
    }
  })

  it('converts to title case', () => {
    const result = convertCase('hello world foo', 'title')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('Hello World Foo')
    }
  })

  it('converts to camelCase', () => {
    const result = convertCase('hello world', 'camel')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('helloWorld')
    }
  })

  it('converts to snake_case', () => {
    const result = convertCase('hello world', 'snake')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello_world')
    }
  })

  it('converts to CONSTANT_CASE', () => {
    const result = convertCase('hello world', 'constant')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('HELLO_WORLD')
    }
  })

  it('collapses multiple spaces into a single underscore in snake_case', () => {
    const result = convertCase('hello   world', 'snake')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello_world')
    }
  })
})
