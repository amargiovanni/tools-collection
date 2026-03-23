import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export interface RgbColor {
  r: number
  g: number
  b: number
}

export interface HslColor {
  h: number
  s: number
  l: number
}

export function hexToRgb(hex: string): Result<RgbColor> {
  if (hex.trim() === '') {
    return err('EMPTY_INPUT', 'Please enter a hex color')
  }

  const cleaned = hex.replace(/^#/, '')

  let fullHex: string
  if (cleaned.length === 3) {
    fullHex = cleaned
      .split('')
      .map(c => c + c)
      .join('')
  } else if (cleaned.length === 6) {
    fullHex = cleaned
  } else {
    return err('INVALID_HEX', 'Hex color must be 3 or 6 characters')
  }

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex)
  if (!result) {
    return err('INVALID_HEX', 'Invalid hex color format')
  }

  return ok({
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16),
  })
}

function isValidRgb(rgb: RgbColor): boolean {
  return rgb.r >= 0 && rgb.r <= 255 && rgb.g >= 0 && rgb.g <= 255 && rgb.b >= 0 && rgb.b <= 255
}

export function rgbToHex(rgb: RgbColor): Result<string> {
  if (!isValidRgb(rgb)) {
    return err('INVALID_RGB', 'RGB values must be between 0 and 255')
  }

  const hex =
    '#' +
    ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b)
      .toString(16)
      .slice(1)
      .toUpperCase()

  return ok(hex)
}

export function rgbToHsl(rgb: RgbColor): Result<HslColor> {
  if (!isValidRgb(rgb)) {
    return err('INVALID_RGB', 'RGB values must be between 0 and 255')
  }

  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return ok({
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  })
}

export function parseColor(
  input: string,
): Result<{ hex: string; rgb: RgbColor; hsl: HslColor }> {
  if (input.trim() === '') {
    return err('EMPTY_INPUT', 'Please enter a color')
  }

  let rgb: RgbColor | undefined

  if (input.startsWith('#')) {
    const result = hexToRgb(input)
    if (!result.ok) return result
    rgb = result.value
  } else if (input.startsWith('rgb')) {
    const match = input.match(/(\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      rgb = {
        r: parseInt(match[1]!, 10),
        g: parseInt(match[2]!, 10),
        b: parseInt(match[3]!, 10),
      }
    }
  }

  if (!rgb) {
    const result = hexToRgb('#' + input)
    if (result.ok) {
      rgb = result.value
    }
  }

  if (!rgb) {
    return err('INVALID_COLOR', 'Could not parse color input')
  }

  const hexResult = rgbToHex(rgb)
  if (!hexResult.ok) return hexResult

  const hslResult = rgbToHsl(rgb)
  if (!hslResult.ok) return hslResult

  return ok({
    hex: hexResult.value,
    rgb,
    hsl: hslResult.value,
  })
}
