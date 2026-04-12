import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export type CaseType = 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'constant'

export function convertCase(input: string, caseType: CaseType): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  switch (caseType) {
    case 'upper':
      return ok(input.toUpperCase())
    case 'lower':
      return ok(input.toLowerCase())
    case 'title':
      return ok(
        input.replace(/\w\S*/g, txt =>
          txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
        ),
      )
    case 'camel':
      return ok(
        input
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index: number) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase(),
          )
          .replace(/\s+/g, ''),
      )
    case 'snake':
      return ok(input.toLowerCase().replace(/\s+/g, '_'))
    case 'constant':
      return ok(input.toUpperCase().replace(/\s+/g, '_'))
  }
}
