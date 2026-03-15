import { describe, it, expect } from 'vitest'
import { computeDiff } from '../../src/tools/diff-checker'

const noOptions = { ignoreCase: false, ignoreWhitespace: false }

describe('computeDiff', () => {
  it('returns error when both inputs are empty', () => {
    const result = computeDiff('', '', noOptions)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('detects identical texts', () => {
    const result = computeDiff('hello\nworld', 'hello\nworld', noOptions)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.additions).toBe(0)
      expect(result.value.deletions).toBe(0)
      expect(result.value.unchanged).toBe(2)
      expect(result.value.lines).toHaveLength(2)
      expect(result.value.lines[0]?.type).toBe('unchanged')
    }
  })

  it('detects additions only', () => {
    const result = computeDiff('', 'new line', noOptions)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.additions).toBe(1)
      expect(result.value.deletions).toBe(0)
      expect(result.value.lines[0]?.type).toBe('added')
    }
  })

  it('detects deletions only', () => {
    const result = computeDiff('old line', '', noOptions)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.deletions).toBe(1)
      expect(result.value.additions).toBe(0)
      expect(result.value.lines[0]?.type).toBe('deleted')
    }
  })

  it('detects mixed changes', () => {
    const result = computeDiff('alpha\nbeta\ngamma', 'alpha\ndelta\ngamma', noOptions)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.unchanged).toBe(2)
      expect(result.value.additions).toBe(1)
      expect(result.value.deletions).toBe(1)
    }
  })

  it('handles different line counts (right longer)', () => {
    const result = computeDiff('a', 'a\nb\nc', noOptions)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.unchanged).toBe(1)
      expect(result.value.additions).toBe(2)
    }
  })

  it('handles different line counts (left longer)', () => {
    const result = computeDiff('a\nb\nc', 'a', noOptions)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.unchanged).toBe(1)
      expect(result.value.deletions).toBe(2)
    }
  })

  it('respects ignoreCase option', () => {
    const result = computeDiff('Hello', 'hello', { ignoreCase: true, ignoreWhitespace: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.unchanged).toBe(1)
      expect(result.value.additions).toBe(0)
      expect(result.value.deletions).toBe(0)
    }
  })

  it('respects ignoreWhitespace option', () => {
    const result = computeDiff('hello  world', 'hello world', { ignoreCase: false, ignoreWhitespace: true })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.unchanged).toBe(1)
      expect(result.value.additions).toBe(0)
      expect(result.value.deletions).toBe(0)
    }
  })
})
