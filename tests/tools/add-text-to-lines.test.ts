import { describe, it, expect } from 'vitest'
import { addTextToLines } from '../../src/tools/add-text-to-lines'

describe('addTextToLines', () => {
  it('returns error for empty input', () => {
    const result = addTextToLines('', '> ', 'start')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('adds text to the start of each line', () => {
    const result = addTextToLines('hello\nworld', '> ', 'start')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('> hello\n> world')
    }
  })

  it('adds text to the end of each line', () => {
    const result = addTextToLines('hello\nworld', ';', 'end')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello;\nworld;')
    }
  })

  it('handles single line input', () => {
    const result = addTextToLines('hello', '-- ', 'start')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('-- hello')
    }
  })

  it('preserves empty lines in the middle', () => {
    const result = addTextToLines('a\n\nb', '> ', 'start')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('> a\n> \n> b')
    }
  })

  it('handles empty addition string', () => {
    const result = addTextToLines('hello\nworld', '', 'start')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello\nworld')
    }
  })
})
