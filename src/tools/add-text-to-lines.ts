import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export type Position = 'start' | 'end'

export function addTextToLines(input: string, addition: string, position: Position): Result<string> {
  if (input === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  const lines = input.split('\n')

  if (position === 'start') {
    return ok(lines.map(line => addition + line).join('\n'))
  }

  return ok(lines.map(line => line + addition).join('\n'))
}
