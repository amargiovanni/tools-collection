import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export type TimeUnit = 'ms' | 's' | 'min' | 'h' | 'd'

export interface TimeConvertResult {
  ms: number
  s: number
  min: number
  h: number
  d: number
  formatted: string
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return ''
  return Number.isInteger(value)
    ? `${value}`
    : value.toFixed(6).replace(/\.?0+$/, '')
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const hhmmss = [hours, minutes, secs]
    .map(value => String(value).padStart(2, '0'))
    .join(':')
  return days > 0 ? `${days}d ${hhmmss}` : hhmmss
}

export function convertTime(
  value: number,
  fromUnit: TimeUnit,
): Result<TimeConvertResult> {
  if (!Number.isFinite(value) || value < 0) {
    return err('INVALID_VALUE', 'Enter a valid non-negative time value')
  }

  const milliseconds =
    fromUnit === 'ms'
      ? value
      : fromUnit === 's'
        ? value * 1000
        : fromUnit === 'min'
          ? value * 60 * 1000
          : fromUnit === 'h'
            ? value * 60 * 60 * 1000
            : value * 24 * 60 * 60 * 1000

  const s = milliseconds / 1000
  const min = s / 60
  const h = min / 60
  const d = h / 24

  return ok({
    ms: milliseconds,
    s,
    min,
    h,
    d,
    formatted: formatDuration(s),
  })
}

export { formatNumber, formatDuration }
