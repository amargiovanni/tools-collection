import { describe, it, expect } from 'vitest'
import { generateUUIDv4, generateUUIDv7, generateULID } from '../../src/tools/uuid-generator'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const CROCKFORD_BASE32_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/

describe('generateUUIDv4', () => {
  it('returns a valid UUID v4 string', () => {
    expect(generateUUIDv4()).toMatch(UUID_V4_REGEX)
  })

  it('returns unique values on consecutive calls', () => {
    const results = new Set(Array.from({ length: 100 }, () => generateUUIDv4()))
    expect(results.size).toBe(100)
  })
})

describe('generateUUIDv7', () => {
  it('returns a valid UUID v7 string', () => {
    expect(generateUUIDv7()).toMatch(UUID_V7_REGEX)
  })

  it('returns unique values on consecutive calls', () => {
    const results = new Set(Array.from({ length: 100 }, () => generateUUIDv7()))
    expect(results.size).toBe(100)
  })

  it('encodes current timestamp in the first 48 bits', () => {
    const before = Date.now()
    const uuid = generateUUIDv7()
    const after = Date.now()
    const tsHex = uuid.replace(/-/g, '').slice(0, 12)
    const ts = parseInt(tsHex, 16)
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after + 1)
  })

  it('two calls in same millisecond produce ordered results (monotonicity)', () => {
    const origNow = Date.now
    Date.now = () => 1700000000000
    try {
      const a = generateUUIDv7()
      const b = generateUUIDv7()
      expect(b > a).toBe(true)
    } finally {
      Date.now = origNow
    }
  })
})

describe('generateULID', () => {
  it('returns a 26-character Crockford Base32 string', () => {
    expect(generateULID()).toMatch(CROCKFORD_BASE32_REGEX)
  })

  it('returns unique values on consecutive calls', () => {
    const results = new Set(Array.from({ length: 100 }, () => generateULID()))
    expect(results.size).toBe(100)
  })

  it('ULIDs generated within the same ms are lexicographically ordered', () => {
    const origNow = Date.now
    Date.now = () => 1700000000000
    try {
      const ulids = Array.from({ length: 10 }, () => generateULID())
      const sorted = [...ulids].sort()
      expect(ulids).toEqual(sorted)
    } finally {
      Date.now = origNow
    }
  })
})
