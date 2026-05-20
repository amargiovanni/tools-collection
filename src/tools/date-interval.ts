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

export function calculateDateInterval(startStr: string, endStr: string): DateIntervalResult | null {
  if (!startStr || !endStr) return null

  const a = new Date(startStr + 'T00:00:00')
  const b = new Date(endStr + 'T00:00:00')

  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null

  const swapped = b < a
  const start = swapped ? b : a
  const end = swapped ? a : b

  const msPerDay = 86_400_000
  const totalDays = Math.round((end.getTime() - start.getTime()) / msPerDay)
  const totalWeeks = Math.floor(totalDays / 7)
  const remainderDays = totalDays % 7

  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()

  const ed = end.getDate()
  const sd = start.getDate()
  let days: number

  if (ed >= sd) {
    days = ed - sd
  } else {
    months--
    const prevMonthDays = new Date(end.getFullYear(), end.getMonth(), 0).getDate()
    const clampedSd = Math.min(sd, prevMonthDays)
    days = prevMonthDays - clampedSd + ed
  }

  if (months < 0) {
    years--
    months += 12
  }

  let workingDays = 0
  const cur = new Date(start.getTime())
  while (cur.getTime() <= end.getTime()) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) workingDays++
    cur.setDate(cur.getDate() + 1)
  }
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
