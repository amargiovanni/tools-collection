import { describe, it, expect } from 'vitest'
import { generateUsernames } from '../../src/tools/username-generator'

describe('generateUsernames', () => {
  it('generates the requested number of usernames', () => {
    const result = generateUsernames('random', 5)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(5)
    }
  })

  it('clamps count to minimum of 1', () => {
    const result = generateUsernames('tech', 0)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(1)
    }
  })

  it('clamps count to maximum of 50', () => {
    const result = generateUsernames('fantasy', 100)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(50)
    }
  })

  it('generates usernames matching pattern word+word+number', () => {
    const result = generateUsernames('random', 10)
    expect(result.ok).toBe(true)
    if (result.ok) {
      result.value.forEach(username => {
        expect(username).toMatch(/^[a-z]+[a-z]+\d+$/)
      })
    }
  })

  it('uses tech words for tech style', () => {
    const techWords = ['cyber', 'digital', 'code', 'pixel', 'binary', 'matrix', 'data', 'cloud']
    const result = generateUsernames('tech', 20)
    expect(result.ok).toBe(true)
    if (result.ok) {
      result.value.forEach(username => {
        const wordPart = username.replace(/\d+$/, '')
        const matchesTech = techWords.some(w => wordPart.includes(w))
        expect(matchesTech).toBe(true)
      })
    }
  })

  it('generates different usernames on each call (non-deterministic check)', () => {
    const result1 = generateUsernames('cool', 5)
    const result2 = generateUsernames('cool', 5)
    expect(result1.ok).toBe(true)
    expect(result2.ok).toBe(true)
    // With random generation, it's extremely unlikely all 5 match
    if (result1.ok && result2.ok) {
      const allSame = result1.value.every((u, i) => u === result2.value[i])
      // This could theoretically fail, but the probability is astronomically low
      expect(allSame).toBe(false)
    }
  })
})
