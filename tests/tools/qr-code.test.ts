import { describe, it, expect } from 'vitest'
import { generateQrUrl, isBarcodeDetectorAvailable } from '../../src/tools/qr-code'

describe('qr-code', () => {
  it('isBarcodeDetectorAvailable returns boolean', () => {
    const result = isBarcodeDetectorAvailable()
    expect(typeof result).toBe('boolean')
  })

  it('generateQrUrl returns error for empty input', () => {
    const result = generateQrUrl({ text: '', size: 200 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('EMPTY_INPUT')
  })

  it('generateQrUrl generates the QR locally as an SVG data URL', () => {
    const result = generateQrUrl({ text: 'https://example.com', size: 300 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toMatch(/^data:image\/svg\+xml/)
      // Privacy invariant: the QR payload must never leave the browser
      expect(result.value).not.toContain('api.qrserver.com')
    }
  })

  it('generateQrUrl encodes the payload into the QR modules, not into a request', () => {
    const a = generateQrUrl({ text: 'payload-one', size: 200 })
    const b = generateQrUrl({ text: 'payload-two', size: 200 })
    expect(a.ok && b.ok).toBe(true)
    if (a.ok && b.ok) expect(a.value).not.toBe(b.value)
  })
})
