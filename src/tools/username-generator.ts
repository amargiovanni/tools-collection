import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export type UsernameStyle = 'random' | 'tech' | 'fantasy' | 'cool'

const WORD_LISTS: Record<UsernameStyle, readonly string[]> = {
  random: ['quick', 'lazy', 'happy', 'cool', 'smart', 'brave', 'calm', 'wild'],
  tech: ['cyber', 'digital', 'code', 'pixel', 'binary', 'matrix', 'data', 'cloud'],
  fantasy: ['dragon', 'wizard', 'magic', 'crystal', 'shadow', 'flame', 'storm', 'frost'],
  cool: ['ninja', 'phantom', 'thunder', 'lightning', 'steel', 'titan', 'cosmic', 'atomic'],
}

export function generateUsernames(style: UsernameStyle, count: number): Result<string[]> {
  const clampedCount = Math.max(1, Math.min(50, count))
  const words = WORD_LISTS[style]

  const usernames: string[] = []
  for (let i = 0; i < clampedCount; i++) {
    const word1 = words[Math.floor(Math.random() * words.length)]!
    const word2 = words[Math.floor(Math.random() * words.length)]!
    const number = Math.floor(Math.random() * 1000)
    usernames.push(`${word1}${word2}${number}`)
  }

  return ok(usernames)
}
