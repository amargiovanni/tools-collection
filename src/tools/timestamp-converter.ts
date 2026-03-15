import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export interface TimestampResult {
  seconds: number
  milliseconds: number
  iso: string
  utc: string
  locale: string
}

export function convertTimestamp(input: number): Result<TimestampResult> {
  if (!Number.isFinite(input)) {
    return err('INVALID_TIMESTAMP', 'Timestamp must be a finite number')
  }

  const ms = input < 10000000000 ? input * 1000 : input
  const date = new Date(ms)

  if (isNaN(date.getTime())) {
    return err('INVALID_DATE', 'Invalid date')
  }

  return ok({
    seconds: Math.floor(date.getTime() / 1000),
    milliseconds: date.getTime(),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    locale: date.toLocaleString(),
  })
}

export function currentTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}
