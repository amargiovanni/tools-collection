import { describe, expect, it } from 'vitest'
import { parseCronExpression, convertCron, getNextOccurrences, getPreviousOccurrences } from '../../src/tools/cron-expression'

describe('parseCronExpression', () => {
  it('parses a standard 5-field expression', () => {
    const result = parseCronExpression('*/15 * * * *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.normalizedExpression).toBe('*/15 * * * *')
      expect(result.value.fields).toHaveLength(5)
      expect(result.value.fields[0]!.expression).toBe('*/15')
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

  it('sets format to unix for 5-field expressions', () => {
    const result = parseCronExpression('*/15 * * * *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.format).toBe('unix')
    }
  })

  it('sets format to unix for shortcuts', () => {
    const result = parseCronExpression('@daily')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.format).toBe('unix')
    }
  })
})

describe('parseAwsCronExpression', () => {
  it('parses a basic 6-field AWS expression', () => {
    const result = parseCronExpression('0 12 * * ? *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.format).toBe('aws')
      expect(result.value.fields).toHaveLength(6)
      expect(result.value.fields[0]!.type).toBe('minute')
      expect(result.value.fields[1]!.type).toBe('hour')
      expect(result.value.fields[2]!.type).toBe('dayOfMonth')
      expect(result.value.fields[3]!.type).toBe('month')
      expect(result.value.fields[4]!.type).toBe('dayOfWeek')
      expect(result.value.fields[5]!.type).toBe('year')
    }
  })

  it('uses AWS DOW numbering (1=SUN, 7=SAT)', () => {
    const result = parseCronExpression('0 0 ? * 1 *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.format).toBe('aws')
      const dowField = result.value.fields[4]!
      expect(dowField.segments[0]).toEqual({ kind: 'value', value: 1 })
    }
  })

  it('rejects DOW value 0 in AWS format', () => {
    const result = parseCronExpression('0 0 ? * 0 *')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CRON')
    }
  })

  it('rejects DOW value 8 in AWS format', () => {
    const result = parseCronExpression('0 0 ? * 8 *')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CRON')
    }
  })

  it('parses a specific year field', () => {
    const result = parseCronExpression('0 0 1 1 ? 2025')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.fields[5]!.type).toBe('year')
      expect(result.value.fields[5]!.segments[0]).toEqual({ kind: 'value', value: 2025 })
    }
  })

  it('parses a year range', () => {
    const result = parseCronExpression('0 0 1 1 ? 2020-2025')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.fields[5]!.segments[0]).toEqual({ kind: 'range', start: 2020, end: 2025 })
    }
  })

  it('rejects out-of-range year', () => {
    const result = parseCronExpression('0 0 1 1 ? 2200')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CRON')
    }
  })

  it('resolves AWS DOW aliases (MON-FRI → 2-6)', () => {
    const result = parseCronExpression('0 9 ? * MON-FRI *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const dowField = result.value.fields[4]!
      expect(dowField.segments[0]).toEqual({ kind: 'range', start: 2, end: 6 })
      expect(dowField.expression).toBe('2-6')
    }
  })

  it('parses step with start value (0/30)', () => {
    const result = parseCronExpression('0/30 * * * ? *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const minuteField = result.value.fields[0]!
      expect(minuteField.segments[0]).toEqual({
        kind: 'step',
        every: 30,
        base: { kind: 'value', value: 0 },
      })
    }
  })

  it('auto-detects 5-field as unix', () => {
    const result = parseCronExpression('*/15 * * * *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.format).toBe('unix')
      expect(result.value.fields).toHaveLength(5)
    }
  })

  it('auto-detects 6-field as aws', () => {
    const result = parseCronExpression('0 12 * * ? *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.format).toBe('aws')
      expect(result.value.fields).toHaveLength(6)
    }
  })

  it('strips cron() wrapper (case-insensitive)', () => {
    const lower = parseCronExpression('cron(0 12 * * ? *)')
    expect(lower.ok).toBe(true)
    if (lower.ok) {
      expect(lower.value.format).toBe('aws')
      expect(lower.value.fields).toHaveLength(6)
    }

    const upper = parseCronExpression('CRON(0 12 * * ? *)')
    expect(upper.ok).toBe(true)
    if (upper.ok) {
      expect(upper.value.format).toBe('aws')
      expect(upper.value.fields).toHaveLength(6)
    }

    const mixed = parseCronExpression('Cron(0 12 * * ? *)')
    expect(mixed.ok).toBe(true)
    if (mixed.ok) {
      expect(mixed.value.format).toBe('aws')
      expect(mixed.value.fields).toHaveLength(6)
    }
  })

  it('preserves original input', () => {
    const input = 'cron(0 12 * * ? *)'
    const result = parseCronExpression(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.input).toBe(input)
    }
  })

  it('parses ? as unspecified in dayOfWeek', () => {
    const result = parseCronExpression('0 12 * * ? *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const dowField = result.value.fields[4]!
      expect(dowField.segments[0]).toEqual({ kind: 'unspecified' })
      expect(dowField.expression).toBe('?')
    }
  })

  it('parses ? as unspecified in dayOfMonth', () => {
    const result = parseCronExpression('0 12 ? * 1 *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const domField = result.value.fields[2]!
      expect(domField.segments[0]).toEqual({ kind: 'unspecified' })
      expect(domField.expression).toBe('?')
    }
  })

  it('rejects ? in fields that do not allow it', () => {
    const result = parseCronExpression('? 12 * * ? *')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CRON')
    }
  })

  it('parses L in day-of-month as last day', () => {
    const result = parseCronExpression('0 10 L * ? *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const domField = result.value.fields[2]!
      expect(domField.segments[0]).toEqual({ kind: 'last' })
      expect(domField.expression).toBe('L')
    }
  })

  it('parses nW in day-of-month as nearest weekday', () => {
    const result = parseCronExpression('0 10 15W * ? *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const domField = result.value.fields[2]!
      expect(domField.segments[0]).toEqual({ kind: 'nearestWeekday', day: 15 })
      expect(domField.expression).toBe('15W')
    }
  })

  it('parses nL numeric in day-of-week as last weekday of month', () => {
    const result = parseCronExpression('0 10 ? * 6L *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const dowField = result.value.fields[4]!
      expect(dowField.segments[0]).toEqual({ kind: 'lastWeekday', day: 6 })
      expect(dowField.expression).toBe('6L')
    }
  })

  it('parses nL named in day-of-week as last weekday of month', () => {
    const result = parseCronExpression('0 10 ? * MONL *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const dowField = result.value.fields[4]!
      expect(dowField.segments[0]).toEqual({ kind: 'lastWeekday', day: 2 })
    }
  })

  it('parses n#m numeric in day-of-week as nth weekday', () => {
    const result = parseCronExpression('0 10 ? * 6#3 *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const dowField = result.value.fields[4]!
      expect(dowField.segments[0]).toEqual({ kind: 'nthDay', day: 6, nth: 3 })
      expect(dowField.expression).toBe('6#3')
    }
  })

  it('parses n#m named in day-of-week as nth weekday', () => {
    const result = parseCronExpression('30 23 ? * TUE#3 *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      const dowField = result.value.fields[4]!
      expect(dowField.segments[0]).toEqual({ kind: 'nthDay', day: 3, nth: 3 })
    }
  })

  it('rejects W in day-of-week', () => {
    const result = parseCronExpression('0 10 ? * 6W *')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CRON')
    }
  })

  it('rejects # in day-of-month', () => {
    const result = parseCronExpression('0 10 1#3 * ? *')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CRON')
    }
  })

  it('rejects # with nth > 5', () => {
    const result = parseCronExpression('0 10 ? * 6#6 *')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CRON')
    }
  })
})

describe('convertCron', () => {
  describe('unix to aws', () => {
    it('converts a simple expression', () => {
      const parsed = parseCronExpression('0 10 * * *')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'aws')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.format).toBe('aws')
      expect(result.value.fields).toHaveLength(6)
      expect(result.value.normalizedExpression).toBe('0 10 * * ? *')
    })

    it('converts DOW range 1-5 to 2-6', () => {
      const parsed = parseCronExpression('0 9 * * 1-5')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'aws')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.normalizedExpression).toBe('0 9 ? * 2-6 *')
    })

    it('converts DOW 0 (SUN) to 1', () => {
      const parsed = parseCronExpression('0 9 * * 0')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'aws')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      const dowField = result.value.fields[4]!
      expect(dowField.segments[0]).toEqual({ kind: 'value', value: 1 })
    })

    it('converts DOW 7 (SUN) to 1', () => {
      const parsed = parseCronExpression('0 9 * * 7')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'aws')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      const dowField = result.value.fields[4]!
      expect(dowField.segments[0]).toEqual({ kind: 'value', value: 1 })
    })

    it('sets DOM to ? when DOW has a value', () => {
      const parsed = parseCronExpression('0 9 * * 1')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'aws')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      const domField = result.value.fields[2]!
      expect(domField.segments[0]).toEqual({ kind: 'unspecified' })
      expect(domField.expression).toBe('?')
    })

    it('sets DOW to ? when DOM has a value', () => {
      const parsed = parseCronExpression('0 9 15 * *')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'aws')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      const dowField = result.value.fields[4]!
      expect(dowField.segments[0]).toEqual({ kind: 'unspecified' })
      expect(dowField.expression).toBe('?')
    })

    it('sets DOW to ? when both are wildcard', () => {
      const parsed = parseCronExpression('0 10 * * *')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'aws')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      const dowField = result.value.fields[4]!
      expect(dowField.segments[0]).toEqual({ kind: 'unspecified' })
      expect(dowField.expression).toBe('?')
    })

    it('returns source unchanged when already aws', () => {
      const parsed = parseCronExpression('0 10 * * ? *')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'aws')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value).toBe(parsed.value)
    })
  })

  describe('aws to unix', () => {
    it('converts a simple expression', () => {
      const parsed = parseCronExpression('0 10 * * ? *')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'unix')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.format).toBe('unix')
      expect(result.value.fields).toHaveLength(5)
      expect(result.value.normalizedExpression).toBe('0 10 * * *')
    })

    it('converts DOW range 2-6 to 1-5', () => {
      const parsed = parseCronExpression('0 9 ? * 2-6 *')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'unix')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.normalizedExpression).toBe('0 9 * * 1-5')
    })

    it('replaces ? with *', () => {
      const parsed = parseCronExpression('0 10 15 * ? *')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'unix')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.normalizedExpression).toBe('0 10 15 * *')
    })

    it('rejects L in day-of-month', () => {
      const parsed = parseCronExpression('0 10 L * ? *')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'unix')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toContain('L')
      }
    })

    it('rejects W in day-of-month', () => {
      const parsed = parseCronExpression('0 10 15W * ? *')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'unix')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toContain('W')
      }
    })

    it('rejects # in day-of-week', () => {
      const parsed = parseCronExpression('0 10 ? * 6#3 *')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'unix')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toContain('#')
      }
    })

    it('rejects non-wildcard year', () => {
      const parsed = parseCronExpression('0 10 * * ? 2025')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'unix')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toContain('year')
      }
    })

    it('returns source unchanged when already unix', () => {
      const parsed = parseCronExpression('0 10 * * *')
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      const result = convertCron(parsed.value, 'unix')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value).toBe(parsed.value)
    })
  })
})

describe('getNextOccurrences', () => {
  it('returns next 5 for every-15-min', () => {
    const parsed = parseCronExpression('*/15 * * * *')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const after = new Date('2026-04-11T10:00:00Z')
    const results = getNextOccurrences(parsed.value, 5, after)
    expect(results).toHaveLength(5)
    expect(results[0]).toEqual(new Date('2026-04-11T10:15:00Z'))
    expect(results[1]).toEqual(new Date('2026-04-11T10:30:00Z'))
    expect(results[2]).toEqual(new Date('2026-04-11T10:45:00Z'))
    expect(results[3]).toEqual(new Date('2026-04-11T11:00:00Z'))
    expect(results[4]).toEqual(new Date('2026-04-11T11:15:00Z'))
  })

  it('returns next for daily at 09:00', () => {
    const parsed = parseCronExpression('0 9 * * *')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const after = new Date('2026-04-11T10:00:00Z')
    const results = getNextOccurrences(parsed.value, 3, after)
    expect(results[0]).toEqual(new Date('2026-04-12T09:00:00Z'))
    expect(results[1]).toEqual(new Date('2026-04-13T09:00:00Z'))
    expect(results[2]).toEqual(new Date('2026-04-14T09:00:00Z'))
  })

  it('skips weekends for weekdays-only (unix MON-FRI)', () => {
    const parsed = parseCronExpression('0 9 * * 1-5')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    // 2026-04-11 is a Saturday
    const after = new Date('2026-04-11T10:00:00Z')
    const results = getNextOccurrences(parsed.value, 3, after)
    expect(results[0]).toEqual(new Date('2026-04-13T09:00:00Z')) // Monday
    expect(results[1]).toEqual(new Date('2026-04-14T09:00:00Z'))
    expect(results[2]).toEqual(new Date('2026-04-15T09:00:00Z'))
  })

  it('handles monthly on day 1 (AWS)', () => {
    const parsed = parseCronExpression('0 8 1 * ? *')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const after = new Date('2026-04-02T00:00:00Z')
    const results = getNextOccurrences(parsed.value, 3, after)
    expect(results[0]).toEqual(new Date('2026-05-01T08:00:00Z'))
    expect(results[1]).toEqual(new Date('2026-06-01T08:00:00Z'))
    expect(results[2]).toEqual(new Date('2026-07-01T08:00:00Z'))
  })

  it('handles AWS L (last day of month)', () => {
    const parsed = parseCronExpression('0 10 L * ? *')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const after = new Date('2026-04-01T00:00:00Z')
    const results = getNextOccurrences(parsed.value, 3, after)
    expect(results[0]).toEqual(new Date('2026-04-30T10:00:00Z'))
    expect(results[1]).toEqual(new Date('2026-05-31T10:00:00Z'))
    expect(results[2]).toEqual(new Date('2026-06-30T10:00:00Z'))
  })

  it('handles AWS # (nth weekday)', () => {
    const parsed = parseCronExpression('0 10 ? * 6#3 *')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    // 3rd Friday (AWS 6=FRI) of April 2026 = April 17
    const after = new Date('2026-04-01T00:00:00Z')
    const results = getNextOccurrences(parsed.value, 2, after)
    expect(results[0]).toEqual(new Date('2026-04-17T10:00:00Z'))
    expect(results[1]).toEqual(new Date('2026-05-15T10:00:00Z'))
  })

  it('handles AWS W (nearest weekday)', () => {
    const parsed = parseCronExpression('0 10 15W * ? *')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    // April 15 2026 is Wednesday -> 15W = 15th
    const after = new Date('2026-04-01T00:00:00Z')
    const results = getNextOccurrences(parsed.value, 1, after)
    expect(results[0]).toEqual(new Date('2026-04-15T10:00:00Z'))
  })

  it('handles AWS nL (last weekday of month)', () => {
    const parsed = parseCronExpression('0 10 ? * 6L *')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    // Last Friday (AWS 6=FRI) of April 2026 = April 24
    const after = new Date('2026-04-01T00:00:00Z')
    const results = getNextOccurrences(parsed.value, 1, after)
    expect(results[0]).toEqual(new Date('2026-04-24T10:00:00Z'))
  })

  it('handles AWS year constraint', () => {
    const parsed = parseCronExpression('0 0 1 1 ? 2027')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const after = new Date('2026-04-11T00:00:00Z')
    const results = getNextOccurrences(parsed.value, 1, after)
    expect(results[0]).toEqual(new Date('2027-01-01T00:00:00Z'))
  })

  it('returns empty for past year', () => {
    const parsed = parseCronExpression('0 0 1 1 ? 2020')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const after = new Date('2026-04-11T00:00:00Z')
    const results = getNextOccurrences(parsed.value, 1, after)
    expect(results).toHaveLength(0)
  })
})

describe('getPreviousOccurrences', () => {
  it('returns previous 3 for every-15-min', () => {
    const parsed = parseCronExpression('*/15 * * * *')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const before = new Date('2026-04-11T10:00:00Z')
    const results = getPreviousOccurrences(parsed.value, 3, before)
    expect(results).toHaveLength(3)
    expect(results[0]).toEqual(new Date('2026-04-11T09:45:00Z'))
    expect(results[1]).toEqual(new Date('2026-04-11T09:30:00Z'))
    expect(results[2]).toEqual(new Date('2026-04-11T09:15:00Z'))
  })

  it('returns previous for daily at 09:00', () => {
    const parsed = parseCronExpression('0 9 * * *')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const before = new Date('2026-04-11T10:00:00Z')
    const results = getPreviousOccurrences(parsed.value, 2, before)
    expect(results[0]).toEqual(new Date('2026-04-11T09:00:00Z'))
    expect(results[1]).toEqual(new Date('2026-04-10T09:00:00Z'))
  })
})
