import { describe, it, expect } from 'vitest'
import { removeLineBreaks } from '../../src/tools/remove-line-breaks'

describe('removeLineBreaks', () => {
  it('returns error for empty input', () => {
    const result = removeLineBreaks('', { type: 'space' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('replaces line breaks with spaces', () => {
    const result = removeLineBreaks('hello\nworld\nfoo', { type: 'space' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello world foo')
    }
  })

  it('removes line breaks entirely', () => {
    const result = removeLineBreaks('hello\nworld', { type: 'none' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('helloworld')
    }
  })

  it('replaces line breaks with custom string', () => {
    const result = removeLineBreaks('hello\nworld', { type: 'custom', value: ' -- ' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello -- world')
    }
  })

  it('collapses consecutive line breaks', () => {
    const result = removeLineBreaks('hello\n\n\nworld', { type: 'space' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello world')
    }
  })

  it('handles Windows-style \\r\\n line breaks', () => {
    const result = removeLineBreaks('hello\r\nworld', { type: 'space' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello world')
    }
  })

  it('returns input unchanged when there are no line breaks', () => {
    const result = removeLineBreaks('no breaks here', { type: 'space' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('no breaks here')
    }
  })
})
