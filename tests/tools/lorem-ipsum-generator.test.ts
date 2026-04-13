import { describe, it, expect } from 'vitest'
import { generateLoremIpsum } from '../../src/tools/lorem-ipsum-generator'

describe('generateLoremIpsum', () => {
  describe('paragraphs', () => {
    it('generates the requested number of paragraphs', () => {
      const result = generateLoremIpsum({ type: 'paragraphs', count: 3, startWithClassic: false }, 42)
      expect(result.ok).toBe(true)
      if (result.ok) {
        const paragraphs = result.value.split('\n\n')
        expect(paragraphs).toHaveLength(3)
      }
    })

    it('each paragraph has multiple sentences', () => {
      const result = generateLoremIpsum({ type: 'paragraphs', count: 5, startWithClassic: false }, 42)
      expect(result.ok).toBe(true)
      if (result.ok) {
        const paragraphs = result.value.split('\n\n')
        for (const p of paragraphs) {
          // Each sentence ends with a period, so count periods
          const sentenceCount = (p.match(/\./g) ?? []).length
          expect(sentenceCount).toBeGreaterThanOrEqual(4)
          expect(sentenceCount).toBeLessThanOrEqual(9) // 8 max + possibly 1 from classic opening
        }
      }
    })

    it('starts with classic opening when enabled', () => {
      const result = generateLoremIpsum({ type: 'paragraphs', count: 2, startWithClassic: true }, 42)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toMatch(/^Lorem ipsum dolor sit amet, consectetur adipiscing elit\./)
      }
    })

    it('does not start with classic opening when disabled', () => {
      const result = generateLoremIpsum({ type: 'paragraphs', count: 2, startWithClassic: false }, 42)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).not.toMatch(/^Lorem ipsum dolor sit amet/)
      }
    })
  })

  describe('sentences', () => {
    it('generates the requested number of sentences', () => {
      const result = generateLoremIpsum({ type: 'sentences', count: 5, startWithClassic: false }, 42)
      expect(result.ok).toBe(true)
      if (result.ok) {
        const sentenceCount = (result.value.match(/\./g) ?? []).length
        expect(sentenceCount).toBe(5)
      }
    })

    it('each sentence starts with a capital letter', () => {
      const result = generateLoremIpsum({ type: 'sentences', count: 5, startWithClassic: false }, 42)
      expect(result.ok).toBe(true)
      if (result.ok) {
        const sentences = result.value.split(/\.\s*/).filter(Boolean)
        for (const s of sentences) {
          expect(s.charAt(0)).toMatch(/[A-Z]/)
        }
      }
    })

    it('starts with classic opening sentence when enabled', () => {
      const result = generateLoremIpsum({ type: 'sentences', count: 3, startWithClassic: true }, 42)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toMatch(/^Lorem ipsum dolor sit amet, consectetur adipiscing elit\./)
      }
    })
  })

  describe('words', () => {
    it('generates the requested number of words', () => {
      const result = generateLoremIpsum({ type: 'words', count: 10, startWithClassic: false }, 42)
      expect(result.ok).toBe(true)
      if (result.ok) {
        const words = result.value.split(' ')
        expect(words).toHaveLength(10)
      }
    })

    it('first word is capitalized', () => {
      const result = generateLoremIpsum({ type: 'words', count: 5, startWithClassic: false }, 42)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.charAt(0)).toMatch(/[A-Z]/)
      }
    })

    it('starts with classic words when enabled', () => {
      const result = generateLoremIpsum({ type: 'words', count: 10, startWithClassic: true }, 42)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.toLowerCase()).toMatch(/^lorem ipsum dolor sit amet/)
      }
    })

    it('handles count less than classic opening word count', () => {
      const result = generateLoremIpsum({ type: 'words', count: 3, startWithClassic: true }, 42)
      expect(result.ok).toBe(true)
      if (result.ok) {
        const words = result.value.split(' ')
        expect(words).toHaveLength(3)
        expect(result.value.toLowerCase()).toMatch(/^lorem ipsum dolor$/)
      }
    })
  })

  describe('count validation', () => {
    it('returns error for count less than 1', () => {
      const result = generateLoremIpsum({ type: 'paragraphs', count: 0, startWithClassic: false })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_COUNT')
      }
    })

    it('returns error for NaN count', () => {
      const result = generateLoremIpsum({ type: 'paragraphs', count: NaN, startWithClassic: false })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_COUNT')
      }
    })

    it('caps count at 100', () => {
      const result = generateLoremIpsum({ type: 'words', count: 200, startWithClassic: false }, 42)
      expect(result.ok).toBe(true)
      if (result.ok) {
        const words = result.value.split(' ')
        expect(words).toHaveLength(100)
      }
    })
  })

  describe('deterministic output with seed', () => {
    it('produces identical output with the same seed', () => {
      const r1 = generateLoremIpsum({ type: 'paragraphs', count: 2, startWithClassic: false }, 42)
      const r2 = generateLoremIpsum({ type: 'paragraphs', count: 2, startWithClassic: false }, 42)
      expect(r1.ok).toBe(true)
      expect(r2.ok).toBe(true)
      if (r1.ok && r2.ok) {
        expect(r1.value).toBe(r2.value)
      }
    })

    it('produces different output with different seeds', () => {
      const r1 = generateLoremIpsum({ type: 'paragraphs', count: 2, startWithClassic: false }, 42)
      const r2 = generateLoremIpsum({ type: 'paragraphs', count: 2, startWithClassic: false }, 99)
      expect(r1.ok).toBe(true)
      expect(r2.ok).toBe(true)
      if (r1.ok && r2.ok) {
        expect(r1.value).not.toBe(r2.value)
      }
    })
  })
})
