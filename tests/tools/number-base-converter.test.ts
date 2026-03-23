import { describe, it, expect } from 'vitest'
import { convertBase } from '../../src/tools/number-base-converter'

describe('convertBase', () => {
  it('converts 255 decimal to all bases', () => {
    expect(convertBase('255', 10)).toEqual({ decimal: '255', hex: 'ff', binary: '11111111', octal: '377' })
  })

  it('converts ff hex to all bases', () => {
    expect(convertBase('ff', 16)).toEqual({ decimal: '255', hex: 'ff', binary: '11111111', octal: '377' })
  })

  it('converts 11111111 binary to all bases', () => {
    expect(convertBase('11111111', 2)).toEqual({ decimal: '255', hex: 'ff', binary: '11111111', octal: '377' })
  })

  it('converts 377 octal to all bases', () => {
    expect(convertBase('377', 8)).toEqual({ decimal: '255', hex: 'ff', binary: '11111111', octal: '377' })
  })

  it('handles negative decimal correctly', () => {
    expect(convertBase('-10', 10)).toEqual({ decimal: '-10', hex: '-a', binary: '-1010', octal: '-12' })
  })

  it('handles zero', () => {
    expect(convertBase('0', 10)).toEqual({ decimal: '0', hex: '0', binary: '0', octal: '0' })
  })

  it('handles large number beyond Number.MAX_SAFE_INTEGER', () => {
    const result = convertBase('9007199254740993', 10)
    expect(result).not.toBeNull()
    expect(result?.decimal).toBe('9007199254740993')
  })

  it('accepts uppercase hex digits', () => {
    expect(convertBase('FF', 16)).toEqual({ decimal: '255', hex: 'ff', binary: '11111111', octal: '377' })
  })

  it('returns null for empty input', () => {
    expect(convertBase('', 10)).toBeNull()
    expect(convertBase('   ', 10)).toBeNull()
  })

  it('returns null for invalid digit in binary (digit 2)', () => {
    expect(convertBase('2', 2)).toBeNull()
  })

  it('returns null for invalid digit in hex (letter g)', () => {
    expect(convertBase('g', 16)).toBeNull()
  })

  it('returns null for invalid digit in octal (digit 8)', () => {
    expect(convertBase('8', 8)).toBeNull()
  })
})
