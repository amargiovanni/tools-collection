import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { ALNUM_ALPHABET, BASE64URL_ALPHABET, HEX_ALPHABET, randomString } from './random-secrets'

export type ApiKeyFormat = 'alnum' | 'base64url' | 'hex'

export interface ApiKeyOptions {
  length: number
  count: number
  prefix: string
  format: ApiKeyFormat
}

const FORMAT_ALPHABETS: Record<ApiKeyFormat, string> = {
  alnum: ALNUM_ALPHABET,
  base64url: BASE64URL_ALPHABET,
  hex: HEX_ALPHABET,
}

export function generateApiKeys(options: ApiKeyOptions): Result<string[]> {
  const length = Math.max(8, Math.min(128, options.length))
  const count = Math.max(1, Math.min(20, options.count))
  const alphabet = FORMAT_ALPHABETS[options.format]
  const keys = Array.from({ length: count }, () => `${options.prefix}${randomString(length, alphabet)}`)
  return ok(keys)
}
