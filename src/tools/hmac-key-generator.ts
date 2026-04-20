import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { bytesToBase64, bytesToBase64Url, bytesToHex, randomBytes } from './random-secrets'

export type HmacKeyFormat = 'hex' | 'base64' | 'base64url'
export type HmacKeySize = 16 | 24 | 32 | 48 | 64

export interface HmacKeyOptions {
  size: HmacKeySize
  count: number
  format: HmacKeyFormat
}

export function generateHmacKeys(options: HmacKeyOptions): Result<string[]> {
  const count = Math.max(1, Math.min(20, options.count))
  const keys = Array.from({ length: count }, () => {
    const bytes = randomBytes(options.size)
    if (options.format === 'hex') return bytesToHex(bytes)
    if (options.format === 'base64') return bytesToBase64(bytes)
    return bytesToBase64Url(bytes)
  })
  return ok(keys)
}
