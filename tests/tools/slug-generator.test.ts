import { describe, it, expect } from 'vitest'
import { generateSlug, defaultSlugOptions } from '../../src/tools/slug-generator'
import type { SlugOptions } from '../../src/tools/slug-generator'

describe('generateSlug', () => {
  it('returns error for empty input', () => {
    const result = generateSlug('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('converts basic text to a slug', () => {
    const result = generateSlug('Hello World')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello-world')
    }
  })

  it('collapses multiple spaces into a single separator', () => {
    const result = generateSlug('hello   world   foo')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello-world-foo')
    }
  })

  it('strips leading and trailing separators', () => {
    const result = generateSlug('  hello world  ')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello-world')
    }
  })

  it('removes special characters', () => {
    const result = generateSlug('hello! @world# $foo%')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello-world-foo')
    }
  })

  it('transliterates accented characters', () => {
    const result = generateSlug('Crème brûlée à la mode')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('creme-brulee-a-la-mode')
    }
  })

  it('transliterates German characters', () => {
    const result = generateSlug('Straße über München')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('strasse-uber-munchen')
    }
  })

  it('transliterates Nordic characters', () => {
    const result = generateSlug('Ærø Ødegård')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('aero-odegard')
    }
  })

  it('transliterates Spanish characters', () => {
    const result = generateSlug('El niño español')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('el-nino-espanol')
    }
  })

  it('uses underscore separator', () => {
    const opts: SlugOptions = { ...defaultSlugOptions, separator: 'underscore' }
    const result = generateSlug('Hello World', opts)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello_world')
    }
  })

  it('uses dot separator', () => {
    const opts: SlugOptions = { ...defaultSlugOptions, separator: 'dot' }
    const result = generateSlug('Hello World', opts)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello.world')
    }
  })

  it('preserves case when lowercase is false', () => {
    const opts: SlugOptions = { ...defaultSlugOptions, lowercase: false }
    const result = generateSlug('Hello World', opts)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('Hello-World')
    }
  })

  it('applies max length and truncates at separator boundary', () => {
    const opts: SlugOptions = { ...defaultSlugOptions, maxLength: 10 }
    const result = generateSlug('hello beautiful world', opts)
    expect(result.ok).toBe(true)
    if (result.ok) {
      // "hello-beautiful-world" is 21 chars, truncated to 10 is "hello-beau",
      // then trimmed to last separator: "hello"
      expect(result.value).toBe('hello')
      expect(result.value.length).toBeLessThanOrEqual(10)
    }
  })

  it('applies max length when slug fits exactly', () => {
    const opts: SlugOptions = { ...defaultSlugOptions, maxLength: 11 }
    const result = generateSlug('hello world', opts)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello-world')
    }
  })

  it('handles max length with single word', () => {
    const opts: SlugOptions = { ...defaultSlugOptions, maxLength: 5 }
    const result = generateSlug('abcdefghij', opts)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('abcde')
      expect(result.value.length).toBeLessThanOrEqual(5)
    }
  })

  it('returns error when input contains only special characters', () => {
    const result = generateSlug('!@#$%^&*()')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_RESULT')
    }
  })

  it('handles input with numbers', () => {
    const result = generateSlug('Product 123 Review')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('product-123-review')
    }
  })

  it('skips transliteration when disabled', () => {
    const opts: SlugOptions = { ...defaultSlugOptions, transliterate: false }
    const result = generateSlug('café', opts)
    expect(result.ok).toBe(true)
    if (result.ok) {
      // Without transliteration, NFD strip still removes combining marks
      expect(result.value).toBe('cafe')
    }
  })

  it('handles mixed scripts and special chars', () => {
    const result = generateSlug('Héllo & Wörld — Güten Tag!')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello-world-guten-tag')
    }
  })

  it('handles tabs and newlines', () => {
    const result = generateSlug('hello\tworld\nfoo')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello-world-foo')
    }
  })

  it('does not apply max length when set to 0', () => {
    const result = generateSlug('this is a fairly long title for testing purposes', {
      ...defaultSlugOptions,
      maxLength: 0,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('this-is-a-fairly-long-title-for-testing-purposes')
    }
  })
})
