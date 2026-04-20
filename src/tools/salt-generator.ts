import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { bytesToBase64, bytesToBase64Url, bytesToHex, randomBytes } from './random-secrets'

export type SaltFormat = 'hex' | 'base64' | 'base64url'
export type SaltSize = 8 | 16 | 24 | 32

export interface SaltOptions {
  size: SaltSize
  count: number
  format: SaltFormat
}

export function generateSalts(options: SaltOptions): Result<string[]> {
  const count = Math.max(1, Math.min(20, options.count))
  const salts = Array.from({ length: count }, () => {
    const bytes = randomBytes(options.size)
    if (options.format === 'hex') return bytesToHex(bytes)
    if (options.format === 'base64') return bytesToBase64(bytes)
    return bytesToBase64Url(bytes)
  })
  return ok(salts)
}
