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
const SENTENCE_REGEX = /[^.!?]+[.!?]*\s*/gu
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

function countSentences(input: string): number {
  if (!input.trim()) return 0

  return (input.match(SENTENCE_REGEX) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .length
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
