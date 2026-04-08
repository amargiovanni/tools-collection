import { describe, expect, it } from 'vitest'
import { analyzeText } from '../../src/tools/text-counter'

describe('analyzeText', () => {
  it('returns zeroed stats for empty input', () => {
    expect(analyzeText('')).toEqual({
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeSeconds: 0,
      speakingTimeSeconds: 0,
      keywords: [],
    })
  })

  it('counts characters, words, sentences, and paragraphs', () => {
    const result = analyzeText('Hello world.\n\nSecond paragraph here!')

    expect(result.characters).toBe(36)
    expect(result.charactersNoSpaces).toBe(31)
    expect(result.words).toBe(5)
    expect(result.sentences).toBe(2)
    expect(result.paragraphs).toBe(2)
    expect(result.readingTimeSeconds).toBe(2)
    expect(result.speakingTimeSeconds).toBe(3)
  })

  it('extracts top keywords and ignores common stopwords', () => {
    const result = analyzeText('Alpha beta alpha and beta gamma alpha the beta')

    expect(result.keywords).toEqual([
      { term: 'alpha', count: 3 },
      { term: 'beta', count: 3 },
      { term: 'gamma', count: 1 },
    ])
  })

  it('supports unicode words and apostrophes', () => {
    const result = analyzeText("L'été è bello. L'estate è bella.")

    expect(result.words).toBe(6)
    expect(result.sentences).toBe(2)
    expect(result.keywords).toEqual([
      { term: 'bella', count: 1 },
      { term: 'bello', count: 1 },
      { term: "l'estate", count: 1 },
      { term: "l'été", count: 1 },
    ])
  })
})
