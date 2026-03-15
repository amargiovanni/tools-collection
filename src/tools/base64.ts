import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export function encodeBase64(input: string): Result<string> {
  if (!input.trim()) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  try {
    const bytes = new TextEncoder().encode(input)
    let binary = ''
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    return ok(btoa(binary))
  } catch {
    return err('ENCODE_ERROR', 'Error: unable to encode the text')
  }
}

export function decodeBase64(input: string): Result<string> {
  if (!input.trim()) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  try {
    const binary = atob(input)
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
    return ok(new TextDecoder().decode(bytes))
  } catch {
    return err('DECODE_ERROR', 'Error: invalid Base64 input')
  }
}
