import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

const emojiMap: ReadonlyMap<string, string> = new Map([
  [':smile:', '\u{1F604}'],
  [':heart:', '\u2764\uFE0F'],
  [':thumbsup:', '\u{1F44D}'],
  [':wave:', '\u{1F44B}'],
  [':fire:', '\u{1F525}'],
  [':rocket:', '\u{1F680}'],
  [':star:', '\u2B50'],
  [':check:', '\u2705'],
  [':x:', '\u274C'],
  [':warning:', '\u26A0\uFE0F'],
  [':info:', '\u2139\uFE0F'],
  [':question:', '\u2753'],
  [':exclamation:', '\u2757'],
  [':eyes:', '\u{1F440}'],
  [':clap:', '\u{1F44F}'],
  [':pray:', '\u{1F64F}'],
  [':100:', '\u{1F4AF}'],
  [':tada:', '\u{1F389}'],
  [':sparkles:', '\u2728'],
  [':bulb:', '\u{1F4A1}'],
])

const reverseMap: ReadonlyMap<string, string> = new Map(
  [...emojiMap.entries()].map(([shortcode, emoji]) => [emoji, shortcode]),
)

const shortcodeRegex = new RegExp(
  [...emojiMap.keys()].map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'g',
)

const emojiRegex = new RegExp(
  [...reverseMap.keys()].map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'gu',
)

export function toEmoji(input: string): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated
  return ok(input.replace(shortcodeRegex, (match) => emojiMap.get(match) ?? match))
}

export function toShortcode(input: string): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated
  return ok(input.replace(emojiRegex, (match) => reverseMap.get(match) ?? match))
}
