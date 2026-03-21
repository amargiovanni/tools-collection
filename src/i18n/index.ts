import en from './messages/en.json'
import it from './messages/it.json'
import es from './messages/es.json'
import fr from './messages/fr.json'
import de from './messages/de.json'

export const languages = ['en', 'it', 'es', 'fr', 'de'] as const
export type Language = (typeof languages)[number]
export const defaultLanguage: Language = 'en'

export const languageNames: Record<Language, string> = {
  en: 'English',
  it: 'Italiano',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
}

type Messages = typeof en

// Compile-time check: all locale files must have the same keys as en.json
const _itCheck: Messages = it
const _esCheck: Messages = es
const _frCheck: Messages = fr
const _deCheck: Messages = de

export type MessageKey = keyof Messages

const messages: Record<Language, Messages> = { en, it, es, fr, de }

const languagePattern = languages.join('|')
const langPathRegex = new RegExp(`^\\/(${languagePattern})\\/`)

export function t(lang: Language, key: MessageKey): string {
  return messages[lang][key]
}

export function getLanguageFromPath(path: string): Language {
  const match = path.match(langPathRegex)
  if (match) {
    return match[1] as Language
  }
  return defaultLanguage
}

export function getOtherLanguages(lang: Language): Language[] {
  return languages.filter((l) => l !== lang)
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

function toolIdToCamel(id: string): string {
  return id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

export function getToolNameKey(toolId: string): MessageKey {
  return `tools_${toolIdToCamel(toolId)}_name` as MessageKey
}

export function getToolDescKey(toolId: string): MessageKey {
  return `tools_${toolIdToCamel(toolId)}_description` as MessageKey
}
