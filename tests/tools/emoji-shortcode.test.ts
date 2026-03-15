import { describe, it, expect } from 'vitest'
import { toEmoji, toShortcode } from '../../src/tools/emoji-shortcode'

describe('toEmoji', () => {
  it('returns error on empty input', () => {
    const result = toEmoji('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('converts shortcodes to emojis', () => {
    const result = toEmoji(':smile: hello :heart:')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('\u{1F604}')
      expect(result.value).toContain('\u2764\uFE0F')
      expect(result.value).toContain('hello')
    }
  })

  it('leaves unknown shortcodes unchanged', () => {
    const result = toEmoji(':unknown: text')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(':unknown: text')
    }
  })

  it('handles multiple same shortcodes', () => {
    const result = toEmoji(':fire: :fire: :fire:')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('\u{1F525} \u{1F525} \u{1F525}')
    }
  })

  it('converts all 20 shortcodes', () => {
    const shortcodes = [
      ':smile:', ':heart:', ':thumbsup:', ':wave:', ':fire:',
      ':rocket:', ':star:', ':check:', ':x:', ':warning:',
      ':info:', ':question:', ':exclamation:', ':eyes:', ':clap:',
      ':pray:', ':100:', ':tada:', ':sparkles:', ':bulb:',
    ]
    for (const sc of shortcodes) {
      const result = toEmoji(sc)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).not.toBe(sc)
      }
    }
  })
})

describe('toShortcode', () => {
  it('returns error on empty input', () => {
    const result = toShortcode('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('converts emojis to shortcodes', () => {
    const result = toShortcode('\u{1F604} hello \u2764\uFE0F')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(':smile: hello :heart:')
    }
  })

  it('leaves unknown emojis unchanged', () => {
    const result = toShortcode('\u{1F600} text')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('\u{1F600} text')
    }
  })

  it('round-trips shortcode -> emoji -> shortcode', () => {
    const original = ':rocket: launch :tada:'
    const emojiResult = toEmoji(original)
    expect(emojiResult.ok).toBe(true)
    if (emojiResult.ok) {
      const shortcodeResult = toShortcode(emojiResult.value)
      expect(shortcodeResult.ok).toBe(true)
      if (shortcodeResult.ok) {
        expect(shortcodeResult.value).toBe(original)
      }
    }
  })
})
