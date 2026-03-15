import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

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

export function toEmoji(input: string): Result<string> {
  if (!input.trim()) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  let result = input
  for (const [shortcode, emoji] of emojiMap) {
    result = result.split(shortcode).join(emoji)
  }
  return ok(result)
}

export function toShortcode(input: string): Result<string> {
  if (!input.trim()) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  let result = input
  for (const [emoji, shortcode] of reverseMap) {
    result = result.split(emoji).join(shortcode)
  }
  return ok(result)
}
