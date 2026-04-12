import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export type BreakReplacement =
  | { type: 'space' }
  | { type: 'none' }
  | { type: 'custom'; value: string }

export function removeLineBreaks(input: string, replacement: BreakReplacement): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

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
