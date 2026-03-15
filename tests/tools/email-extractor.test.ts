import { describe, it, expect } from 'vitest'
import { extractEmails } from '../../src/tools/email-extractor'

describe('extractEmails', () => {
  it('returns error on empty input', () => {
    const result = extractEmails('', false)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error on whitespace-only input', () => {
    const result = extractEmails('   ', false)
    expect(result.ok).toBe(false)
  })

  it('extracts emails from text', () => {
    const input = 'Contact us at hello@example.com or support@test.org'
    const result = extractEmails(input, false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['hello@example.com', 'support@test.org'])
    }
  })

  it('handles mixed case emails', () => {
    const input = 'Email: John.Doe@Example.COM'
    const result = extractEmails(input, false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['John.Doe@Example.COM'])
    }
  })

  it('removes duplicates when enabled (case-insensitive)', () => {
    const input = 'test@example.com TEST@EXAMPLE.COM Test@Example.Com'
    const result = extractEmails(input, true)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['test@example.com'])
    }
  })

  it('keeps duplicates when removeDuplicates is false', () => {
    const input = 'test@example.com test@example.com'
    const result = extractEmails(input, false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['test@example.com', 'test@example.com'])
    }
  })

  it('returns empty array when no emails found', () => {
    const input = 'no emails here at all'
    const result = extractEmails(input, false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual([])
    }
  })

  it('handles emails with special characters in local part', () => {
    const input = 'user.name+tag@example.com and user%info@test.org'
    const result = extractEmails(input, false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['user.name+tag@example.com', 'user%info@test.org'])
    }
  })

  it('matches emails with long TLDs', () => {
    const input = 'user@example.museum'
    const result = extractEmails(input, false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(['user@example.museum'])
    }
  })
})
