import { describe, it, expect } from 'vitest'
import {
  isHeicHeader,
  hasHeicExtension,
  validateHeicHeader,
  toJpgFileName,
  clampJpegQuality,
  uniqueFileNames,
  DEFAULT_JPEG_QUALITY,
  MIN_JPEG_QUALITY,
} from '../../src/tools/heic-to-jpg'

function header(brand: string, box = 'ftyp', compatible: string[] = []): Uint8Array {
  const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0))
  const size = 16 + compatible.length * 4
  return new Uint8Array([0, 0, 0, size, ...ascii(box), ...ascii(brand), 0, 0, 0, 0, ...compatible.flatMap(ascii)])
}

describe('isHeicHeader', () => {
  it('accepts iPhone HEIC files', () => {
    expect(isHeicHeader(header('heic'))).toBe(true)
  })

  it('accepts other HEVC HEIF brands', () => {
    for (const brand of ['heix', 'hevc', 'heim', 'hevm', 'hevs']) {
      expect(isHeicHeader(header(brand))).toBe(true)
    }
  })

  it('accepts generic HEIF major brands with an HEVC compatible brand', () => {
    expect(isHeicHeader(header('mif1', 'ftyp', ['mif1', 'heic']))).toBe(true)
    expect(isHeicHeader(header('mif2', 'ftyp', ['mif2', 'miaf', 'heic']))).toBe(true)
    expect(isHeicHeader(header('msf1', 'ftyp', ['hevc']))).toBe(true)
  })

  it('accepts MIAF major brands that advertise HEVC compatibility', () => {
    expect(isHeicHeader(header('MiPr', 'ftyp', ['mif1', 'MiPr', 'miaf', 'MiHB', 'heic']))).toBe(true)
    expect(isHeicHeader(header('MiHB', 'ftyp', ['heic']))).toBe(true)
  })

  it('rejects generic HEIF major brands without an HEVC brand (e.g. AVIF)', () => {
    expect(isHeicHeader(header('mif1', 'ftyp', ['mif1', 'avif', 'miaf']))).toBe(false)
    expect(isHeicHeader(header('mif2'))).toBe(false)
  })

  it('ignores compatible brands past the end of the ftyp box', () => {
    const bytes = header('mif1', 'ftyp', ['heic'])
    bytes[3] = 16 // box ends before the compatible brand
    expect(isHeicHeader(bytes)).toBe(false)
  })

  it('parses 64-bit largesize ftyp boxes', () => {
    const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0))
    const large = (major: string, compatible: string[]) =>
      new Uint8Array([
        0, 0, 0, 1, ...ascii('ftyp'),
        0, 0, 0, 0, 0, 0, 0, 24 + compatible.length * 4,
        ...ascii(major), 0, 0, 0, 0, ...compatible.flatMap(ascii),
      ])
    expect(isHeicHeader(large('heic', []))).toBe(true)
    expect(isHeicHeader(large('mif1', ['mif1', 'heic']))).toBe(true)
    expect(isHeicHeader(large('avif', ['mif1']))).toBe(false)
  })

  it('rejects other ISO BMFF files such as MP4 and AVIF', () => {
    expect(isHeicHeader(header('isom', 'ftyp', ['isom', 'mp42']))).toBe(false)
    expect(isHeicHeader(header('avif', 'ftyp', ['avif', 'mif1', 'miaf']))).toBe(false)
  })

  it('rejects files without an ftyp box', () => {
    expect(isHeicHeader(header('heic', 'moov'))).toBe(false)
  })

  it('rejects JPEG data', () => {
    expect(isHeicHeader(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1]))).toBe(false)
  })

  it('rejects truncated input', () => {
    expect(isHeicHeader(new Uint8Array([0, 0, 0, 24]))).toBe(false)
  })
})

describe('validateHeicHeader', () => {
  it('returns ok for HEIC data', () => {
    expect(validateHeicHeader(header('heic')).ok).toBe(true)
  })

  it('returns NOT_HEIC for anything else', () => {
    const result = validateHeicHeader(new Uint8Array(12))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('NOT_HEIC')
  })
})

describe('hasHeicExtension', () => {
  it('matches .heic and .heif in any case', () => {
    expect(hasHeicExtension('IMG_1234.HEIC')).toBe(true)
    expect(hasHeicExtension('photo.heif')).toBe(true)
  })

  it('does not match other extensions', () => {
    expect(hasHeicExtension('photo.jpg')).toBe(false)
    expect(hasHeicExtension('heic.png')).toBe(false)
  })
})

describe('toJpgFileName', () => {
  it('replaces the HEIC extension', () => {
    expect(toJpgFileName('IMG_1234.HEIC')).toBe('IMG_1234.jpg')
    expect(toJpgFileName('holiday.photo.heif')).toBe('holiday.photo.jpg')
  })

  it('appends .jpg when there is no HEIC extension', () => {
    expect(toJpgFileName('IMG_1234')).toBe('IMG_1234.jpg')
  })

  it('falls back to a default name when nothing is left', () => {
    expect(toJpgFileName('.heic')).toBe('image.jpg')
  })
})

describe('clampJpegQuality', () => {
  it('keeps values in range', () => {
    expect(clampJpegQuality(0.75)).toBe(0.75)
  })

  it('clamps out-of-range values', () => {
    expect(clampJpegQuality(0)).toBe(MIN_JPEG_QUALITY)
    expect(clampJpegQuality(2)).toBe(1)
  })

  it('uses the default for non-numeric values', () => {
    expect(clampJpegQuality(Number.NaN)).toBe(DEFAULT_JPEG_QUALITY)
  })
})

describe('uniqueFileNames', () => {
  it('leaves distinct names unchanged', () => {
    expect(uniqueFileNames(['a.jpg', 'b.jpg'])).toEqual(['a.jpg', 'b.jpg'])
  })

  it('numbers duplicates before the extension', () => {
    expect(uniqueFileNames(['a.jpg', 'a.jpg', 'a.jpg'])).toEqual(['a.jpg', 'a (2).jpg', 'a (3).jpg'])
  })

  it('treats names differing only by case as duplicates', () => {
    expect(uniqueFileNames(['IMG.jpg', 'img.jpg'])).toEqual(['IMG.jpg', 'img (2).jpg'])
  })

  it('does not collide with an existing numbered name', () => {
    expect(uniqueFileNames(['a (2).jpg', 'a.jpg', 'a.jpg'])).toEqual(['a (2).jpg', 'a.jpg', 'a (3).jpg'])
  })
})

describe('LGPL notice for the bundled decoder', () => {
  it('names the installed heic-to version', async () => {
    const { readFileSync } = await import('node:fs')
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as {
      packages: Record<string, { version: string }>
    }
    const version = lock.packages['node_modules/heic-to']!.version
    const notice = readFileSync('public/licenses/heic-to/NOTICE.txt', 'utf8')
    // A dependency bump must update the notice (versions and source links)
    expect(notice).toContain(`heic-to   ${version}`)
    expect(notice).toContain(`heic-to/tree/v${version}`)
  })
})
