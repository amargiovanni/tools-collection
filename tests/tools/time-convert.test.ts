import { describe, it, expect } from 'vitest'
import { convertTime } from '../../src/tools/time-convert'

describe('convertTime', () => {
  it('returns error for negative value', () => {
    const result = convertTime(-1, 's')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_VALUE')
    }
  })

  it('returns error for NaN', () => {
    const result = convertTime(NaN, 's')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_VALUE')
    }
  })

  it('returns error for Infinity', () => {
    const result = convertTime(Infinity, 'ms')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_VALUE')
    }
  })

  it('converts from milliseconds', () => {
    const result = convertTime(1000, 'ms')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.ms).toBe(1000)
      expect(result.value.s).toBe(1)
    }
  })

  it('converts from seconds', () => {
    const result = convertTime(60, 's')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.ms).toBe(60000)
      expect(result.value.s).toBe(60)
      expect(result.value.min).toBe(1)
    }
  })

  it('converts from minutes', () => {
    const result = convertTime(60, 'min')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.h).toBe(1)
      expect(result.value.min).toBe(60)
    }
  })

  it('converts from hours', () => {
    const result = convertTime(24, 'h')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.d).toBe(1)
      expect(result.value.h).toBe(24)
    }
  })

  it('converts from days', () => {
    const result = convertTime(1, 'd')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.ms).toBe(86400000)
      expect(result.value.h).toBe(24)
    }
  })

  it('formats duration as HH:MM:SS for less than a day', () => {
    const result = convertTime(3661, 's')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.formatted).toBe('01:01:01')
    }
  })

  it('formats duration with days prefix', () => {
    const result = convertTime(90061, 's')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.formatted).toBe('1d 01:01:01')
    }
  })

  it('handles zero value', () => {
    const result = convertTime(0, 's')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.ms).toBe(0)
      expect(result.value.s).toBe(0)
      expect(result.value.formatted).toBe('00:00:00')
    }
  })
})
