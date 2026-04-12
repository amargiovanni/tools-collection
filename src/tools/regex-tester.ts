import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export interface RegexFlags {
  global: boolean
  caseInsensitive: boolean
  multiline: boolean
}

export interface RegexMatch {
  fullMatch: string
  index: number
  groups: string[]
}

export function testRegex(
  pattern: string,
  text: string,
  flags: RegexFlags,
): Result<RegexMatch[]> {
  const validatedPattern = validateNonEmpty(pattern)
  const validatedText = validateNonEmpty(text)
  if (!validatedPattern.ok || !validatedText.ok) {
    return err('EMPTY_INPUT', 'Enter both the pattern and the text')
  }

  try {
    let flagStr = ''
    if (flags.global) flagStr += 'g'
    if (flags.caseInsensitive) flagStr += 'i'
    if (flags.multiline) flagStr += 'm'

    let regexPattern = pattern
    if (pattern.startsWith('/')) {
      const lastSlash = pattern.lastIndexOf('/')
      if (lastSlash > 0) {
        regexPattern = pattern.substring(1, lastSlash)
        flagStr = pattern.substring(lastSlash + 1) || flagStr
      }
    }

    const regex = new RegExp(regexPattern, flagStr)
    const matchRegex = regex.global
      ? regex
      : new RegExp(regex.source, `${regex.flags}g`)
    const rawMatches = [...text.matchAll(matchRegex)]

    const matches: RegexMatch[] = rawMatches.map(match => ({
      fullMatch: match[0],
      index: match.index ?? 0,
      groups: match.slice(1).map(g => g ?? ''),
    }))

    return ok(matches)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid regex'
    return err('INVALID_REGEX', message)
  }
}
