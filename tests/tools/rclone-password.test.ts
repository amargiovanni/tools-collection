import { describe, it, expect } from 'vitest'
import { createCipheriv } from 'crypto'
import { revealRclonePassword } from '../../src/tools/rclone-password'

const RCLONE_KEY = Buffer.from([
  0x9c, 0x93, 0x5b, 0x48, 0x73, 0x0a, 0x55, 0x4d,
  0x6b, 0xfd, 0x7c, 0x63, 0xc8, 0x86, 0xa9, 0x2b,
  0xd3, 0x90, 0x19, 0x8e, 0xb8, 0x12, 0x8a, 0xfb,
  0xf4, 0xde, 0x16, 0x2b, 0x8b, 0x95, 0xf6, 0x38,
])

function encodeBase64Url(bytes: Buffer): string {
  return bytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function makeObscuredText(plainText: string): string {
  const iv = Buffer.from('0123456789abcdef')
  const cipher = createCipheriv('aes-256-ctr', RCLONE_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  return encodeBase64Url(Buffer.concat([iv, encrypted]))
}

describe('revealRclonePassword', () => {
  it('reveals an obscured rclone password', async () => {
    const obscured = makeObscuredText('SuperSecret123!')
    const result = await revealRclonePassword(obscured)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toBe('SuperSecret123!')
  })

  it('returns error for empty input', async () => {
    const result = await revealRclonePassword('   ')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('EMPTY_INPUT')
  })

  it('returns error for invalid Base64URL length', async () => {
    const result = await revealRclonePassword('a')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('INVALID_BASE64URL')
  })

  it('returns error for inputs without a valid IV', async () => {
    const result = await revealRclonePassword('YQ')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('INPUT_TOO_SHORT')
  })
})
