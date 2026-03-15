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

  it('generateQrUrl returns valid URL for text input', () => {
    const result = generateQrUrl({ text: 'https://example.com', size: 300 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('api.qrserver.com')
      expect(result.value).toContain('300x300')
      expect(result.value).toContain('example.com')
    }
  })
})
