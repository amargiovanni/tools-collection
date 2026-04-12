import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export type Position = 'start' | 'end'

export function addTextToLines(input: string, addition: string, position: Position): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  const lines = input.split('\n')

  if (position === 'start') {
    return ok(lines.map(line => addition + line).join('\n'))
  }

  return ok(lines.map(line => line + addition).join('\n'))
}
