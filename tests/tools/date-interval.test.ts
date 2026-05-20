import { describe, expect, it } from 'vitest'
import { calculateDateInterval } from '../../src/tools/date-interval'

describe('calculateDateInterval', () => {
  it('calculates an inclusive interval across weekdays and weekends', () => {
    expect(calculateDateInterval('2024-02-01', '2024-02-03')).toEqual({
      totalDays: 2,
      years: 0,
      months: 0,
      days: 2,
      workingDays: 2,
      weekendDays: 1,
      totalWeeks: 0,
      remainderDays: 2,
      swapped: false,
    })
  })

  it('normalizes reversed dates', () => {
    expect(calculateDateInterval('2024-02-03', '2024-02-01')).toEqual({
      totalDays: 2,
      years: 0,
      months: 0,
      days: 2,
      workingDays: 2,
      weekendDays: 1,
      totalWeeks: 0,
      remainderDays: 2,
      swapped: true,
    })
  })
})
