import { describe, it, expect } from 'vitest'
import { t, getLanguageFromPath, getAlternateLanguage, getCategoryName, languages, defaultLanguage } from '../../src/i18n'
import type { Language } from '../../src/i18n'
import enMessages from '../../src/i18n/messages/en.json'
import itMessages from '../../src/i18n/messages/it.json'

describe('i18n', () => {
  it('t returns English string for known key', () => {
    expect(t('en', 'app_title')).toBe('Online Tools')
  })

  it('t returns Italian string for known key', () => {
    expect(t('it', 'app_title')).toBe('Strumenti online')
  })

  it('both locales have the same number of keys', () => {
    const enKeys = Object.keys(enMessages)
    const itKeys = Object.keys(itMessages)
    expect(enKeys.length).toBe(itKeys.length)
  })

  it('both locales have identical key sets', () => {
    const enKeys = new Set(Object.keys(enMessages))
    const itKeys = new Set(Object.keys(itMessages))
    for (const key of enKeys) {
      expect(itKeys.has(key), `Key "${key}" missing in it.json`).toBe(true)
    }
    for (const key of itKeys) {
      expect(enKeys.has(key), `Key "${key}" missing in en.json`).toBe(true)
    }
  })

  it('no values are empty strings', () => {
    for (const [key, value] of Object.entries(enMessages)) {
      expect(value.length, `en.json key "${key}" is empty`).toBeGreaterThan(0)
    }
    for (const [key, value] of Object.entries(itMessages)) {
      expect(value.length, `it.json key "${key}" is empty`).toBeGreaterThan(0)
    }
  })
})

describe('getLanguageFromPath', () => {
  it('extracts en from path', () => {
    expect(getLanguageFromPath('/en/tools/json-formatter')).toBe('en')
  })

  it('extracts it from path', () => {
    expect(getLanguageFromPath('/it/')).toBe('it')
  })

  it('defaults to en for root path', () => {
    expect(getLanguageFromPath('/')).toBe(defaultLanguage)
  })

  it('defaults to en for unknown language prefix', () => {
    expect(getLanguageFromPath('/fr/tools/')).toBe(defaultLanguage)
  })
})

describe('getAlternateLanguage', () => {
  it('returns it for en', () => {
    expect(getAlternateLanguage('en')).toBe('it')
  })

  it('returns en for it', () => {
    expect(getAlternateLanguage('it')).toBe('en')
  })
})

describe('getCategoryName', () => {
  it('returns English category name', () => {
    expect(getCategoryName('en', 'text-processing')).toBe('Text Processing')
  })

  it('returns Italian category name', () => {
    expect(getCategoryName('it', 'development')).toBe('Sviluppo')
  })

  it('returns category ID for unknown category', () => {
    expect(getCategoryName('en', 'unknown-category')).toBe('unknown-category')
  })
})
