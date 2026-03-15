import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export interface HashResult {
  sha1: string
  sha256: string
  sha512: string
}

async function computeHash(
  text: string,
  algorithm: string,
): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function generateHashes(
  input: string,
): Promise<Result<HashResult>> {
  try {
    const [sha1, sha256, sha512] = await Promise.all([
      computeHash(input, 'SHA-1'),
      computeHash(input, 'SHA-256'),
      computeHash(input, 'SHA-512'),
    ])

    return ok({ sha1, sha256, sha512 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Hash generation error'
    return err('HASH_ERROR', message)
  }
}
