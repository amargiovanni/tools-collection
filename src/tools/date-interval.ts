export interface DateIntervalResult {
  totalDays: number
  years: number
  months: number
  days: number
  workingDays: number
  weekendDays: number
  totalWeeks: number
  remainderDays: number
  swapped: boolean
}

const MS_PER_DAY = 86_400_000

function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const utcTime = Date.UTC(year, month - 1, day)
  const parsed = new Date(utcTime)

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }

  return parsed
}

function countWorkingDays(start: Date, end: Date): number {
  const inclusiveDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1
  const fullWeeks = Math.floor(inclusiveDays / 7)
  let workingDays = fullWeeks * 5
  const remainderDays = inclusiveDays % 7
  const startDow = start.getUTCDay()

  for (let i = 0; i < remainderDays; i++) {
    const dow = (startDow + i) % 7
    if (dow !== 0 && dow !== 6) workingDays++
  }

  return workingDays
}

export function calculateDateInterval(startStr: string, endStr: string): DateIntervalResult | null {
  if (!startStr || !endStr) return null

  const a = parseDateInput(startStr)
  const b = parseDateInput(endStr)

  if (!a || !b) return null

  const swapped = b < a
  const start = swapped ? b : a
  const end = swapped ? a : b

  const totalDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY)
  const totalWeeks = Math.floor(totalDays / 7)
  const remainderDays = totalDays % 7

  let years = end.getUTCFullYear() - start.getUTCFullYear()
  let months = end.getUTCMonth() - start.getUTCMonth()

  const ed = end.getUTCDate()
  const sd = start.getUTCDate()
  let days: number

  if (ed >= sd) {
    days = ed - sd
  } else {
    months--
    const prevMonthDays = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0)).getUTCDate()
    const clampedSd = Math.min(sd, prevMonthDays)
    days = prevMonthDays - clampedSd + ed
  }

  if (months < 0) {
    years--
    months += 12
  }

  const workingDays = countWorkingDays(start, end)
  const weekendDays = totalDays + 1 - workingDays

  return {
    totalDays,
    years,
    months,
    days,
    workingDays,
    weekendDays,
    totalWeeks,
    remainderDays,
    swapped,
  }
}
