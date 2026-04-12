import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export type UrlEncodeMode = 'full' | 'component'

export function encodeUrl(input: string, mode: UrlEncodeMode): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  if (mode === 'component') {
    return ok(encodeURIComponent(input))
  }

  return ok(encodeURI(input))
}

export function decodeUrl(input: string): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  try {
    return ok(decodeURI(input))
  } catch {
    return err('DECODE_ERROR', 'Error: invalid URL')
  }
}
