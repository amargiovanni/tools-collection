import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { bytesToBase64Url, bytesToHex, randomBytes } from './random-secrets'

export type JwtSecretFormat = 'hex' | 'base64url'
export type JwtSecretSize = 16 | 24 | 32 | 48 | 64

export interface JwtSecretOptions {
  size: JwtSecretSize
  count: number
  format: JwtSecretFormat
}

export function generateJwtSecrets(options: JwtSecretOptions): Result<string[]> {
  const count = Math.max(1, Math.min(20, options.count))
  const secrets = Array.from({ length: count }, () => {
    const bytes = randomBytes(options.size)
    return options.format === 'hex' ? bytesToHex(bytes) : bytesToBase64Url(bytes)
  })
  return ok(secrets)
}
