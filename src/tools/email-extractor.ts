import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi

export function extractEmails(input: string, removeDuplicates: boolean): Result<string[]> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  const matches = input.match(EMAIL_RE) ?? []

  if (removeDuplicates) {
    return ok([...new Set(matches.map(email => email.toLowerCase()))])
  }

  return ok(matches)
}
