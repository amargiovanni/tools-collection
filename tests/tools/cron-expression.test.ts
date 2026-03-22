import { describe, expect, it } from 'vitest'
import { parseCronExpression } from '../../src/tools/cron-expression'

describe('parseCronExpression', () => {
  it('parses a standard 5-field expression', () => {
    const result = parseCronExpression('*/15 * * * *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.normalizedExpression).toBe('*/15 * * * *')
      expect(result.value.fields).toHaveLength(5)
      expect(result.value.fields[0].expression).toBe('*/15')
    }
  })

  it('normalizes month and weekday aliases', () => {
    const result = parseCronExpression('0 9 * jan mon-fri')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.normalizedExpression).toBe('0 9 * 1 1-5')
    }
  })

  it('expands supported shortcuts', () => {
    const result = parseCronExpression('@daily')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.shortcut).toBe('@daily')
      expect(result.value.normalizedExpression).toBe('0 0 * * *')
    }
  })

  it('accepts @reboot without field parsing', () => {
    const result = parseCronExpression('@reboot')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.normalizedExpression).toBe('@reboot')
      expect(result.value.fields).toHaveLength(0)
    }
  })

  it('rejects invalid field counts', () => {
    const result = parseCronExpression('* * * *')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CRON')
    }
  })

  it('rejects out-of-range values', () => {
    const result = parseCronExpression('60 * * * *')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CRON')
    }
  })
})
