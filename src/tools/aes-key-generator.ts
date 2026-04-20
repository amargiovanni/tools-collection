import { err, ok } from '../lib/result'
import type { Result } from '../lib/result'

export type AesKeySize = 128 | 192 | 256

export interface AesKeyResult {
  readonly sizeBits: AesKeySize
  readonly sizeBytes: number
  readonly hex: string
  readonly base64: string
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

export function generateAesKey(sizeBits: number): Result<AesKeyResult> {
  if (sizeBits !== 128 && sizeBits !== 192 && sizeBits !== 256) {
    return err('INVALID_AES_KEY_SIZE', 'AES key size must be 128, 192, or 256 bits')
  }

  const bytes = randomBytes(sizeBits / 8)
  return ok({
    sizeBits,
    sizeBytes: bytes.length,
    hex: bytesToHex(bytes),
    base64: bytesToBase64(bytes),
  })
}
