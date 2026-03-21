import { err, ok } from '../lib/result'
import type { Result } from '../lib/result'

export type CronFieldType = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'

export type CronSegment =
  | { kind: 'any' }
  | { kind: 'value'; value: number }
  | { kind: 'range'; start: number; end: number }
  | {
      kind: 'step'
      every: number
      base: { kind: 'any' } | { kind: 'value'; value: number } | { kind: 'range'; start: number; end: number }
    }

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
}

interface FieldConfig {
  type: CronFieldType
  min: number
  max: number
  aliases?: Record<string, number>
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
      })
    }

    const parsed = parseExpandedExpression(expansion)
    if (!parsed.ok) {
      return parsed
    }

    return ok({
      input: trimmed,
      normalizedExpression: expansion,
      shortcut: lowered,
      fields: parsed.value.fields,
    })
  }

  return parseExpandedExpression(trimmed)
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
  if (part === '*') {
    return ok({ segment: { kind: 'any' }, normalized: '*' })
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

export const cronExamples = [
  '*/15 * * * *',
  '0 * * * *',
  '0 9 * * 1-5',
  '30 6 1 * *',
  '0 0 1 1 *',
  '@daily',
  '@reboot',
] as const
