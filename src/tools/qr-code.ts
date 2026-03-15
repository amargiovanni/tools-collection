import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export type QrSize = 200 | 300 | 400

export interface QrOptions {
  readonly text: string
  readonly size: QrSize
}

/**
 * Generate a QR code URL using an external API.
 * Returns the image URL string on success.
 */
export function generateQrUrl(options: QrOptions): Result<string> {
  const trimmed = options.text.trim()
  if (!trimmed) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${options.size}x${options.size}&data=${encodeURIComponent(trimmed)}`
  return ok(url)
}

/**
 * Check if the BarcodeDetector API is available for QR reading.
 */
export function isBarcodeDetectorAvailable(): boolean {
  return typeof globalThis !== 'undefined' && 'BarcodeDetector' in globalThis
}
