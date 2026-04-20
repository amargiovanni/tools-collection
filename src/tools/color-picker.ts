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

function isValidRgb(rgb: RgbColor): boolean {
  return rgb.r >= 0 && rgb.r <= 255 && rgb.g >= 0 && rgb.g <= 255 && rgb.b >= 0 && rgb.b <= 255
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

export function hslToRgb(hsl: HslColor): Result<RgbColor> {
  if (hsl.s < 0 || hsl.s > 100 || hsl.l < 0 || hsl.l > 100) {
    return err('INVALID_HSL', 'HSL saturation and lightness must be between 0 and 100')
  }

  const h = ((hsl.h % 360) + 360) % 360 / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  if (s === 0) {
    const value = Math.round(l * 255)
    return ok({ r: value, g: value, b: value })
  }

  const hueToRgb = (p: number, q: number, t: number): number => {
    let normalized = t
    if (normalized < 0) normalized += 1
    if (normalized > 1) normalized -= 1
    if (normalized < 1 / 6) return p + (q - p) * 6 * normalized
    if (normalized < 1 / 2) return q
    if (normalized < 2 / 3) return p + (q - p) * (2 / 3 - normalized) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return ok({
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  })
}

function parseRgbFunction(input: string): RgbColor | undefined {
  const match = input.match(/^rgba?\(\s*([+-]?\d+(?:\.\d+)?%?)\s*([, ])\s*([+-]?\d+(?:\.\d+)?%?)\s*\2\s*([+-]?\d+(?:\.\d+)?%?)(?:\s*([,/])\s*([+-]?\d+(?:\.\d+)?%?)\s*)?\)$/i)
  if (!match) return undefined

  const rgb = {
    r: parseInt(match[1]!, 10),
    g: parseInt(match[2]!, 10),
    b: parseInt(match[3]!, 10),
  }

  return isValidRgb(rgb) ? rgb : undefined
}

function parseHslFunction(input: string): Result<RgbColor> | undefined {
  const match = input.match(/^hsla?\(\s*([+-]?\d+(?:\.\d+)?)\s*[, ]\s*([+-]?\d+(?:\.\d+)?)%\s*[, ]\s*([+-]?\d+(?:\.\d+)?)%(?:\s*[,/]\s*(?:0|1|\d*\.\d+)\s*)?\)$/i)
  if (!match) return undefined

  return hslToRgb({
    h: parseFloat(match[1]!),
    s: parseFloat(match[2]!),
    l: parseFloat(match[3]!),
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
  } else if (/^rgba?\(/i.test(input)) {
    rgb = parseRgbFunction(input)
  } else if (/^hsla?\(/i.test(input)) {
    const hslResult = parseHslFunction(input)
    if (hslResult) {
      if (hslResult.ok) {
        rgb = hslResult.value
      } else {
        return hslResult
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
