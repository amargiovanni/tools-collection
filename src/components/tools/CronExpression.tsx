import { For, Show, createMemo, createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { StatusMessage } from '../ui/StatusMessage'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'
import { cronExamples, awsCronExamples, parseCronExpression, convertCron, getNextOccurrences, getPreviousOccurrences, isAnyField } from '../../tools/cron-expression'
import type { CronExpressionResult, CronField, CronFieldType, CronSegment, CronFormat } from '../../tools/cron-expression'
import { phraseSets, unitLabels, fieldNameKeys, capitalize } from './cron/CronPhrases'
import type { BuilderMode, PhraseSet, UnitLabel } from './cron/CronPhrases'

interface Props {
  lang: Language
}

export default function CronExpression(props: Props) {
  const initialExpression = '*/15 * * * *'
  const initialParsed = parseCronExpression(initialExpression)
  const initialResult = initialParsed.ok ? initialParsed.value : null
  const initialError = initialParsed.ok ? null : translateError(props.lang, initialParsed.error)

  const [input, setInput] = createSignal(initialExpression)
  const [result, setResult] = createSignal<CronExpressionResult | null>(initialResult)
  const [error, setError] = createSignal<string | null>(initialError)
  const [builderMode, setBuilderMode] = createSignal<BuilderMode>('everyMinutes')
  const [builderMinute, setBuilderMinute] = createSignal('0')
  const [builderHour, setBuilderHour] = createSignal('9')
  const [builderStep, setBuilderStep] = createSignal('15')
  const [builderDayOfWeek, setBuilderDayOfWeek] = createSignal('1')
  const [builderDayOfMonth, setBuilderDayOfMonth] = createSignal('1')
  const [builderFormat, setBuilderFormat] = createSignal<CronFormat>('unix')
  const [builderNthWeek, setBuilderNthWeek] = createSignal('1')
  const [builderAwsDayOfWeek, setBuilderAwsDayOfWeek] = createSignal('2')

  const [scheduleRefTime, setScheduleRefTime] = createSignal<string>(formatDateTimeLocal(new Date()))
  const [scheduleCount, setScheduleCount] = createSignal('5')

  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      if (typeof saved['builderMode'] === 'string') setBuilderMode(saved['builderMode'] as BuilderMode)
      if (typeof saved['builderMinute'] === 'string') setBuilderMinute(saved['builderMinute'])
      if (typeof saved['builderHour'] === 'string') setBuilderHour(saved['builderHour'])
      if (typeof saved['builderStep'] === 'string') setBuilderStep(saved['builderStep'])
      if (typeof saved['builderDayOfWeek'] === 'string') setBuilderDayOfWeek(saved['builderDayOfWeek'])
      if (typeof saved['builderDayOfMonth'] === 'string') setBuilderDayOfMonth(saved['builderDayOfMonth'])
      if (typeof saved['builderFormat'] === 'string') setBuilderFormat(saved['builderFormat'] as CronFormat)
      if (typeof saved['builderNthWeek'] === 'string') setBuilderNthWeek(saved['builderNthWeek'])
      if (typeof saved['builderAwsDayOfWeek'] === 'string') setBuilderAwsDayOfWeek(saved['builderAwsDayOfWeek'])
    },
    getState: () => ({ input: input(), builderMode: builderMode(), builderMinute: builderMinute(), builderHour: builderHour(), builderStep: builderStep(), builderDayOfWeek: builderDayOfWeek(), builderDayOfMonth: builderDayOfMonth(), builderFormat: builderFormat(), builderNthWeek: builderNthWeek(), builderAwsDayOfWeek: builderAwsDayOfWeek() }),
  })

  const explainExpression = (expression: string) => {
    const parsed = parseCronExpression(expression)
    if (parsed.ok) {
      setInput(expression)
      setResult(parsed.value)
      setError(null)

      // Auto-detect format and sync builder toggle
      setBuilderFormat(parsed.value.format)
      return
    }

    setResult(null)
    setError(translateError(props.lang, parsed.error))
  }

  const handleInput = (value: string) => {
    setInput(value)
    if (!value.trim()) {
      setResult(null)
      setError(null)

      return
    }
    const parsed = parseCronExpression(value)
    if (parsed.ok) {
      setResult(parsed.value)
      setError(null)

      setBuilderFormat(parsed.value.format)
    } else {
      setResult(null)
      setError(translateError(props.lang, parsed.error))

    }
  }

  const buildBuilderExpression = (overrides?: Partial<{
    mode: BuilderMode
    minute: string
    hour: string
    step: string
    dayOfWeek: string
    dayOfMonth: string
    format: CronFormat
    nthWeek: string
    awsDayOfWeek: string
  }>) => {
    const mode = overrides?.mode ?? builderMode()
    const minute = overrides?.minute ?? builderMinute()
    const hour = overrides?.hour ?? builderHour()
    const step = overrides?.step ?? builderStep()
    const dayOfWeek = overrides?.dayOfWeek ?? builderDayOfWeek()
    const dayOfMonth = overrides?.dayOfMonth ?? builderDayOfMonth()
    const format = overrides?.format ?? builderFormat()
    const nthWeek = overrides?.nthWeek ?? builderNthWeek()
    const awsDow = overrides?.awsDayOfWeek ?? builderAwsDayOfWeek()

    if (format === 'aws') {
      if (mode === 'everyMinutes') return `*/${step} * * * ? *`
      if (mode === 'hourly') return `${minute} * * * ? *`
      if (mode === 'daily') return `${minute} ${hour} * * ? *`
      if (mode === 'weekly') return `${minute} ${hour} ? * ${awsDow} *`
      if (mode === 'monthly') return `${minute} ${hour} ${dayOfMonth} * ? *`
      if (mode === 'lastDay') return `${minute} ${hour} L * ? *`
      if (mode === 'nthWeekday') return `${minute} ${hour} ? * ${awsDow}#${nthWeek} *`
    }

    if (mode === 'everyMinutes') return `*/${step} * * * *`
    if (mode === 'hourly') return `${minute} * * * *`
    if (mode === 'daily') return `${minute} ${hour} * * *`
    if (mode === 'weekly') return `${minute} ${hour} * * ${dayOfWeek}`
    return `${minute} ${hour} ${dayOfMonth} * *`
  }

  const applyExample = (expression: string) => {
    explainExpression(expression)
  }

  const applyBuilder = (overrides?: Partial<{
    mode: BuilderMode
    minute: string
    hour: string
    step: string
    dayOfWeek: string
    dayOfMonth: string
    format: CronFormat
    nthWeek: string
    awsDayOfWeek: string
  }>) => {
    explainExpression(buildBuilderExpression(overrides))
  }

  const conversionCheck = () => {
    const current = result()
    if (!current) return null
    const targetFormat: CronFormat = current.format === 'unix' ? 'aws' : 'unix'
    return convertCron(current, targetFormat)
  }

  const handleConvert = () => {
    const check = conversionCheck()
    if (check?.ok) {
      explainExpression(check.value.normalizedExpression)
    }
  }

  const minuteOptions = () => createNumberOptions(0, 59)
  const hourOptions = () => createNumberOptions(0, 23)
  const stepOptions = () => ['5', '10', '15', '20', '30'].map((value) => ({ value, label: value }))
  const dayOfMonthOptions = () => createNumberOptions(1, 31)
  const dayOfWeekOptions = () => createWeekdayOptions(props.lang)
  function formatDateTimeLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  }

  function formatTimeDiff(ms: number): string {
    const abs = Math.abs(ms)
    const minutes = Math.floor(abs / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const remHours = hours % 24
    const remMinutes = minutes % 60
    const parts: string[] = []
    if (days > 0) parts.push(`${days}d`)
    if (remHours > 0) parts.push(`${remHours}h`)
    if (remMinutes > 0 || parts.length === 0) parts.push(`${remMinutes}m`)
    return parts.join(' ')
  }

  const scheduleNext = createMemo(() => {
    const r = result()
    if (!r) return []
    const refDate = new Date(scheduleRefTime() + ':00Z')
    if (isNaN(refDate.getTime())) return []
    return getNextOccurrences(r, Number(scheduleCount()), refDate)
  })

  const schedulePrev = createMemo(() => {
    const r = result()
    if (!r) return []
    const refDate = new Date(scheduleRefTime() + ':00Z')
    if (isNaN(refDate.getTime())) return []
    return getPreviousOccurrences(r, Number(scheduleCount()), refDate)
  })

  return (
    <div class="flex flex-col gap-5">
      <section class="rounded-xl border border-border bg-surface-raised p-4">
        <div class="mb-3 flex items-center gap-3">
          <p class="text-sm font-medium text-text-secondary">{phraseSets[props.lang].builder}</p>
          <div class="flex gap-1">
            <Button
              variant={builderFormat() === 'unix' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setBuilderFormat('unix')
                const mode = builderMode()
                if (mode === 'lastDay' || mode === 'nthWeekday') {
                  setBuilderMode('everyMinutes')
                  applyBuilder({ format: 'unix', mode: 'everyMinutes' })
                } else {
                  applyBuilder({ format: 'unix' })
                }
              }}
            >
              Unix
            </Button>
            <Button
              variant={builderFormat() === 'aws' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setBuilderFormat('aws')
                applyBuilder({ format: 'aws' })
              }}
            >
              AWS
            </Button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <For each={(Object.keys(phraseSets[props.lang].builderModes) as BuilderMode[]).filter(
            (mode) => builderFormat() === 'aws' || (mode !== 'lastDay' && mode !== 'nthWeekday')
          )}>
            {(mode) => (
              <Button
                variant={builderMode() === mode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setBuilderMode(mode)
                  applyBuilder({ mode })
                }}
              >
                {phraseSets[props.lang].builderModes[mode]}
              </Button>
            )}
          </For>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Show when={builderMode() === 'everyMinutes'}>
            <Select
              label={phraseSets[props.lang].builderStep}
              options={stepOptions()}
              value={builderStep()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderStep(value)
                applyBuilder({ step: value })
              }}
            />
          </Show>

          <Show when={builderMode() !== 'everyMinutes'}>
            <Select
              label={phraseSets[props.lang].builderMinute}
              options={minuteOptions()}
              value={builderMinute()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderMinute(value)
                applyBuilder({ minute: value })
              }}
            />
          </Show>

          <Show when={builderMode() === 'daily' || builderMode() === 'weekly' || builderMode() === 'monthly' || builderMode() === 'lastDay' || builderMode() === 'nthWeekday'}>
            <Select
              label={phraseSets[props.lang].builderHour}
              options={hourOptions()}
              value={builderHour()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderHour(value)
                applyBuilder({ hour: value })
              }}
            />
          </Show>

          <Show when={builderMode() === 'weekly' && builderFormat() === 'unix'}>
            <Select
              label={phraseSets[props.lang].builderDayOfWeek}
              options={dayOfWeekOptions()}
              value={builderDayOfWeek()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderDayOfWeek(value)
                applyBuilder({ dayOfWeek: value })
              }}
            />
          </Show>

          <Show when={builderMode() === 'weekly' && builderFormat() === 'aws'}>
            <Select
              label={phraseSets[props.lang].builderDayOfWeek}
              options={createAwsWeekdayOptions(props.lang)}
              value={builderAwsDayOfWeek()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderAwsDayOfWeek(value)
                applyBuilder({ awsDayOfWeek: value })
              }}
            />
          </Show>

          <Show when={builderMode() === 'monthly'}>
            <Select
              label={phraseSets[props.lang].builderDayOfMonth}
              options={dayOfMonthOptions()}
              value={builderDayOfMonth()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderDayOfMonth(value)
                applyBuilder({ dayOfMonth: value })
              }}
            />
          </Show>

          <Show when={builderMode() === 'nthWeekday'}>
            <Select
              label={phraseSets[props.lang].builderDayOfWeek}
              options={createAwsWeekdayOptions(props.lang)}
              value={builderAwsDayOfWeek()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderAwsDayOfWeek(value)
                applyBuilder({ awsDayOfWeek: value })
              }}
            />
            <Select
              label="#"
              options={Array.from({ length: 5 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
              value={builderNthWeek()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderNthWeek(value)
                applyBuilder({ nthWeek: value })
              }}
            />
          </Show>
        </div>

        <div class="mt-4">
          <Input
            label={t(props.lang, 'tools_cronExpression_inputLabel')}
            placeholder={t(props.lang, 'tools_cronExpression_placeholder')}
            value={input()}
            onInput={(event) => handleInput(event.currentTarget.value)}
          />
        </div>

        <Show when={error()}>
          <div class="mt-3">
            <StatusMessage type="error" message={error()!} />
          </div>
        </Show>

        <Show when={result()}>
          {(parsed) => (
            <div class="mt-4 rounded-lg border border-border bg-surface p-3" data-testid="cron-summary">
              <div class="flex flex-wrap items-center gap-2">
                <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  parsed().format === 'aws'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                }`} data-testid="format-badge">
                  {parsed().format === 'aws' ? phraseSets[props.lang].aws : phraseSets[props.lang].unix}
                </span>
                <p class="text-lg font-semibold text-text-primary">{formatSummary(parsed(), props.lang)}</p>
                <Show when={conversionCheck()?.ok} fallback={
                  <span class="text-xs text-text-muted italic">{conversionCheck()?.ok === false ? conversionCheck()!.error.message : ''}</span>
                }>
                  <Button variant="secondary" size="sm" onClick={handleConvert}>
                    {phraseSets[props.lang].convertTo(parsed().format === 'aws' ? 'Unix' : 'AWS')}
                  </Button>
                </Show>
              </div>
            </div>
          )}
        </Show>
      </section>

      <div class="rounded-xl border border-border bg-surface-raised p-4">
        <p class="mb-3 text-sm font-medium text-text-secondary">{phraseSets[props.lang].examples}</p>
        <div class="flex flex-wrap gap-2">
          <Show when={builderFormat() === 'aws'} fallback={
            <For each={cronExamples}>
              {(example) => (
                <Button variant="secondary" size="sm" onClick={() => applyExample(example)}>
                  <span class="font-mono">{example}</span>
                  <span class="text-text-muted">{phraseSets[props.lang].exampleLabels[example]}</span>
                </Button>
              )}
            </For>
          }>
            <For each={awsCronExamples}>
              {(example) => (
                <Button variant="secondary" size="sm" onClick={() => applyExample(example)}>
                  <span class="font-mono">{example}</span>
                  <span class="text-text-muted">{phraseSets[props.lang].awsExampleLabels[example]}</span>
                </Button>
              )}
            </For>
          </Show>
        </div>
      </div>

      <Show when={result()}>
        {(parsed) => (
          <div class="flex flex-col gap-4">

            <Show when={parsed().fields.length > 0}>
              <section>
                <p class="mb-3 text-sm font-medium text-text-secondary">{phraseSets[props.lang].fields}</p>
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <For each={parsed().fields}>
                    {(field) => (
                      <div class="rounded-lg border border-border bg-surface-raised p-3">
                        <div class="flex items-center justify-between gap-3">
                          <p class="text-sm font-medium text-text-primary">{t(props.lang, fieldNameKeys[field.type])}</p>
                          <code class="rounded bg-surface px-2 py-1 text-xs text-text-secondary">{field.expression}</code>
                        </div>
                        <p class="mt-2 text-sm text-text-secondary">{describeField(field, props.lang, parsed().format)}</p>
                      </div>
                    )}
                  </For>
                </div>
              </section>
            </Show>

            <section class="rounded-xl border border-border bg-surface-raised p-4" data-testid="schedule-preview">
              <p class="mb-3 text-sm font-medium text-text-secondary">{phraseSets[props.lang].schedulePreview}</p>
              <div class="flex flex-wrap items-end gap-3 mb-4">
                <div class="flex flex-col gap-1">
                  <label class="text-xs text-text-muted">{phraseSets[props.lang].referenceTime} (UTC)</label>
                  <input
                    type="datetime-local"
                    class="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                    value={scheduleRefTime()}
                    onInput={(e) => setScheduleRefTime(e.currentTarget.value)}
                  />
                </div>
                <Select
                  label={phraseSets[props.lang].occurrenceCount}
                  options={[
                    { value: '5', label: '5' },
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                  ]}
                  value={scheduleCount()}
                  onChange={(e) => setScheduleCount(e.currentTarget.value)}
                />
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <p class="mb-2 text-xs font-medium text-text-muted">{phraseSets[props.lang].previous}</p>
                  <Show when={schedulePrev().length > 0} fallback={
                    <p class="text-xs text-text-muted italic">{phraseSets[props.lang].noOccurrences}</p>
                  }>
                    <ul class="flex flex-col gap-1">
                      <For each={schedulePrev()}>
                        {(date) => {
                          const refDate = new Date(scheduleRefTime() + ':00Z')
                          const diff = refDate.getTime() - date.getTime()
                          return (
                            <li class="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
                              <span class="font-mono text-text-primary">
                                {date.toISOString().replace('T', ' ').slice(0, 16)} UTC
                              </span>
                              <span class="text-text-muted">
                                {phraseSets[props.lang].timeAgo(formatTimeDiff(diff))}
                              </span>
                            </li>
                          )
                        }}
                      </For>
                    </ul>
                  </Show>
                </div>

                <div>
                  <p class="mb-2 text-xs font-medium text-text-muted">{phraseSets[props.lang].upcoming}</p>
                  <Show when={scheduleNext().length > 0} fallback={
                    <p class="text-xs text-text-muted italic">{phraseSets[props.lang].noOccurrences}</p>
                  }>
                    <ul class="flex flex-col gap-1">
                      <For each={scheduleNext()}>
                        {(date) => {
                          const refDate = new Date(scheduleRefTime() + ':00Z')
                          const diff = date.getTime() - refDate.getTime()
                          return (
                            <li class="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
                              <span class="font-mono text-text-primary">
                                {date.toISOString().replace('T', ' ').slice(0, 16)} UTC
                              </span>
                              <span class="text-text-muted">
                                {phraseSets[props.lang].timeFromNow(formatTimeDiff(diff))}
                              </span>
                            </li>
                          )
                        }}
                      </For>
                    </ul>
                  </Show>
                </div>
              </div>
            </section>
          </div>
        )}
      </Show>
    </div>
  )
}

function isAnyOrUnspecified(f: CronField): boolean {
  return isAnyField(f) || (f.segments.length === 1 && f.segments[0]!.kind === 'unspecified')
}

function formatSummary(result: CronExpressionResult, lang: Language): string {
  const phrases = phraseSets[lang]
  if (result.shortcut === '@reboot') {
    return phrases.atEveryReboot
  }

  const minute = result.fields.find((field) => field.type === 'minute')
  const hour = result.fields.find((field) => field.type === 'hour')
  const dayOfMonth = result.fields.find((field) => field.type === 'dayOfMonth')
  const month = result.fields.find((field) => field.type === 'month')
  const dayOfWeek = result.fields.find((field) => field.type === 'dayOfWeek')

  if (!minute || !hour || !dayOfMonth || !month || !dayOfWeek) {
    return result.normalizedExpression
  }

  if (isAnyField(minute) && isAnyField(hour) && isAnyOrUnspecified(dayOfMonth) && isAnyField(month) && isAnyOrUnspecified(dayOfWeek)) {
    return phrases.everyMinute
  }

  const minuteValue = getSingleValue(minute)
  const hourValue = getSingleValue(hour)
  const minuteEvery = getEveryStep(minute)

  if (minuteEvery !== null && isAnyField(hour) && isAnyOrUnspecified(dayOfMonth) && isAnyField(month) && isAnyOrUnspecified(dayOfWeek)) {
    return phrases.everyStep(minuteEvery, unitLabels[lang].minute.plural)
  }

  if (minuteValue !== null && hourValue !== null && isAnyOrUnspecified(dayOfMonth) && isAnyField(month) && isAnyOrUnspecified(dayOfWeek)) {
    return phrases.atTime(hourValue, minuteValue)
  }

  if (minuteValue !== null && isAnyField(hour) && isAnyOrUnspecified(dayOfMonth) && isAnyField(month) && isAnyOrUnspecified(dayOfWeek)) {
    return phrases.atMinutePastEveryHour(minuteValue)
  }

  const meaningfulFields = result.fields.filter((f) => {
    if (f.segments.length === 1 && f.segments[0]!.kind === 'unspecified') return false
    if (f.type === 'year' && isAnyField(f)) return false
    return true
  })

  return phrases.join(meaningfulFields.map((field) => describeField(field, lang, result.format)))
}

function describeField(field: CronField, lang: Language, format: CronFormat = 'unix'): string {
  const phrases = phraseSets[lang]
  if (field.segments.length === 1) {
    return describeSegment(field.type, field.segments[0]!, lang, format)
  }

  return phrases.join(field.segments.map((segment) => describeSegment(field.type, segment, lang, format)))
}

function formatAwsDow(value: number, lang: Language): string {
  const dateIndex = value - 1
  return new Intl.DateTimeFormat(phraseSets[lang].locale, { weekday: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(2024, 0, 7 + dateIndex)))
}

function formatOrdinal(n: number, lang: Language): string {
  if (phraseSets[lang].locale.startsWith('en')) {
    const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' }
    return `${n}${(n >= 11 && n <= 13) ? 'th' : (suffixes[n % 10] ?? 'th')}`
  }
  return `${n}`
}

function describeSegment(fieldType: CronFieldType, segment: CronSegment, lang: Language, format: CronFormat = 'unix'): string {
  const phrases = phraseSets[lang]
  const labels = unitLabels[lang][fieldType]

  switch (segment.kind) {
    case 'any':
      return phrases.fieldAny(labels)
    case 'value':
      return phrases.fieldValue(labels, formatFieldValue(fieldType, segment.value, lang, format))
    case 'range':
      return phrases.fieldRange(
        labels,
        formatFieldValue(fieldType, segment.start, lang, format),
        formatFieldValue(fieldType, segment.end, lang, format),
      )
    case 'step':
      if (segment.base.kind === 'any') {
        return phrases.everyStep(segment.every, labels.plural)
      }
      if (segment.base.kind === 'value') {
        return phrases.fieldStepStart(
          segment.every,
          labels.plural,
          formatFieldValue(fieldType, segment.base.value, lang, format),
        )
      }
      return phrases.fieldStepRange(
        segment.every,
        labels.plural,
        formatFieldValue(fieldType, segment.base.start, lang, format),
        formatFieldValue(fieldType, segment.base.end, lang, format),
      )
    case 'unspecified':
      return phrases.fieldUnspecified
    case 'last':
      return phrases.fieldLast
    case 'lastWeekday':
      return phrases.fieldLastWeekday(formatAwsDow(segment.day, lang))
    case 'nearestWeekday':
      return phrases.fieldNearestWeekday(formatOrdinal(segment.day, lang))
    case 'nthDay':
      return phrases.fieldNthDay(formatAwsDow(segment.day, lang), formatOrdinal(segment.nth, lang))
  }
}

function formatFieldValue(fieldType: CronFieldType, value: number, lang: Language, format: CronFormat = 'unix'): string {
  if (fieldType === 'year') return String(value)

  if (fieldType === 'month') {
    return new Intl.DateTimeFormat(phraseSets[lang].locale, { month: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2024, value - 1, 1)))
  }

  if (fieldType === 'dayOfWeek') {
    // AWS DOW: 1=SUN..7=SAT, Unix DOW: 0-7 where 0,7=SUN
    if (format === 'aws') {
      return formatAwsDow(value, lang)
    }
    const normalized = value === 7 ? 0 : value
    return new Intl.DateTimeFormat(phraseSets[lang].locale, { weekday: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2024, 0, 7 + normalized)))
  }

  return String(value)
}

function getSingleValue(field: CronField): number | null {
  if (field.segments.length !== 1) return null
  const segment = field.segments[0]!
  return segment.kind === 'value' ? segment.value : null
}

function getEveryStep(field: CronField): number | null {
  if (field.segments.length !== 1) return null
  const segment = field.segments[0]!
  return segment.kind === 'step' && segment.base.kind === 'any' ? segment.every : null
}

function createNumberOptions(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const value = String(start + index)
    return {
      value,
      label: value.padStart(2, '0'),
    }
  })
}

function createWeekdayOptions(lang: Language) {
  return Array.from({ length: 7 }, (_, index) => ({
    value: String(index),
    label: new Intl.DateTimeFormat(phraseSets[lang].locale, { weekday: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2024, 0, 7 + index))),
  }))
}

function createAwsWeekdayOptions(lang: Language) {
  return Array.from({ length: 7 }, (_, i) => ({
    value: String(i + 1),
    label: new Intl.DateTimeFormat(phraseSets[lang].locale, { weekday: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2024, 0, 7 + i))),
  }))
}
