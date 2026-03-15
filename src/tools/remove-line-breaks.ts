import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export type BreakReplacement =
  | { type: 'space' }
  | { type: 'none' }
  | { type: 'custom'; value: string }

export function removeLineBreaks(input: string, replacement: BreakReplacement): Result<string> {
  if (input === '') {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  let replacementStr: string
  switch (replacement.type) {
    case 'space':
      replacementStr = ' '
      break
    case 'none':
      replacementStr = ''
      break
    case 'custom':
      replacementStr = replacement.value
      break
  }

  return ok(input.replace(/\r?\n+/g, replacementStr))
}
