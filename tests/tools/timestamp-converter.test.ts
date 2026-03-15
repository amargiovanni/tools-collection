import { describe, it, expect } from 'vitest'
import { convertTimestamp, currentTimestamp } from '../../src/tools/timestamp-converter'

describe('convertTimestamp', () => {
  it('converts a Unix timestamp in seconds', () => {
    const result = convertTimestamp(0)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.seconds).toBe(0)
      expect(result.value.milliseconds).toBe(0)
      expect(result.value.iso).toBe('1970-01-01T00:00:00.000Z')
    }
  })

  it('auto-detects seconds (< 10000000000)', () => {
    const result = convertTimestamp(1700000000)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.seconds).toBe(1700000000)
      expect(result.value.milliseconds).toBe(1700000000000)
    }
  })

  it('auto-detects milliseconds (>= 10000000000)', () => {
    const result = convertTimestamp(1700000000000)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.seconds).toBe(1700000000)
      expect(result.value.milliseconds).toBe(1700000000000)
    }
  })

  it('returns error for NaN', () => {
    const result = convertTimestamp(NaN)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TIMESTAMP')
    }
  })

  it('returns error for Infinity', () => {
    const result = convertTimestamp(Infinity)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TIMESTAMP')
    }
  })

  it('produces ISO string output', () => {
    const result = convertTimestamp(1609459200)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.iso).toBe('2021-01-01T00:00:00.000Z')
    }
  })

  it('produces UTC string output', () => {
    const result = convertTimestamp(1609459200)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.utc).toBe('Fri, 01 Jan 2021 00:00:00 GMT')
    }
  })

  it('handles negative timestamps (dates before epoch)', () => {
    const result = convertTimestamp(-86400)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.iso).toBe('1969-12-31T00:00:00.000Z')
    }
  })
})

describe('currentTimestamp', () => {
  it('returns a number', () => {
    const ts = currentTimestamp()
    expect(typeof ts).toBe('number')
  })

  it('returns a value in seconds (not milliseconds)', () => {
    const ts = currentTimestamp()
    expect(ts).toBeLessThan(10000000000)
    expect(ts).toBeGreaterThan(0)
  })
})
