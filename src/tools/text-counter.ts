export interface KeywordEntry {
  term: string
  count: number
}

export interface TextCounterStats {
  characters: number
  charactersNoSpaces: number
  words: number
  sentences: number
  paragraphs: number
  readingTimeSeconds: number
  speakingTimeSeconds: number
  keywords: KeywordEntry[]
}

const WORD_REGEX = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu
const NON_TERMINAL_ABBREVIATIONS = new Set([
  'mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'sr.', 'jr.', 'st.', 'vs.', 'etc.', 'fig.', 'no.',
  'e.g.', 'i.e.', 'p.s.', 'a.k.a.',
])
const MULTILINGUAL_STOPWORDS = new Set([
  'a', 'ad', 'ai', 'al', 'alla', 'alle', 'allo', 'also', 'am', 'an', 'and', 'are', 'as', 'at',
  'au', 'auf', 'aux', 'avec', 'by', 'che', 'chi', 'ci', 'con', 'come', 'como', 'da', 'das', 'de',
  'dei', 'del', 'della', 'delle', 'dello', 'dem', 'den', 'der', 'des', 'di', 'die', 'du', 'e', 'ed',
  'ein', 'eine', 'el', 'en', 'es', 'et', 'est', 'for', 'fra', 'gli', 'ha', 'hai', 'has', 'have',
  'i', 'il', 'in', 'io', 'is', 'it', 'la', 'las', 'le', 'les', 'lo', 'los', 'ma', 'mi', 'ne', 'nel',
  'nella', 'no', 'non', 'o', 'of', 'on', 'or', 'par', 'para', 'per', 'por', 'se', 'si', 'son', 'su',
  'sur', 'te', 'that', 'the', 'their', 'them', 'these', 'they', 'this', 'ti', 'to', 'tu', 'un',
  'una', 'une', 'uno', 'va', 'von', 'was', 'we', 'with', 'y', 'you',
])

function getWords(input: string): string[] {
  return input.match(WORD_REGEX) ?? []
}

function isLowercaseLetter(char: string): boolean {
  return /\p{Ll}/u.test(char)
}

function getPreviousToken(text: string, index: number): string {
  let start = index
  while (start > 0 && !/\s/u.test(text[start - 1]!)) {
    start -= 1
  }
  return text.slice(start, index + 1).toLocaleLowerCase()
}

function getNextNonSpaceChar(text: string, index: number): string {
  let cursor = index + 1
  while (cursor < text.length && /\s/u.test(text[cursor]!)) {
    cursor += 1
  }
  return text[cursor] ?? ''
}

function countSentences(input: string): number {
  const text = input.trim()
  if (!text) return 0

  let sentences = 0

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!

    if (char === '!' || char === '?') {
      sentences += 1
      while (index + 1 < text.length && /[!?]/.test(text[index + 1]!)) {
        index += 1
      }
      continue
    }

    if (char !== '.') continue

    const previousChar = text[index - 1] ?? ''
    const nextChar = text[index + 1] ?? ''
    const nextVisibleChar = getNextNonSpaceChar(text, index)
    const previousToken = getPreviousToken(text, index)

    if (/\p{L}/u.test(previousChar) && /\p{L}/u.test(nextChar)) {
      continue
    }

    if (/\d/u.test(previousChar) && /\d/u.test(nextChar)) {
      continue
    }

    if (NON_TERMINAL_ABBREVIATIONS.has(previousToken)) {
      continue
    }

    if (/^(?:[a-z]\.){2,}$/iu.test(previousToken)) {
      if (isLowercaseLetter(nextVisibleChar)) {
        continue
      }
    }

    if (/^(?:[A-Z]\.){2,}$/u.test(text.slice(Math.max(0, index - 5), index + 1))) {
      if (isLowercaseLetter(nextVisibleChar)) {
        continue
      }
    }

    sentences += 1

    while (index + 1 < text.length && text[index + 1] === '.') {
      index += 1
    }
  }

  if (!/[.!?]\s*$/u.test(text)) {
    sentences += 1
  }

  return sentences
}

function countParagraphs(input: string): number {
  if (!input.trim()) return 0

  return input
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .length
}

function extractKeywords(words: string[], maxKeywords: number): KeywordEntry[] {
  const counts = new Map<string, number>()

  for (const word of words) {
    const normalized = word.toLocaleLowerCase()
    if (normalized.length < 3 || MULTILINGUAL_STOPWORDS.has(normalized)) {
      continue
    }
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, maxKeywords)
}

function toSeconds(words: number, wordsPerMinute: number): number {
  if (words === 0) return 0
  return Math.ceil((words / wordsPerMinute) * 60)
}

export function analyzeText(input: string, maxKeywords = 10): TextCounterStats {
  const words = getWords(input)

  return {
    characters: [...input].length,
    charactersNoSpaces: [...input.replace(/\s/gu, '')].length,
    words: words.length,
    sentences: countSentences(input),
    paragraphs: countParagraphs(input),
    readingTimeSeconds: toSeconds(words.length, 220),
    speakingTimeSeconds: toSeconds(words.length, 130),
    keywords: extractKeywords(words, maxKeywords),
  }
}
