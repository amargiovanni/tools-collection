import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

/**
 * QR code generation uses the 'qrcode' npm package (installed later in Task 5.3).
 * This module provides the pure logic wrapper.
 * QR reading uses the BarcodeDetector Web API (handled in the UI component).
 */

export type QrSize = 200 | 300 | 400

export interface QrOptions {
  readonly text: string
  readonly size: QrSize
}

/**
 * Generate a QR code as a data URL.
 * Requires the 'qrcode' package to be installed.
 * Returns the data URL string on success.
 */
export async function generateQrDataUrl(options: QrOptions): Promise<Result<string>> {
  const trimmed = options.text.trim()
  if (!trimmed) {
    return err('EMPTY_INPUT', 'Please enter some input')
  }

  try {
    // Dynamic import to avoid build errors if package not yet installed
    const QRCode = await import('qrcode')
    const dataUrl = await QRCode.toDataURL(trimmed, {
      width: options.size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
    return ok(dataUrl)
  } catch (e) {
    return err('QR_ERROR', `QR generation failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }
}

/**
 * Check if the BarcodeDetector API is available for QR reading.
 */
export function isBarcodeDetectorAvailable(): boolean {
  return typeof globalThis !== 'undefined' && 'BarcodeDetector' in globalThis
}
