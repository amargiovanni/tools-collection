import { describe, it, expect } from 'vitest'
import { generateHashes } from '../../src/tools/hash-generator'

describe('generateHashes', () => {
  it('generates known SHA-256 for empty string', async () => {
    const result = await generateHashes('')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.sha256).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      )
    }
  })

  it('generates known SHA-1 for empty string', async () => {
    const result = await generateHashes('')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.sha1).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709')
    }
  })

  it('generates known SHA-512 for empty string', async () => {
    const result = await generateHashes('')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.sha512).toBe(
        'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
      )
    }
  })

  it('generates hashes for "hello"', async () => {
    const result = await generateHashes('hello')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.sha256).toBe(
        '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      )
      expect(result.value.sha1).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
    }
  })

  it('returns all three hash types', async () => {
    const result = await generateHashes('test')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(typeof result.value.sha1).toBe('string')
      expect(typeof result.value.sha256).toBe('string')
      expect(typeof result.value.sha512).toBe('string')
      expect(result.value.sha1.length).toBe(40)
      expect(result.value.sha256.length).toBe(64)
      expect(result.value.sha512.length).toBe(128)
    }
  })

  it('produces different hashes for different inputs', async () => {
    const result1 = await generateHashes('hello')
    const result2 = await generateHashes('world')
    expect(result1.ok).toBe(true)
    expect(result2.ok).toBe(true)
    if (result1.ok && result2.ok) {
      expect(result1.value.sha256).not.toBe(result2.value.sha256)
      expect(result1.value.sha1).not.toBe(result2.value.sha1)
      expect(result1.value.sha512).not.toBe(result2.value.sha512)
    }
  })
})
