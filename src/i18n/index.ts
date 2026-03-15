import en from './messages/en.json'
import it from './messages/it.json'

export const languages = ['en', 'it'] as const
export type Language = (typeof languages)[number]
export const defaultLanguage: Language = 'en'

type Messages = typeof en

// Compile-time check: it.json must have the same keys as en.json
const _itCheck: Messages = it

export type MessageKey = keyof Messages

const messages: Record<Language, Messages> = { en, it }

export function t(lang: Language, key: MessageKey): string {
  return messages[lang][key]
}

export function getLanguageFromPath(path: string): Language {
  const match = path.match(/^\/(en|it)\//)
  if (match) {
    return match[1] as Language
  }
  return defaultLanguage
}

export function getAlternateLanguage(lang: Language): Language {
  return lang === 'en' ? 'it' : 'en'
}

/**
 * Category ID to i18n key mapping.
 * Maps kebab-case category IDs to their camelCase i18n key suffix.
 */
const categoryKeyMap: Record<string, MessageKey> = {
  'text-processing': 'categories_textProcessing',
  'generators': 'categories_generators',
  'extraction': 'categories_extraction',
  'analysis': 'categories_analysis',
  'security': 'categories_security',
  'converters': 'categories_converters',
  'development': 'categories_development',
  'utilities': 'categories_utilities',
}

/**
 * Translate an error code to a localized message, falling back to the raw message.
 * Avoids the `as any` + try/catch pattern in every tool component.
 */
export function translateError(lang: Language, error: { code: string; message: string }): string {
  const key = `errors_${error.code}`
  if (key in messages[lang]) {
    return messages[lang][key as MessageKey]
  }
  return error.message
}

export function getCategoryName(lang: Language, categoryId: string): string {
  const key = categoryKeyMap[categoryId]
  if (!key) return categoryId
  return t(lang, key)
}
