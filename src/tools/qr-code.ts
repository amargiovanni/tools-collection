import { renderSVG } from 'uqr'
import { ok } from '../lib/result'
import type { Result } from '../lib/result'
import { validateNonEmpty } from '../lib/validation'

export type QrSize = 200 | 300 | 400

export interface QrOptions {
  readonly text: string
  readonly size: QrSize
}

/**
 * Generate a QR code locally and return it as an SVG data URL.
 * The payload never leaves the browser.
 */
export function generateQrUrl(options: QrOptions): Result<string> {
  const validated = validateNonEmpty(options.text)
  if (!validated.ok) return validated

  const svg = renderSVG(validated.value, { ecc: 'M', border: 2 })
  return ok(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
}

/**
 * Check if the BarcodeDetector API is available for QR reading.
 */
export function isBarcodeDetectorAvailable(): boolean {
  return typeof globalThis !== 'undefined' && 'BarcodeDetector' in globalThis
}
