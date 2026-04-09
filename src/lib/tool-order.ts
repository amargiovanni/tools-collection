import { t, getToolNameKey } from '../i18n'
import type { Language } from '../i18n'
import type { ToolMeta } from '../config/tools'

const collatorCache: Partial<Record<Language, Intl.Collator>> = {}

function getCollator(lang: Language): Intl.Collator {
  const cached = collatorCache[lang]
  if (cached) return cached

  const collator = new Intl.Collator(lang, { sensitivity: 'base', numeric: true })
  collatorCache[lang] = collator
  return collator
}

export function sortToolsByLocalizedName(lang: Language, tools: readonly ToolMeta[]): ToolMeta[] {
  const collator = getCollator(lang)

  return [...tools].sort((a, b) => {
    const nameA = t(lang, getToolNameKey(a.id))
    const nameB = t(lang, getToolNameKey(b.id))
    return collator.compare(nameA, nameB)
  })
}
