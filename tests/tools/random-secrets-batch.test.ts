import { describe, it, expect } from 'vitest'
import { generateApiKeys } from '../../src/tools/api-key-generator'
import { generateJwtSecrets } from '../../src/tools/jwt-secret-generator'
import { generateHmacKeys } from '../../src/tools/hmac-key-generator'
import { generateSalts } from '../../src/tools/salt-generator'
import { generateRecoveryCodes } from '../../src/tools/recovery-code-generator'
import { generatePassphrases } from '../../src/tools/passphrase-generator'
import { generateRandomStrings } from '../../src/tools/random-string-generator'
import { HEX_ALPHABET } from '../../src/tools/random-secrets'

describe('browser-safe secret generators', () => {
  it('generates API keys with the configured prefix', () => {
    const result = generateApiKeys({ prefix: 'sk_test_', length: 24, count: 3, format: 'alnum' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(3)
      result.value.forEach((key) => {
        expect(key.startsWith('sk_test_')).toBe(true)
      })
    }
  })

  it('generates JWT secrets with Base64URL output', () => {
    const result = generateJwtSecrets({ size: 32, count: 2, format: 'base64url' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(2)
      result.value.forEach((secret) => {
        expect(secret).toMatch(/^[A-Za-z0-9_-]+$/)
      })
    }
  })

  it('generates HMAC keys in hex format', () => {
    const result = generateHmacKeys({ size: 64, count: 2, format: 'hex' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      result.value.forEach((key) => {
        expect(key).toMatch(/^[0-9A-F]{128}$/)
      })
    }
  })

  it('generates salts in base64 format', () => {
    const result = generateSalts({ size: 16, count: 2, format: 'base64' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      result.value.forEach((salt) => {
        expect(salt).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
      })
    }
  })

  it('generates grouped recovery codes', () => {
    const result = generateRecoveryCodes(4, 12, 4)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(4)
      result.value.forEach((code) => {
        expect(code).toMatch(/^[A-Z0-9]{4}(-[A-Z0-9]{4}){2}$/)
      })
    }
  })

  it('generates multi-word passphrases', () => {
    const result = generatePassphrases(4, 3, '-')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(3)
      result.value.forEach((phrase) => {
        expect(phrase).toMatch(/^[a-z]+(-[a-z]+){3}$/)
        expect(phrase.split('-')).toHaveLength(4)
      })
    }
  })

  it('generates arbitrary random strings', () => {
    const result = generateRandomStrings(10, 2, HEX_ALPHABET)
    expect(result.ok).toBe(true)
    if (result.ok) {
      result.value.forEach((value) => {
        expect(value).toMatch(/^[0-9A-F]{10}$/)
      })
    }
  })
})
