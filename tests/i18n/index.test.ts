import { describe, it, expect } from 'vitest'
import { t, translateError, getLanguageFromPath, getOtherLanguages, getCategoryName, languages, defaultLanguage, languageNames } from '../../src/i18n'
import type { Language } from '../../src/i18n'
import enMessages from '../../src/i18n/messages/en.json'
import itMessages from '../../src/i18n/messages/it.json'
import esMessages from '../../src/i18n/messages/es.json'
import frMessages from '../../src/i18n/messages/fr.json'
import deMessages from '../../src/i18n/messages/de.json'

const allMessages: Record<string, Record<string, string>> = { en: enMessages, it: itMessages, es: esMessages, fr: frMessages, de: deMessages }

describe('i18n', () => {
  it('languages array contains all 5 languages', () => {
    expect(languages).toEqual(['en', 'it', 'es', 'fr', 'de'])
  })

  it('t returns correct string per language', () => {
    expect(t('en', 'app_title')).toBe('Online Tools')
    expect(t('it', 'app_title')).toBe('Strumenti online')
    expect(t('es', 'app_title')).toBeTruthy()
    expect(t('fr', 'app_title')).toBeTruthy()
    expect(t('de', 'app_title')).toBeTruthy()
  })

  it('all locales have the same number of keys as en', () => {
    const enKeys = Object.keys(enMessages)
    for (const lang of languages) {
      const keys = Object.keys(allMessages[lang])
      expect(keys.length, `${lang}.json has ${keys.length} keys, en.json has ${enKeys.length}`).toBe(enKeys.length)
    }
  })

  it('all locales have identical key sets', () => {
    const enKeys = new Set(Object.keys(enMessages))
    for (const lang of languages) {
      if (lang === 'en') continue
      const langKeys = new Set(Object.keys(allMessages[lang]))
      for (const key of enKeys) {
        expect(langKeys.has(key), `Key "${key}" missing in ${lang}.json`).toBe(true)
      }
      for (const key of langKeys) {
        expect(enKeys.has(key), `Key "${key}" in ${lang}.json is extra (not in en.json)`).toBe(true)
      }
    }
  })

  it('no values are empty strings in any locale', () => {
    for (const lang of languages) {
      for (const [key, value] of Object.entries(allMessages[lang])) {
        expect(value.length, `${lang}.json key "${key}" is empty`).toBeGreaterThan(0)
      }
    }
  })

  it('languageNames has entries for all languages', () => {
    for (const lang of languages) {
      expect(languageNames[lang]).toBeTruthy()
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

  it('translates all standard error codes for all languages', () => {
    const standardCodes = [
      'EMPTY_INPUT', 'INVALID_JSON', 'INVALID_XML', 'INVALID_REGEX',
      'INVALID_PEM', 'INVALID_BASE64', 'INVALID_URL', 'INVALID_COLOR',
      'INVALID_TIMESTAMP', 'INVALID_TIME_VALUE', 'INVALID_SIZE_VALUE', 'INVALID_REG_FILE',
      'NO_CHARSET', 'NO_TERMS', 'HASH_ERROR', 'QR_UNSUPPORTED',
      'QR_NOT_FOUND', 'UNIQUE_IMPOSSIBLE',
    ]
    for (const code of standardCodes) {
      for (const lang of languages) {
        const result = translateError(lang, { code, message: 'unused' })
        expect(result, `errors_${code} missing in ${lang}.json`).not.toBe('unused')
      }
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

  it('extracts es from path', () => {
    expect(getLanguageFromPath('/es/tools/base64')).toBe('es')
  })

  it('extracts fr from path', () => {
    expect(getLanguageFromPath('/fr/')).toBe('fr')
  })

  it('extracts de from path', () => {
    expect(getLanguageFromPath('/de/tools/json-formatter')).toBe('de')
  })

  it('defaults to en for unknown language prefix', () => {
    expect(getLanguageFromPath('/pt/tools/')).toBe(defaultLanguage)
  })
})

describe('getOtherLanguages', () => {
  it('returns all languages except the given one', () => {
    expect(getOtherLanguages('en')).toEqual(['it', 'es', 'fr', 'de'])
  })

  it('returns 4 languages for any input', () => {
    for (const lang of languages) {
      const others = getOtherLanguages(lang)
      expect(others).toHaveLength(4)
      expect(others).not.toContain(lang)
    }
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
