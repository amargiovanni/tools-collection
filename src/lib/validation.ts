import { ok, err } from './result'
import type { Result } from './result'

export function validateNonEmpty(input: string): Result<string> {
  const trimmed = input.trim()
  if (trimmed === '') return err('EMPTY_INPUT', 'Please enter some input')
  return ok(trimmed)
}
