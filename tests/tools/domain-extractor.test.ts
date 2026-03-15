import { describe, it, expect } from 'vitest'
import { extractDomains } from '../../src/tools/domain-extractor'

describe('extractDomains', () => {
  it('returns error on empty input', () => {
    const result = extractDomains('', false)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error on whitespace-only input', () => {
    const result = extractDomains('   \n  \n  ', false)
    expect(result.ok).toBe(false)
  })

  it('extracts root domains from full URLs', () => {
    const input = 'https://www.example.com/path\nhttps://sub.test.org/page'
    const result = extractDomains(input, false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['example.com', 'test.org'])
    }
  })

  it('extracts domains from URLs without protocol', () => {
    const input = 'www.example.com/path\ntest.org'
    const result = extractDomains(input, false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['example.com', 'test.org'])
    }
  })

  it('keeps subdomains when includeSubdomains is true', () => {
    const input = 'https://sub.deep.example.com'
    const result = extractDomains(input, true)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['sub.deep.example.com'])
    }
  })

  it('deduplicates domains', () => {
    const input = 'https://example.com\nhttps://www.example.com\nhttps://example.com/other'
    const result = extractDomains(input, false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['example.com'])
    }
  })

  it('silently skips malformed lines', () => {
    const input = 'https://example.com\nnot a url [][]\nhttps://test.org'
    const result = extractDomains(input, false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['example.com', 'test.org'])
    }
  })

  it('handles URLs with different protocols', () => {
    const input = 'http://example.com\nftp://files.test.org'
    const result = extractDomains(input, false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['example.com', 'test.org'])
    }
  })

  it('handles two-part domains without stripping', () => {
    const input = 'https://example.com'
    const result = extractDomains(input, false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['example.com'])
    }
  })
})
