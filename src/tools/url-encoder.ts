import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export type UrlEncodeMode = 'full' | 'component'

export function encodeUrl(input: string, mode: UrlEncodeMode): Result<string> {
  if (!input.trim()) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  if (mode === 'component') {
    return ok(encodeURIComponent(input))
  }

  return ok(encodeURI(input))
}

export function decodeUrl(input: string): Result<string> {
  if (!input.trim()) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  try {
    return ok(decodeURI(input))
  } catch {
    return err('DECODE_ERROR', 'Error: invalid URL')
  }
}
