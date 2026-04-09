import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

const RCLONE_KEY = new Uint8Array([
  0x9c, 0x93, 0x5b, 0x48, 0x73, 0x0a, 0x55, 0x4d,
  0x6b, 0xfd, 0x7c, 0x63, 0xc8, 0x86, 0xa9, 0x2b,
  0xd3, 0x90, 0x19, 0x8e, 0xb8, 0x12, 0x8a, 0xfb,
  0xf4, 0xde, 0x16, 0x2b, 0x8b, 0x95, 0xf6, 0x38,
])

function base64UrlToBytes(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')

  switch (base64.length % 4) {
    case 0:
      break
    case 2:
      return Uint8Array.from(atob(base64 + '=='), (char) => char.charCodeAt(0))
    case 3:
      return Uint8Array.from(atob(base64 + '='), (char) => char.charCodeAt(0))
    default:
      throw new Error('Invalid Base64URL string length.')
  }

  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

async function decryptRclonePayload(ciphertext: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error('Web Crypto is not available in this environment.')
  }

  const key = await subtle.importKey('raw', RCLONE_KEY, 'AES-CTR', false, ['decrypt'])
  const plainBuffer = await subtle.decrypt(
    {
      name: 'AES-CTR',
      counter: iv,
      length: 128,
    },
    key,
    ciphertext,
  )

  return new Uint8Array(plainBuffer)
}

export async function revealRclonePassword(obscuredText: string): Promise<Result<string>> {
  const trimmed = obscuredText.trim()
  if (!trimmed) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  if (!globalThis.crypto?.subtle) {
    return err('CRYPTO_UNAVAILABLE', 'Web Crypto is not available in this environment.')
  }

  let ciphertext: Uint8Array
  try {
    ciphertext = base64UrlToBytes(trimmed)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unable to decode Base64URL input.'
    return err('INVALID_BASE64URL', `Base64 decode failed while revealing the password. ${message}`)
  }

  if (ciphertext.length < 16) {
    return err('INPUT_TOO_SHORT', 'Input is too short. The value does not contain a valid IV.')
  }

  const iv = ciphertext.slice(0, 16)
  const buffer = ciphertext.slice(16)

  try {
    const plainBytes = await decryptRclonePayload(buffer, iv)
    return ok(new TextDecoder().decode(plainBytes))
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unable to decrypt the obscured password.'
    return err('DECRYPT_ERROR', `Decrypt failed while revealing the password. ${message}`)
  }
}
