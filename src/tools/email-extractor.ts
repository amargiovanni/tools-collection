import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export function extractEmails(input: string, removeDuplicates: boolean): Result<string[]> {
  if (!input.trim()) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  const matches = input.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []

  if (removeDuplicates) {
    return ok([...new Set(matches.map(email => email.toLowerCase()))])
  }

  return ok(matches)
}
