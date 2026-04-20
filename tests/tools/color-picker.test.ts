import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, parseColor } from '../../src/tools/color-picker'

describe('hexToRgb', () => {
  it('returns error for empty input', () => {
    const result = hexToRgb('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('parses 6-digit hex with hash', () => {
    const result = hexToRgb('#FF0000')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ r: 255, g: 0, b: 0 })
    }
  })

  it('parses 6-digit hex without hash', () => {
    const result = hexToRgb('00FF00')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ r: 0, g: 255, b: 0 })
    }
  })

  it('parses 3-digit shorthand hex', () => {
    const result = hexToRgb('#FFF')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ r: 255, g: 255, b: 255 })
    }
  })

  it('parses 3-digit shorthand hex lowercase', () => {
    const result = hexToRgb('#abc')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ r: 170, g: 187, b: 204 })
    }
  })

  it('returns error for invalid hex length', () => {
    const result = hexToRgb('#FFFFF')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_HEX')
    }
  })

  it('returns error for invalid hex characters', () => {
    const result = hexToRgb('#GGGGGG')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_HEX')
    }
  })

  it('parses black', () => {
    const result = hexToRgb('#000000')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ r: 0, g: 0, b: 0 })
    }
  })

  it('parses white', () => {
    const result = hexToRgb('#FFFFFF')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ r: 255, g: 255, b: 255 })
    }
  })
})

describe('rgbToHex', () => {
  it('converts red', () => {
    const result = rgbToHex({ r: 255, g: 0, b: 0 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('#FF0000')
    }
  })

  it('converts black', () => {
    const result = rgbToHex({ r: 0, g: 0, b: 0 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('#000000')
    }
  })

  it('converts white', () => {
    const result = rgbToHex({ r: 255, g: 255, b: 255 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('#FFFFFF')
    }
  })

  it('returns error for out-of-range values', () => {
    const result = rgbToHex({ r: 256, g: 0, b: 0 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_RGB')
    }
  })

  it('returns error for negative values', () => {
    const result = rgbToHex({ r: -1, g: 0, b: 0 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_RGB')
    }
  })
})

describe('rgbToHsl', () => {
  it('converts black to HSL', () => {
    const result = rgbToHsl({ r: 0, g: 0, b: 0 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ h: 0, s: 0, l: 0 })
    }
  })

  it('converts white to HSL', () => {
    const result = rgbToHsl({ r: 255, g: 255, b: 255 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ h: 0, s: 0, l: 100 })
    }
  })

  it('converts pure red to HSL', () => {
    const result = rgbToHsl({ r: 255, g: 0, b: 0 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ h: 0, s: 100, l: 50 })
    }
  })

  it('converts pure green to HSL', () => {
    const result = rgbToHsl({ r: 0, g: 255, b: 0 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ h: 120, s: 100, l: 50 })
    }
  })

  it('converts pure blue to HSL', () => {
    const result = rgbToHsl({ r: 0, g: 0, b: 255 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ h: 240, s: 100, l: 50 })
    }
  })

  it('returns error for invalid RGB', () => {
    const result = rgbToHsl({ r: 300, g: 0, b: 0 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_RGB')
    }
  })
})

describe('hslToRgb', () => {
  it('converts pure red to RGB', () => {
    const result = hslToRgb({ h: 0, s: 100, l: 50 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ r: 255, g: 0, b: 0 })
    }
  })

  it('converts pure green to RGB', () => {
    const result = hslToRgb({ h: 120, s: 100, l: 50 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ r: 0, g: 255, b: 0 })
    }
  })

  it('converts pure blue to RGB', () => {
    const result = hslToRgb({ h: 240, s: 100, l: 50 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ r: 0, g: 0, b: 255 })
    }
  })

  it('returns error for invalid saturation', () => {
    const result = hslToRgb({ h: 0, s: 101, l: 50 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_HSL')
    }
  })
})

describe('parseColor', () => {
  it('returns error for empty input', () => {
    const result = parseColor('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('parses hex color', () => {
    const result = parseColor('#FF0000')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.hex).toBe('#FF0000')
      expect(result.value.rgb).toEqual({ r: 255, g: 0, b: 0 })
      expect(result.value.hsl).toEqual({ h: 0, s: 100, l: 50 })
    }
  })

  it('parses rgb() format', () => {
    const result = parseColor('rgb(0, 128, 255)')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rgb).toEqual({ r: 0, g: 128, b: 255 })
    }
  })

  it('parses space-separated rgb() format', () => {
    const result = parseColor('rgb(0 128 255 / .5)')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rgb).toEqual({ r: 0, g: 128, b: 255 })
    }
  })

  it('parses rgba() format', () => {
    const result = parseColor('rgba(0, 128, 255, 0.5)')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rgb).toEqual({ r: 0, g: 128, b: 255 })
    }
  })

  it('parses rgba() format with 1.0 alpha', () => {
    const result = parseColor('rgba(0, 128, 255, 1.0)')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rgb).toEqual({ r: 0, g: 128, b: 255 })
    }
  })

  it('parses hsl() format', () => {
    const result = parseColor('hsl(11, 100%, 60%)')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.hex).toBe('#FF5833')
      expect(result.value.rgb).toEqual({ r: 255, g: 87, b: 51 })
    }
  })

  it('parses space-separated hsla() format with decimal alpha', () => {
    const result = parseColor('hsla(11 100% 60% / .5)')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.hex).toBe('#FF5833')
    }
  })

  it('parses hsla() format', () => {
    const result = parseColor('hsla(11, 100%, 60%, 1)')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.hex).toBe('#FF5833')
    }
  })

  it('parses bare hex without hash', () => {
    const result = parseColor('00FF00')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.rgb).toEqual({ r: 0, g: 255, b: 0 })
    }
  })

  it('returns error for unparseable input', () => {
    const result = parseColor('not-a-color')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_COLOR')
    }
  })
})
