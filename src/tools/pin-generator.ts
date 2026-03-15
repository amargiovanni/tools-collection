import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export interface PinOptions {
  length: number
  count: number
  unique: boolean
}

function randomDigit(): string {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return (values[0]! % 10).toString()
}

function generatePinValue(length: number): string {
  return Array.from({ length }, randomDigit).join('')
}

export function generatePins(options: PinOptions): Result<string[]> {
  const length = Math.max(3, Math.min(12, options.length))
  const count = Math.max(1, Math.min(50, options.count))

  const maxPossible = Math.pow(10, length)
  if (options.unique && count > maxPossible) {
    return err(
      'COUNT_EXCEEDS_POSSIBLE',
      `Cannot generate ${count} unique PINs with length ${length} (max possible: ${maxPossible})`,
    )
  }

  const pins: string[] = []
  const generated = new Set<string>()
  const maxAttempts = count * 20
  let attempts = 0

  while (pins.length < count && attempts < maxAttempts) {
    const pin = generatePinValue(length)
    attempts++

    if (options.unique && generated.has(pin)) {
      continue
    }

    generated.add(pin)
    pins.push(pin)
  }

  return ok(pins)
}
