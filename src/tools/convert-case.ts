import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export type CaseType = 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'constant'

export function convertCase(input: string, caseType: CaseType): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  switch (caseType) {
    case 'upper':
      return ok(validated.value.toUpperCase())
    case 'lower':
      return ok(validated.value.toLowerCase())
    case 'title':
      return ok(
        validated.value.replace(/\w\S*/g, txt =>
          txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
        ),
      )
    case 'camel':
      return ok(
        validated.value
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index: number) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase(),
          )
          .replace(/\s+/g, ''),
      )
    case 'snake':
      return ok(validated.value.toLowerCase().replace(/\s+/g, '_'))
    case 'constant':
      return ok(validated.value.toUpperCase().replace(/\s+/g, '_'))
  }
}
