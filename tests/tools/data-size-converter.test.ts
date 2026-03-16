import { describe, it, expect } from 'vitest'
import { convertDataSize } from '../../src/tools/data-size-converter'

describe('convertDataSize', () => {
  it('returns error for negative values', () => {
    const result = convertDataSize(-1, 'MB')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_SIZE_VALUE')
    }
  })

  it('returns error for NaN', () => {
    const result = convertDataSize(Number.NaN, 'B')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_SIZE_VALUE')
    }
  })

  it('converts decimal units correctly', () => {
    const result = convertDataSize(1, 'MB')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.B).toBe(1_000_000)
      expect(result.value.KB).toBe(1_000)
      expect(result.value.GB).toBe(0.001)
    }
  })

  it('converts binary units correctly', () => {
    const result = convertDataSize(1, 'GiB')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.B).toBe(1_073_741_824)
      expect(result.value.MiB).toBe(1_024)
      expect(result.value.GB).toBeCloseTo(1.073741824)
    }
  })

  it('converts bits to bytes correctly', () => {
    const result = convertDataSize(8, 'b')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.B).toBe(1)
      expect(result.value.KiB).toBeCloseTo(1 / 1024)
    }
  })
})
