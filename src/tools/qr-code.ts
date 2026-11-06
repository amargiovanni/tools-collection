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

/**
 * Rasterize the QR SVG data URL into a PNG at the chosen size, in the browser.
 * Crisp edges: the QR modules must stay sharp, never smoothed.
 */
export async function qrToPngBlob(svgDataUrl: string, size: QrSize): Promise<Blob> {
  const img = new Image()
  img.src = svgDataUrl
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  ctx.drawImage(img, 0, 0, size, size)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'),
  )
}
