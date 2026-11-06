import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export type UrlEncodeMode = 'full' | 'component'

export function encodeUrl(input: string, mode: UrlEncodeMode): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  if (mode === 'component') {
    return ok(encodeURIComponent(validated.value))
  }

  return ok(encodeURI(validated.value))
}

export function decodeUrl(input: string): Result<string> {
  const validated = validateNonEmpty(input)
  if (!validated.ok) return validated

  try {
    // decodeURIComponent also undoes %2F %3F %26 %3D …, which Encode Component
    // produces and decodeURI would leave encoded.
    return ok(decodeURIComponent(validated.value))
  } catch {
    return err('DECODE_ERROR', 'Error: invalid URL')
  }
}
