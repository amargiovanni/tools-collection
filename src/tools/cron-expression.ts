import { err, ok } from '../lib/result'
import type { Result } from '../lib/result'

export type CronFormat = 'unix' | 'aws'

export type CronFieldType = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek' | 'year'

export type CronSegment =
  | { kind: 'any' }
  | { kind: 'value'; value: number }
  | { kind: 'range'; start: number; end: number }
  | {
      kind: 'step'
      every: number
      base: { kind: 'any' } | { kind: 'value'; value: number } | { kind: 'range'; start: number; end: number }
    }
  | { kind: 'unspecified' }
  | { kind: 'last' }
  | { kind: 'lastWeekday'; day: number }
  | { kind: 'nearestWeekday'; day: number }
  | { kind: 'nthDay'; day: number; nth: number }

export interface CronField {
  type: CronFieldType
  expression: string
  segments: CronSegment[]
}

export interface CronExpressionResult {
  input: string
  normalizedExpression: string
  shortcut: string | null
  fields: CronField[]
  format: CronFormat
}

interface FieldConfig {
  type: CronFieldType
  min: number
  max: number
  aliases?: Record<string, number>
  allowUnspecified?: boolean
  allowLast?: boolean
  allowNearestWeekday?: boolean
  allowNthDay?: boolean
  allowLastWeekday?: boolean
}

const MONTH_ALIASES: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
}

const DAY_ALIASES: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

const FIELD_CONFIGS: readonly FieldConfig[] = [
  { type: 'minute', min: 0, max: 59 },
  { type: 'hour', min: 0, max: 23 },
  { type: 'dayOfMonth', min: 1, max: 31 },
  { type: 'month', min: 1, max: 12, aliases: MONTH_ALIASES },
  { type: 'dayOfWeek', min: 0, max: 7, aliases: DAY_ALIASES },
]

const AWS_DAY_ALIASES: Record<string, number> = {
  sun: 1,
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7,
}

const AWS_FIELD_CONFIGS: readonly FieldConfig[] = [
  { type: 'minute', min: 0, max: 59 },
  { type: 'hour', min: 0, max: 23 },
  {
    type: 'dayOfMonth',
    min: 1,
    max: 31,
    allowUnspecified: true,
    allowLast: true,
    allowNearestWeekday: true,
  },
  { type: 'month', min: 1, max: 12, aliases: MONTH_ALIASES },
  {
    type: 'dayOfWeek',
    min: 1,
    max: 7,
    aliases: AWS_DAY_ALIASES,
    allowUnspecified: true,
    allowLast: true,
    allowLastWeekday: true,
    allowNthDay: true,
  },
  { type: 'year', min: 1970, max: 2199 },
]

const SHORTCUTS: Record<string, string | null> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
  '@reboot': null,
}

export function parseCronExpression(input: string): Result<CronExpressionResult> {
  const trimmed = input.trim()
  if (!trimmed) {
    return err('EMPTY_INPUT', 'Please enter a cron expression')
  }

  const lowered = trimmed.toLowerCase()
  if (lowered in SHORTCUTS) {
    const expansion = SHORTCUTS[lowered]
    if (expansion === null) {
      return ok({
        input: trimmed,
        normalizedExpression: '@reboot',
        shortcut: lowered,
        fields: [],
        format: 'unix',
      })
    }

    const parsed = parseExpandedExpression(expansion!)
    if (!parsed.ok) {
      return parsed
    }

    return ok({
      input: trimmed,
      normalizedExpression: expansion!,
      shortcut: lowered,
      fields: parsed.value.fields,
      format: 'unix',
    })
  }

  // Strip cron(...) wrapper (case-insensitive)
  const cronWrapperMatch = trimmed.match(/^cron\((.+)\)$/i)
  const expressionBody = cronWrapperMatch ? cronWrapperMatch[1]! : trimmed

  // Auto-detect format based on token count
  const tokens = expressionBody.trim().split(/\s+/)
  if (tokens.length === 6) {
    const parsed = parseAwsExpression(expressionBody)
    if (!parsed.ok) {
      return parsed
    }
    return ok({
      ...parsed.value,
      input: trimmed,
    })
  }

  const parsed = parseExpandedExpression(expressionBody)
  if (!parsed.ok) {
    return parsed
  }
  return ok({
    ...parsed.value,
    input: trimmed,
  })
}

function parseExpandedExpression(input: string): Result<CronExpressionResult> {
  const parts = input.trim().split(/\s+/)
  if (parts.length !== 5) {
    return err('INVALID_CRON', 'Cron expressions must contain exactly 5 fields')
  }

  const fields: CronField[] = []
  for (let index = 0; index < FIELD_CONFIGS.length; index += 1) {
    const parsedField = parseField(parts[index]!, FIELD_CONFIGS[index]!)
    if (!parsedField.ok) {
      return parsedField
    }
    fields.push(parsedField.value)
  }

  return ok({
    input,
    normalizedExpression: fields.map((field) => field.expression).join(' '),
    shortcut: null,
    fields,
    format: 'unix',
  })
}

function parseAwsExpression(input: string): Result<CronExpressionResult> {
  const parts = input.trim().split(/\s+/)
  if (parts.length !== 6) {
    return err('INVALID_CRON', 'AWS cron expressions must contain exactly 6 fields')
  }

  const fields: CronField[] = []
  for (let index = 0; index < AWS_FIELD_CONFIGS.length; index += 1) {
    const parsedField = parseField(parts[index]!, AWS_FIELD_CONFIGS[index]!)
    if (!parsedField.ok) {
      return parsedField
    }
    fields.push(parsedField.value)
  }

  const dayOfMonth = fields[2]!
  const dayOfWeek = fields[4]!
  const dayOfMonthIsUnspecified = isUnspecifiedField(dayOfMonth)
  const dayOfWeekIsUnspecified = isUnspecifiedField(dayOfWeek)

  if (dayOfMonthIsUnspecified === dayOfWeekIsUnspecified) {
    return err(
      'INVALID_CRON',
      'AWS cron expressions must use ? in exactly one of day-of-month or day-of-week',
    )
  }

  return ok({
    input,
    normalizedExpression: fields.map((field) => field.expression).join(' '),
    shortcut: null,
    fields,
    format: 'aws',
  })
}

function parseField(expression: string, config: FieldConfig): Result<CronField> {
  if (!expression) {
    return err('INVALID_CRON', `Missing ${config.type} field`)
  }

  const parts = expression.split(',')
  const segments: CronSegment[] = []
  const normalizedParts: string[] = []

  for (const part of parts) {
    if (!part) {
      return err('INVALID_CRON', `Invalid ${config.type} field`)
    }

    const parsedSegment = parseSegment(part, config)
    if (!parsedSegment.ok) {
      return parsedSegment
    }

    segments.push(parsedSegment.value.segment)
    normalizedParts.push(parsedSegment.value.normalized)
  }

  return ok({
    type: config.type,
    expression: normalizedParts.join(','),
    segments,
  })
}

function parseSegment(
  part: string,
  config: FieldConfig,
): Result<{ segment: CronSegment; normalized: string }> {
  if (part === '?') {
    if (!config.allowUnspecified) {
      return err('INVALID_CRON', `Unspecified (?) is not allowed in ${config.type}`)
    }
    return ok({ segment: { kind: 'unspecified' }, normalized: '?' })
  }

  if (part === '*') {
    return ok({ segment: { kind: 'any' }, normalized: '*' })
  }

  // L alone: last day of month
  if (part.toUpperCase() === 'L') {
    if (!config.allowLast) {
      return err('INVALID_CRON', `L is not allowed in ${config.type}`)
    }
    return ok({ segment: { kind: 'last' }, normalized: 'L' })
  }

  // nW: nearest weekday to day n (e.g. 15W)
  const weekdayMatch = part.match(/^(\d+)W$/i)
  if (weekdayMatch) {
    if (!config.allowNearestWeekday) {
      return err('INVALID_CRON', `W (nearest weekday) is not allowed in ${config.type}`)
    }
    const day = Number(weekdayMatch[1])
    if (day < config.min || day > config.max) {
      return err('INVALID_CRON', `${config.type} values must be between ${config.min} and ${config.max}`)
    }
    return ok({ segment: { kind: 'nearestWeekday', day }, normalized: `${day}W` })
  }

  // nL: last weekday n of month (e.g. 6L or MONL)
  const lastWeekdayMatch = part.match(/^([a-zA-Z]+|\d+)L$/i)
  if (lastWeekdayMatch) {
    if (!config.allowLastWeekday) {
      return err('INVALID_CRON', `L (last weekday) is not allowed in ${config.type}`)
    }
    const raw = lastWeekdayMatch[1]!
    const dayValue = parseValue(raw, config)
    if (!dayValue.ok) {
      return dayValue
    }
    return ok({ segment: { kind: 'lastWeekday', day: dayValue.value }, normalized: `${dayValue.value}L` })
  }

  // n#m: nth weekday of month (e.g. 6#3 or TUE#3)
  if (part.includes('#')) {
    if (!config.allowNthDay) {
      return err('INVALID_CRON', `# (nth day) is not allowed in ${config.type}`)
    }
    const [dayRaw, nthRaw, ...rest] = part.split('#')
    if (!dayRaw || !nthRaw || rest.length > 0) {
      return err('INVALID_CRON', `Invalid # syntax in ${config.type}`)
    }
    const dayValue = parseValue(dayRaw, config)
    if (!dayValue.ok) {
      return dayValue
    }
    const nth = Number(nthRaw)
    if (!Number.isInteger(nth) || nth < 1 || nth > 5) {
      return err('INVALID_CRON', `nth value must be between 1 and 5 in ${config.type}`)
    }
    return ok({ segment: { kind: 'nthDay', day: dayValue.value, nth }, normalized: `${dayValue.value}#${nth}` })
  }

  if (part.includes('/')) {
    const [base, everyRaw, ...rest] = part.split('/')
    if (!base || !everyRaw || rest.length > 0) {
      return err('INVALID_CRON', `Invalid step syntax in ${config.type}`)
    }

    const every = Number(everyRaw)
    if (!Number.isInteger(every) || every <= 0) {
      return err('INVALID_CRON', `Invalid step value in ${config.type}`)
    }

    const parsedBase = parseBaseSegment(base, config)
    if (!parsedBase.ok) {
      return parsedBase
    }

    return ok({
      segment: {
        kind: 'step',
        every,
        base: parsedBase.value.segment,
      },
      normalized: `${parsedBase.value.normalized}/${every}`,
    })
  }

  return parseBaseSegment(part, config)
}

function parseBaseSegment(
  part: string,
  config: FieldConfig,
): Result<{ segment: Extract<CronSegment, { kind: 'any' | 'value' | 'range' }>; normalized: string }> {
  if (part === '*') {
    return ok({ segment: { kind: 'any' }, normalized: '*' })
  }

  if (part.includes('-')) {
    const [startRaw, endRaw, ...rest] = part.split('-')
    if (!startRaw || !endRaw || rest.length > 0) {
      return err('INVALID_CRON', `Invalid range syntax in ${config.type}`)
    }

    const start = parseValue(startRaw, config)
    const end = parseValue(endRaw, config)
    if (!start.ok) {
      return err('INVALID_CRON', `Invalid range value in ${config.type}`)
    }
    if (!end.ok) {
      return err('INVALID_CRON', `Invalid range value in ${config.type}`)
    }
    if (start.value > end.value) {
      return err('INVALID_CRON', `Range start must be less than or equal to range end in ${config.type}`)
    }

    return ok({
      segment: { kind: 'range', start: start.value, end: end.value },
      normalized: `${start.value}-${end.value}`,
    })
  }

  const value = parseValue(part, config)
  if (!value.ok) {
    return value
  }

  return ok({
    segment: { kind: 'value', value: value.value },
    normalized: String(value.value),
  })
}

function parseValue(raw: string, config: FieldConfig): Result<number> {
  const lowered = raw.toLowerCase()
  const aliasValue = config.aliases?.[lowered]
  const value = aliasValue ?? Number(lowered)

  if (!Number.isInteger(value)) {
    return err('INVALID_CRON', `Invalid value "${raw}" in ${config.type}`)
  }
  if (value < config.min || value > config.max) {
    return err('INVALID_CRON', `${config.type} values must be between ${config.min} and ${config.max}`)
  }

  return ok(value)
}

export function isAnyField(field: CronField): boolean {
  return field.segments.length === 1 && field.segments[0]!.kind === 'any'
}

function isUnspecifiedField(field: CronField): boolean {
  return field.segments.length === 1 && field.segments[0]!.kind === 'unspecified'
}

function normalizeSegment(segment: CronSegment): string {
  switch (segment.kind) {
    case 'any':
      return '*'
    case 'unspecified':
      return '?'
    case 'value':
      return String(segment.value)
    case 'range':
      return `${segment.start}-${segment.end}`
    case 'step': {
      const base = normalizeSegment(segment.base)
      return `${base}/${segment.every}`
    }
    case 'last':
      return 'L'
    case 'lastWeekday':
      return `${segment.day}L`
    case 'nearestWeekday':
      return `${segment.day}W`
    case 'nthDay':
      return `${segment.day}#${segment.nth}`
  }
}

function normalizeSegments(segments: CronSegment[]): string {
  return segments.map(normalizeSegment).join(',')
}

function convertDowValueToAws(value: number): number {
  return (value % 7) + 1
}

function convertDowSegmentToAws(segment: CronSegment): CronSegment {
  switch (segment.kind) {
    case 'value':
      return { kind: 'value', value: convertDowValueToAws(segment.value) }
    case 'range':
      return { kind: 'range', start: convertDowValueToAws(segment.start), end: convertDowValueToAws(segment.end) }
    case 'step':
      return {
        kind: 'step',
        every: segment.every,
        base: convertDowSegmentToAws(segment.base) as { kind: 'any' } | { kind: 'value'; value: number } | { kind: 'range'; start: number; end: number },
      }
    default:
      return segment
  }
}

function convertDowValueToUnix(value: number): number {
  return value - 1
}

function convertDowSegmentToUnix(segment: CronSegment): CronSegment {
  switch (segment.kind) {
    case 'value':
      return { kind: 'value', value: convertDowValueToUnix(segment.value) }
    case 'range':
      return { kind: 'range', start: convertDowValueToUnix(segment.start), end: convertDowValueToUnix(segment.end) }
    case 'step':
      return {
        kind: 'step',
        every: segment.every,
        base: convertDowSegmentToUnix(segment.base) as { kind: 'any' } | { kind: 'value'; value: number } | { kind: 'range'; start: number; end: number },
      }
    default:
      return segment
  }
}

function replaceUnspecifiedWithAny(field: CronField): CronField {
  if (field.segments.length === 1 && field.segments[0]!.kind === 'unspecified') {
    const segments: CronSegment[] = [{ kind: 'any' }]
    return { type: field.type, expression: normalizeSegments(segments), segments }
  }
  return field
}

function convertUnixToAws(source: CronExpressionResult): Result<CronExpressionResult> {
  if (source.shortcut === '@reboot' || source.fields.length < 5) {
    return err('CONVERSION_ERROR', 'Cannot convert @reboot to AWS cron format')
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = source.fields as [CronField, CronField, CronField, CronField, CronField]

  const dowIsWildcard = isAnyField(dayOfWeek)
  const domIsWildcard = isAnyField(dayOfMonth)

  let newDom: CronField
  let newDow: CronField

  if (!dowIsWildcard) {
    // DOW has a specific value → set DOM to ?
    const convertedSegments = dayOfWeek.segments.map(convertDowSegmentToAws)
    newDow = { type: 'dayOfWeek', expression: normalizeSegments(convertedSegments), segments: convertedSegments }
    const unspecifiedSegments: CronSegment[] = [{ kind: 'unspecified' }]
    newDom = { type: 'dayOfMonth', expression: normalizeSegments(unspecifiedSegments), segments: unspecifiedSegments }
  } else if (!domIsWildcard || (domIsWildcard && dowIsWildcard)) {
    // DOM has a specific value OR both are wildcard → set DOW to ?
    newDom = dayOfMonth
    const unspecifiedSegments: CronSegment[] = [{ kind: 'unspecified' }]
    newDow = { type: 'dayOfWeek', expression: normalizeSegments(unspecifiedSegments), segments: unspecifiedSegments }
  } else {
    newDom = dayOfMonth
    newDow = dayOfWeek
  }

  const yearSegments: CronSegment[] = [{ kind: 'any' }]
  const yearField: CronField = { type: 'year', expression: '*', segments: yearSegments }

  const fields = [minute, hour, newDom, month, newDow, yearField]
  return ok({
    input: source.input,
    normalizedExpression: fields.map((f) => f.expression).join(' '),
    shortcut: source.shortcut,
    fields,
    format: 'aws',
  })
}

function hasUnsupportedSegment(field: CronField): string | null {
  for (const segment of field.segments) {
    if (segment.kind === 'last') return 'L'
    if (segment.kind === 'lastWeekday') return 'L'
    if (segment.kind === 'nearestWeekday') return 'W'
    if (segment.kind === 'nthDay') return '#'
  }
  return null
}

function convertAwsToUnix(source: CronExpressionResult): Result<CronExpressionResult> {
  const [minute, hour, dayOfMonth, month, dayOfWeek, year] = source.fields as [CronField, CronField, CronField, CronField, CronField, CronField]

  // Reject non-wildcard year
  if (!isAnyField(year)) {
    return err('CONVERSION_ERROR', 'Cannot convert to unix: year field is not supported in unix cron')
  }

  // Reject unsupported segments across all fields
  for (const field of [minute, hour, dayOfMonth, month, dayOfWeek]) {
    const unsupported = hasUnsupportedSegment(field)
    if (unsupported !== null) {
      return err('CONVERSION_ERROR', `Cannot convert to unix: ${unsupported} is not supported in unix cron`)
    }
  }

  // Replace ? with * in DOM/DOW
  const newDom = replaceUnspecifiedWithAny(dayOfMonth)
  const newDow = replaceUnspecifiedWithAny(dayOfWeek)

  // Convert DOW numbering
  const convertedDowSegments = newDow.segments.map(convertDowSegmentToUnix)
  const finalDow: CronField = {
    type: 'dayOfWeek',
    expression: normalizeSegments(convertedDowSegments),
    segments: convertedDowSegments,
  }

  const fields = [minute, hour, newDom, month, finalDow]
  return ok({
    input: source.input,
    normalizedExpression: fields.map((f) => f.expression).join(' '),
    shortcut: source.shortcut,
    fields,
    format: 'unix',
  })
}

export function convertCron(source: CronExpressionResult, targetFormat: CronFormat): Result<CronExpressionResult> {
  if (source.format === targetFormat) {
    return ok(source)
  }

  if (targetFormat === 'aws') {
    return convertUnixToAws(source)
  }

  return convertAwsToUnix(source)
}

// --- Schedule evaluator: next/previous occurrences ---

function getLastDayOfMonth(year: number, month: number): number {
  // month is 0-indexed (JS Date convention)
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function getNearestWeekday(year: number, month: number, targetDay: number): number {
  // month is 0-indexed. Returns the day-of-month that is the nearest weekday to targetDay.
  const lastDay = getLastDayOfMonth(year, month)
  const day = Math.min(targetDay, lastDay)
  const date = new Date(Date.UTC(year, month, day))
  const dow = date.getUTCDay() // 0=SUN..6=SAT
  if (dow >= 1 && dow <= 5) return day // already weekday
  if (dow === 6) return day > 1 ? day - 1 : day + 2 // Saturday -> Friday, unless 1st -> Monday
  // Sunday
  return day < lastDay ? day + 1 : day - 2 // -> Monday, unless last day -> Friday
}

function isNthWeekdayOfMonth(date: Date, awsDow: number, nth: number): boolean {
  // awsDow: 1=SUN..7=SAT. Check if date is the nth occurrence of that weekday in its month.
  const jsDow = awsDow === 1 ? 0 : awsDow - 1 // convert to JS 0=SUN
  if (date.getUTCDay() !== jsDow) return false
  return Math.ceil(date.getUTCDate() / 7) === nth
}

function isLastWeekdayOfMonth(date: Date, awsDow: number): boolean {
  // Check if date is the LAST occurrence of awsDow weekday in its month
  const jsDow = awsDow === 1 ? 0 : awsDow - 1
  if (date.getUTCDay() !== jsDow) return false
  return date.getUTCDate() + 7 > getLastDayOfMonth(date.getUTCFullYear(), date.getUTCMonth())
}

function matchesSegment(segment: CronSegment, value: number, fieldType: CronFieldType, date: Date): boolean {
  switch (segment.kind) {
    case 'any':
    case 'unspecified':
      return true
    case 'value':
      return value === segment.value
    case 'range':
      return value >= segment.start && value <= segment.end
    case 'step': {
      if (segment.base.kind === 'any') {
        const fieldMin =
          fieldType === 'year'
            ? 1970
            : fieldType === 'dayOfMonth'
              ? 1
              : fieldType === 'month'
                ? 1
                : 0
        return (value - fieldMin) % segment.every === 0
      }
      if (segment.base.kind === 'value') {
        return value >= segment.base.value && (value - segment.base.value) % segment.every === 0
      }
      if (segment.base.kind === 'range') {
        return (
          value >= segment.base.start &&
          value <= segment.base.end &&
          (value - segment.base.start) % segment.every === 0
        )
      }
      return false
    }
    case 'last':
      return fieldType === 'dayOfWeek'
        ? value === 7
        : value === getLastDayOfMonth(date.getUTCFullYear(), date.getUTCMonth())
    case 'nearestWeekday':
      return value === getNearestWeekday(date.getUTCFullYear(), date.getUTCMonth(), segment.day)
    case 'lastWeekday':
      return isLastWeekdayOfMonth(date, segment.day)
    case 'nthDay':
      return isNthWeekdayOfMonth(date, segment.day, segment.nth)
  }
}

function matchesField(field: CronField, value: number, date: Date): boolean {
  return field.segments.some((s) => matchesSegment(s, value, field.type, date))
}

function matchesDayOfWeekField(field: CronField, date: Date, format: CronFormat): boolean {
  const jsDow = date.getUTCDay()
  const values = format === 'aws' ? [jsDow === 0 ? 1 : jsDow + 1] : jsDow === 0 ? [0, 7] : [jsDow]
  return values.some((value) => matchesField(field, value, date))
}

function matchesCron(result: CronExpressionResult, date: Date): boolean {
  const minute = result.fields.find((f) => f.type === 'minute')!
  const hour = result.fields.find((f) => f.type === 'hour')!
  const dayOfMonth = result.fields.find((f) => f.type === 'dayOfMonth')!
  const month = result.fields.find((f) => f.type === 'month')!
  const dayOfWeek = result.fields.find((f) => f.type === 'dayOfWeek')!
  const year = result.fields.find((f) => f.type === 'year')

  if (year && !matchesField(year, date.getUTCFullYear(), date)) return false
  if (!matchesField(month, date.getUTCMonth() + 1, date)) return false
  if (!matchesField(hour, date.getUTCHours(), date)) return false
  if (!matchesField(minute, date.getUTCMinutes(), date)) return false

  // Day matching
  const isWild = (f: CronField) =>
    f.segments.length === 1 && (f.segments[0]!.kind === 'any' || f.segments[0]!.kind === 'unspecified')
  const domIsWild = isWild(dayOfMonth)
  const dowIsWild = isWild(dayOfWeek)

  const domValue = date.getUTCDate()
  const domMatches = matchesField(dayOfMonth, domValue, date)
  const dowMatches = matchesDayOfWeekField(dayOfWeek, date, result.format)

  if (domIsWild && dowIsWild) return true
  if (domIsWild) return dowMatches
  if (dowIsWild) return domMatches
  // Both specified: Unix uses OR, AWS (shouldn't happen) uses AND
  return result.format === 'unix' ? domMatches || dowMatches : domMatches && dowMatches
}

/**
 * Extract the minimum matching year from a year field, or null if unbounded.
 * Used for year-skip optimization.
 */
function getYearBounds(yearField: CronField): { min: number; max: number } | null {
  if (yearField.segments.length === 1 && yearField.segments[0]!.kind === 'any') return null
  let min = Infinity
  let max = -Infinity
  for (const segment of yearField.segments) {
    switch (segment.kind) {
      case 'any':
      case 'unspecified':
        return null
      case 'value':
        min = Math.min(min, segment.value)
        max = Math.max(max, segment.value)
        break
      case 'range':
        min = Math.min(min, segment.start)
        max = Math.max(max, segment.end)
        break
      case 'step': {
        if (segment.base.kind === 'any') return null
        if (segment.base.kind === 'value') {
          min = Math.min(min, segment.base.value)
          max = 2199 // max year
        } else if (segment.base.kind === 'range') {
          min = Math.min(min, segment.base.start)
          max = Math.max(max, segment.base.end)
        }
        break
      }
      default:
        return null
    }
  }
  if (min === Infinity) return null
  return { min, max }
}

/**
 * Find the next year >= targetYear that matches the year field.
 * Returns null if no year matches.
 */
function findNextMatchingYear(yearField: CronField, targetYear: number, maxYear: number): number | null {
  for (let y = targetYear; y <= maxYear; y++) {
    const testDate = new Date(Date.UTC(y, 0, 1))
    if (matchesField(yearField, y, testDate)) return y
  }
  return null
}

/**
 * Find the previous year <= targetYear that matches the year field.
 * Returns null if no year matches.
 */
function findPrevMatchingYear(yearField: CronField, targetYear: number, minYear: number): number | null {
  for (let y = targetYear; y >= minYear; y--) {
    const testDate = new Date(Date.UTC(y, 0, 1))
    if (matchesField(yearField, y, testDate)) return y
  }
  return null
}

const MAX_ITERATIONS = 2629800 // ~5 years in minutes

export function getNextOccurrences(result: CronExpressionResult, count: number, after: Date): Date[] {
  if (result.shortcut === '@reboot') return []
  const results: Date[] = []
  const current = new Date(after.getTime())
  current.setUTCSeconds(0, 0)
  let time = current.getTime()

  // Year-skip optimization: if there's a year constraint, jump forward
  const yearField = result.fields.find((f) => f.type === 'year')
  if (yearField) {
    const bounds = getYearBounds(yearField)
    if (bounds) {
      const currentYear = new Date(time).getUTCFullYear()
      if (currentYear > bounds.max) return [] // all matching years are in the past
      if (currentYear < bounds.min) {
        // Jump to Jan 1 00:00 of the first matching year
        const nextYear = findNextMatchingYear(yearField, bounds.min, bounds.max)
        if (nextYear === null) return []
        time = Date.UTC(nextYear, 0, 1, 0, 0, 0)
      } else {
        // Current year might not match; find next matching year
        const nextYear = findNextMatchingYear(yearField, currentYear, bounds.max)
        if (nextYear === null) return []
        if (nextYear > currentYear) {
          time = Date.UTC(nextYear, 0, 1, 0, 0, 0)
        }
      }
    }
  }

  for (let i = 0; i < MAX_ITERATIONS && results.length < count; i++) {
    const d = new Date(time)
    if (matchesCron(result, d)) {
      results.push(d)
    } else if (yearField) {
      // If the current year doesn't match, skip to the next matching year
      const bounds = getYearBounds(yearField)
      if (bounds) {
        const y = d.getUTCFullYear()
        if (!matchesField(yearField, y, d)) {
          const nextYear = findNextMatchingYear(yearField, y + 1, bounds.max)
          if (nextYear === null) break
          time = Date.UTC(nextYear, 0, 1, 0, 0, 0)
          continue
        }
      }
    }
    time += 60000
  }
  return results
}

export function getPreviousOccurrences(result: CronExpressionResult, count: number, before: Date): Date[] {
  if (result.shortcut === '@reboot') return []
  const results: Date[] = []
  const current = new Date(before.getTime())
  current.setUTCSeconds(0, 0)
  let time = current.getTime()

  // Year-skip optimization: if there's a year constraint, jump backward
  const yearField = result.fields.find((f) => f.type === 'year')
  if (yearField) {
    const bounds = getYearBounds(yearField)
    if (bounds) {
      const currentYear = new Date(time).getUTCFullYear()
      if (currentYear < bounds.min) return [] // all matching years are in the future
      if (currentYear > bounds.max) {
        // Jump to Dec 31 23:59 of the last matching year
        const prevYear = findPrevMatchingYear(yearField, bounds.max, bounds.min)
        if (prevYear === null) return []
        time = Date.UTC(prevYear, 11, 31, 23, 59, 0)
      } else {
        const prevYear = findPrevMatchingYear(yearField, currentYear, bounds.min)
        if (prevYear === null) return []
        if (prevYear < currentYear) {
          time = Date.UTC(prevYear, 11, 31, 23, 59, 0)
        }
      }
    }
  }

  for (let i = 0; i < MAX_ITERATIONS && results.length < count; i++) {
    const d = new Date(time)
    if (matchesCron(result, d)) {
      results.push(d)
    } else if (yearField) {
      // If the current year doesn't match, skip to the previous matching year
      const bounds = getYearBounds(yearField)
      if (bounds) {
        const y = d.getUTCFullYear()
        if (!matchesField(yearField, y, d)) {
          const prevYear = findPrevMatchingYear(yearField, y - 1, bounds.min)
          if (prevYear === null) break
          time = Date.UTC(prevYear, 11, 31, 23, 59, 0)
          continue
        }
      }
    }
    time -= 60000
  }
  return results
}

export const cronExamples = [
  '*/15 * * * *',
  '0 * * * *',
  '0 9 * * 1-5',
  '30 6 1 * *',
  '0 0 1 1 *',
  '@daily',
  '@reboot',
] as const

export const awsCronExamples = [
  '0 10 * * ? *',
  '0/15 * ? * MON-FRI *',
  '0 8 1 * ? *',
  '0 10 L * ? *',
  '0 10 ? * 6#3 *',
  '0 10 15W * ? *',
  '0 0 ? * 3L *',
] as const
