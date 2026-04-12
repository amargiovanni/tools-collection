import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export type JsonIndent = 2 | 4 | 'tab' | 'compact'

export function formatJson(input: string, indent: JsonIndent): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  try {
    const parsed: unknown = JSON.parse(validated.value)

    if (indent === 'compact') {
      return ok(JSON.stringify(parsed))
    }
    if (indent === 'tab') {
      return ok(JSON.stringify(parsed, null, '\t'))
    }
    return ok(JSON.stringify(parsed, null, indent))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid JSON'
    return err('INVALID_JSON', message)
  }
}

export function validateJson(input: string): Result<boolean> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  try {
    JSON.parse(validated.value)
    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid JSON'
    return err('INVALID_JSON', message)
  }
}
