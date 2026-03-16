import { describe, it, expect } from 'vitest'
import { t, translateError, getLanguageFromPath, getAlternateLanguage, getCategoryName, languages, defaultLanguage } from '../../src/i18n'
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

describe('translateError', () => {
  it('returns translated message for known error code (en)', () => {
    expect(translateError('en', { code: 'EMPTY_INPUT', message: 'fallback' })).toBe('Please enter some input')
  })

  it('returns translated message for known error code (it)', () => {
    expect(translateError('it', { code: 'EMPTY_INPUT', message: 'fallback' })).toBe('Inserisci un input')
  })

  it('returns raw message for unknown error code', () => {
    expect(translateError('en', { code: 'UNKNOWN_CODE_XYZ', message: 'raw fallback message' })).toBe('raw fallback message')
  })

  it('translates all standard error codes for both languages', () => {
    const standardCodes = [
      'EMPTY_INPUT', 'INVALID_JSON', 'INVALID_XML', 'INVALID_REGEX',
      'INVALID_PEM', 'INVALID_BASE64', 'INVALID_URL', 'INVALID_COLOR',
      'INVALID_TIMESTAMP', 'INVALID_TIME_VALUE', 'INVALID_REG_FILE',
      'NO_CHARSET', 'NO_TERMS', 'HASH_ERROR', 'QR_UNSUPPORTED',
      'QR_NOT_FOUND', 'UNIQUE_IMPOSSIBLE',
    ]
    for (const code of standardCodes) {
      const en = translateError('en', { code, message: 'unused' })
      const it = translateError('it', { code, message: 'unused' })
      expect(en, `errors_${code} missing in en.json`).not.toBe('unused')
      expect(it, `errors_${code} missing in it.json`).not.toBe('unused')
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
