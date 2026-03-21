import { For, Show, createSignal } from 'solid-js'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { StatusMessage } from '../ui/StatusMessage'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'
import { cronExamples, parseCronExpression } from '../../tools/cron-expression'
import type { CronExpressionResult, CronField, CronFieldType, CronSegment } from '../../tools/cron-expression'

interface Props {
  lang: Language
}

type BuilderMode = 'everyMinutes' | 'hourly' | 'daily' | 'weekly' | 'monthly'

type UnitLabel = { singular: string; plural: string; valuePrefix: string; everyLabel: string }

type PhraseSet = {
  locale: string
  parse: string
  builder: string
  builderPreview: string
  builderMinute: string
  builderHour: string
  builderStep: string
  builderDayOfWeek: string
  builderDayOfMonth: string
  builderModes: Record<BuilderMode, string>
  examples: string
  explanation: string
  normalized: string
  shortcut: string
  fields: string
  everyMinute: string
  atEveryReboot: string
  atTime: (hour: number, minute: number) => string
  atMinutePastEveryHour: (minute: number) => string
  everyStep: (count: number, unit: string) => string
  fieldAny: (unit: UnitLabel) => string
  fieldValue: (unit: UnitLabel, value: string) => string
  fieldRange: (unit: UnitLabel, start: string, end: string) => string
  fieldStepRange: (count: number, unit: string, start: string, end: string) => string
  fieldStepStart: (count: number, unit: string, start: string) => string
  join: (parts: string[]) => string
  exampleLabels: Record<(typeof cronExamples)[number], string>
}

const phraseSets: Record<Language, PhraseSet> = {
  en: {
    locale: 'en-US',
    parse: 'Explain cron',
    builder: 'Build cron',
    builderPreview: 'Generated expression',
    builderMinute: 'Minute',
    builderHour: 'Hour',
    builderStep: 'Every',
    builderDayOfWeek: 'Day of week',
    builderDayOfMonth: 'Day of month',
    builderModes: {
      everyMinutes: 'Every N minutes',
      hourly: 'Hourly',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
    },
    examples: 'Examples',
    explanation: 'Explanation',
    normalized: 'Normalized expression',
    shortcut: 'Shortcut',
    fields: 'Field breakdown',
    everyMinute: 'Every minute',
    atEveryReboot: 'At every reboot',
    atTime: (hour, minute) => `At ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    atMinutePastEveryHour: (minute) => `At minute ${minute} past every hour`,
    everyStep: (count, unit) => `Every ${count} ${unit}`,
    fieldAny: (unit) => unit.everyLabel,
    fieldValue: (unit, value) => `${unit.valuePrefix} ${value}`,
    fieldRange: (unit, start, end) => `${capitalize(unit.plural)} ${start} through ${end}`,
    fieldStepRange: (count, unit, start, end) => `Every ${count} ${unit} from ${start} through ${end}`,
    fieldStepStart: (count, unit, start) => `Every ${count} ${unit} starting at ${start}`,
    join: (parts) => parts.join(', '),
    exampleLabels: {
      '*/15 * * * *': 'Every 15 minutes',
      '0 * * * *': 'Top of every hour',
      '0 9 * * 1-5': 'Weekdays at 09:00',
      '30 6 1 * *': 'Monthly on day 1 at 06:30',
      '0 0 1 1 *': 'Yearly on January 1',
      '@daily': 'Daily at midnight',
      '@reboot': 'At reboot',
    },
  },
  it: {
    locale: 'it-IT',
    parse: 'Spiega cron',
    builder: 'Costruisci cron',
    builderPreview: 'Espressione generata',
    builderMinute: 'Minuto',
    builderHour: 'Ora',
    builderStep: 'Ogni',
    builderDayOfWeek: 'Giorno settimana',
    builderDayOfMonth: 'Giorno del mese',
    builderModes: {
      everyMinutes: 'Ogni N minuti',
      hourly: 'Orario',
      daily: 'Giornaliero',
      weekly: 'Settimanale',
      monthly: 'Mensile',
    },
    examples: 'Esempi',
    explanation: 'Spiegazione',
    normalized: 'Espressione normalizzata',
    shortcut: 'Shortcut',
    fields: 'Dettaglio campi',
    everyMinute: 'Ogni minuto',
    atEveryReboot: 'A ogni riavvio',
    atTime: (hour, minute) => `Alle ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    atMinutePastEveryHour: (minute) => `Al minuto ${minute} di ogni ora`,
    everyStep: (count, unit) => `Ogni ${count} ${unit}`,
    fieldAny: (unit) => unit.everyLabel,
    fieldValue: (unit, value) => `${unit.valuePrefix} ${value}`,
    fieldRange: (unit, start, end) => `${capitalize(unit.plural)} da ${start} a ${end}`,
    fieldStepRange: (count, unit, start, end) => `Ogni ${count} ${unit} da ${start} a ${end}`,
    fieldStepStart: (count, unit, start) => `Ogni ${count} ${unit} a partire da ${start}`,
    join: (parts) => parts.join(', '),
    exampleLabels: {
      '*/15 * * * *': 'Ogni 15 minuti',
      '0 * * * *': 'Allo scoccare di ogni ora',
      '0 9 * * 1-5': 'Feriali alle 09:00',
      '30 6 1 * *': 'Mensile il giorno 1 alle 06:30',
      '0 0 1 1 *': 'Annuale il 1 gennaio',
      '@daily': 'Ogni giorno a mezzanotte',
      '@reboot': 'Al riavvio',
    },
  },
  es: {
    locale: 'es-ES',
    parse: 'Explicar cron',
    builder: 'Construir cron',
    builderPreview: 'Expresion generada',
    builderMinute: 'Minuto',
    builderHour: 'Hora',
    builderStep: 'Cada',
    builderDayOfWeek: 'Dia de la semana',
    builderDayOfMonth: 'Dia del mes',
    builderModes: {
      everyMinutes: 'Cada N minutos',
      hourly: 'Cada hora',
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
    },
    examples: 'Ejemplos',
    explanation: 'Explicacion',
    normalized: 'Expresion normalizada',
    shortcut: 'Atajo',
    fields: 'Detalle de campos',
    everyMinute: 'Cada minuto',
    atEveryReboot: 'En cada reinicio',
    atTime: (hour, minute) => `A las ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    atMinutePastEveryHour: (minute) => `En el minuto ${minute} de cada hora`,
    everyStep: (count, unit) => `Cada ${count} ${unit}`,
    fieldAny: (unit) => unit.everyLabel,
    fieldValue: (unit, value) => `${unit.valuePrefix} ${value}`,
    fieldRange: (unit, start, end) => `${capitalize(unit.plural)} de ${start} a ${end}`,
    fieldStepRange: (count, unit, start, end) => `Cada ${count} ${unit} de ${start} a ${end}`,
    fieldStepStart: (count, unit, start) => `Cada ${count} ${unit} desde ${start}`,
    join: (parts) => parts.join(', '),
    exampleLabels: {
      '*/15 * * * *': 'Cada 15 minutos',
      '0 * * * *': 'Al inicio de cada hora',
      '0 9 * * 1-5': 'Entre semana a las 09:00',
      '30 6 1 * *': 'Mensual el dia 1 a las 06:30',
      '0 0 1 1 *': 'Anual el 1 de enero',
      '@daily': 'Diario a medianoche',
      '@reboot': 'Al reiniciar',
    },
  },
  fr: {
    locale: 'fr-FR',
    parse: 'Expliquer cron',
    builder: 'Construire cron',
    builderPreview: 'Expression generee',
    builderMinute: 'Minute',
    builderHour: 'Heure',
    builderStep: 'Toutes les',
    builderDayOfWeek: 'Jour de semaine',
    builderDayOfMonth: 'Jour du mois',
    builderModes: {
      everyMinutes: 'Toutes les N minutes',
      hourly: 'Horaire',
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
    },
    examples: 'Exemples',
    explanation: 'Explication',
    normalized: 'Expression normalisee',
    shortcut: 'Raccourci',
    fields: 'Detail des champs',
    everyMinute: 'Chaque minute',
    atEveryReboot: 'A chaque redemarrage',
    atTime: (hour, minute) => `A ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    atMinutePastEveryHour: (minute) => `A la minute ${minute} de chaque heure`,
    everyStep: (count, unit) => `Toutes les ${count} ${unit}`,
    fieldAny: (unit) => unit.everyLabel,
    fieldValue: (unit, value) => `${unit.valuePrefix} ${value}`,
    fieldRange: (unit, start, end) => `${capitalize(unit.plural)} de ${start} a ${end}`,
    fieldStepRange: (count, unit, start, end) => `Toutes les ${count} ${unit} de ${start} a ${end}`,
    fieldStepStart: (count, unit, start) => `Toutes les ${count} ${unit} a partir de ${start}`,
    join: (parts) => parts.join(', '),
    exampleLabels: {
      '*/15 * * * *': 'Toutes les 15 minutes',
      '0 * * * *': 'Au debut de chaque heure',
      '0 9 * * 1-5': 'En semaine a 09:00',
      '30 6 1 * *': 'Mensuel le jour 1 a 06:30',
      '0 0 1 1 *': 'Annuel le 1 janvier',
      '@daily': 'Chaque jour a minuit',
      '@reboot': 'Au redemarrage',
    },
  },
  de: {
    locale: 'de-DE',
    parse: 'Cron erklaren',
    builder: 'Cron bauen',
    builderPreview: 'Erzeugter Ausdruck',
    builderMinute: 'Minute',
    builderHour: 'Stunde',
    builderStep: 'Alle',
    builderDayOfWeek: 'Wochentag',
    builderDayOfMonth: 'Tag des Monats',
    builderModes: {
      everyMinutes: 'Alle N Minuten',
      hourly: 'Stundlich',
      daily: 'Taglich',
      weekly: 'Wochentlich',
      monthly: 'Monatlich',
    },
    examples: 'Beispiele',
    explanation: 'Erklarung',
    normalized: 'Normalisierter Ausdruck',
    shortcut: 'Kurzform',
    fields: 'Feldaufschlusselung',
    everyMinute: 'Jede Minute',
    atEveryReboot: 'Bei jedem Neustart',
    atTime: (hour, minute) => `Um ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    atMinutePastEveryHour: (minute) => `In Minute ${minute} jeder Stunde`,
    everyStep: (count, unit) => `Alle ${count} ${unit}`,
    fieldAny: (unit) => unit.everyLabel,
    fieldValue: (unit, value) => `${unit.valuePrefix} ${value}`,
    fieldRange: (unit, start, end) => `${capitalize(unit.plural)} von ${start} bis ${end}`,
    fieldStepRange: (count, unit, start, end) => `Alle ${count} ${unit} von ${start} bis ${end}`,
    fieldStepStart: (count, unit, start) => `Alle ${count} ${unit} ab ${start}`,
    join: (parts) => parts.join(', '),
    exampleLabels: {
      '*/15 * * * *': 'Alle 15 Minuten',
      '0 * * * *': 'Zu jeder vollen Stunde',
      '0 9 * * 1-5': 'Werktags um 09:00',
      '30 6 1 * *': 'Monatlich am Tag 1 um 06:30',
      '0 0 1 1 *': 'Jahrlich am 1. Januar',
      '@daily': 'Taglich um Mitternacht',
      '@reboot': 'Beim Neustart',
    },
  },
}

const unitLabels: Record<Language, Record<CronFieldType, UnitLabel>> = {
  en: {
    minute: { singular: 'minute', plural: 'minutes', valuePrefix: 'at minute', everyLabel: 'every minute' },
    hour: { singular: 'hour', plural: 'hours', valuePrefix: 'at hour', everyLabel: 'every hour' },
    dayOfMonth: { singular: 'day of the month', plural: 'days of the month', valuePrefix: 'on day', everyLabel: 'every day of the month' },
    month: { singular: 'month', plural: 'months', valuePrefix: 'in', everyLabel: 'every month' },
    dayOfWeek: { singular: 'day of the week', plural: 'days of the week', valuePrefix: 'on', everyLabel: 'every day of the week' },
  },
  it: {
    minute: { singular: 'minuto', plural: 'minuti', valuePrefix: 'al minuto', everyLabel: 'ogni minuto' },
    hour: { singular: 'ora', plural: 'ore', valuePrefix: 'alle ore', everyLabel: 'ogni ora' },
    dayOfMonth: { singular: 'giorno del mese', plural: 'giorni del mese', valuePrefix: 'il giorno', everyLabel: 'ogni giorno del mese' },
    month: { singular: 'mese', plural: 'mesi', valuePrefix: 'a', everyLabel: 'ogni mese' },
    dayOfWeek: { singular: 'giorno della settimana', plural: 'giorni della settimana', valuePrefix: 'di', everyLabel: 'ogni giorno della settimana' },
  },
  es: {
    minute: { singular: 'minuto', plural: 'minutos', valuePrefix: 'en el minuto', everyLabel: 'cada minuto' },
    hour: { singular: 'hora', plural: 'horas', valuePrefix: 'a la hora', everyLabel: 'cada hora' },
    dayOfMonth: { singular: 'dia del mes', plural: 'dias del mes', valuePrefix: 'el dia', everyLabel: 'cada dia del mes' },
    month: { singular: 'mes', plural: 'meses', valuePrefix: 'en', everyLabel: 'cada mes' },
    dayOfWeek: { singular: 'dia de la semana', plural: 'dias de la semana', valuePrefix: 'los', everyLabel: 'cada dia de la semana' },
  },
  fr: {
    minute: { singular: 'minute', plural: 'minutes', valuePrefix: 'a la minute', everyLabel: 'chaque minute' },
    hour: { singular: 'heure', plural: 'heures', valuePrefix: 'a l heure', everyLabel: 'chaque heure' },
    dayOfMonth: { singular: 'jour du mois', plural: 'jours du mois', valuePrefix: 'le jour', everyLabel: 'chaque jour du mois' },
    month: { singular: 'mois', plural: 'mois', valuePrefix: 'en', everyLabel: 'chaque mois' },
    dayOfWeek: { singular: 'jour de la semaine', plural: 'jours de la semaine', valuePrefix: 'le', everyLabel: 'chaque jour de la semaine' },
  },
  de: {
    minute: { singular: 'Minute', plural: 'Minuten', valuePrefix: 'in Minute', everyLabel: 'jede Minute' },
    hour: { singular: 'Stunde', plural: 'Stunden', valuePrefix: 'in Stunde', everyLabel: 'jede Stunde' },
    dayOfMonth: { singular: 'Tag des Monats', plural: 'Tage des Monats', valuePrefix: 'am Tag', everyLabel: 'jeder Tag des Monats' },
    month: { singular: 'Monat', plural: 'Monate', valuePrefix: 'im', everyLabel: 'jeder Monat' },
    dayOfWeek: { singular: 'Wochentag', plural: 'Wochentage', valuePrefix: 'am', everyLabel: 'jeder Wochentag' },
  },
}

const fieldNameKeys: Record<CronFieldType, 'tools_cronExpression_fieldMinute' | 'tools_cronExpression_fieldHour' | 'tools_cronExpression_fieldDayOfMonth' | 'tools_cronExpression_fieldMonth' | 'tools_cronExpression_fieldDayOfWeek'> = {
  minute: 'tools_cronExpression_fieldMinute',
  hour: 'tools_cronExpression_fieldHour',
  dayOfMonth: 'tools_cronExpression_fieldDayOfMonth',
  month: 'tools_cronExpression_fieldMonth',
  dayOfWeek: 'tools_cronExpression_fieldDayOfWeek',
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

  const explainExpression = (expression: string) => {
    const parsed = parseCronExpression(expression)
    if (parsed.ok) {
      setInput(expression)
      setResult(parsed.value)
      setError(null)
      return
    }

    setResult(null)
    setError(translateError(props.lang, parsed.error))
  }

  const buildBuilderExpression = (overrides?: Partial<{
    mode: BuilderMode
    minute: string
    hour: string
    step: string
    dayOfWeek: string
    dayOfMonth: string
  }>) => {
    const mode = overrides?.mode ?? builderMode()
    const minute = overrides?.minute ?? builderMinute()
    const hour = overrides?.hour ?? builderHour()
    const step = overrides?.step ?? builderStep()
    const dayOfWeek = overrides?.dayOfWeek ?? builderDayOfWeek()
    const dayOfMonth = overrides?.dayOfMonth ?? builderDayOfMonth()

    if (mode === 'everyMinutes') return `*/${step} * * * *`
    if (mode === 'hourly') return `${minute} * * * *`
    if (mode === 'daily') return `${minute} ${hour} * * *`
    if (mode === 'weekly') return `${minute} ${hour} * * ${dayOfWeek}`
    return `${minute} ${hour} ${dayOfMonth} * *`
  }

  const handleExplain = () => {
    explainExpression(input())
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
  }>) => {
    explainExpression(buildBuilderExpression(overrides))
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
    setError(null)
  }

  const minuteOptions = () => createNumberOptions(0, 59)
  const hourOptions = () => createNumberOptions(0, 23)
  const stepOptions = () => ['5', '10', '15', '20', '30'].map((value) => ({ value, label: value }))
  const dayOfMonthOptions = () => createNumberOptions(1, 31)
  const dayOfWeekOptions = () => createWeekdayOptions(props.lang)
  const builderExpression = () => buildBuilderExpression()

  return (
    <div class="flex flex-col gap-5">
      <Input
        label={t(props.lang, 'tools_cronExpression_inputLabel')}
        placeholder={t(props.lang, 'tools_cronExpression_placeholder')}
        value={input()}
        onInput={(event) => setInput(event.currentTarget.value)}
      />

      <div class="flex flex-wrap gap-2">
        <Button variant="primary" onClick={handleExplain}>
          {phraseSets[props.lang].parse}
        </Button>
        <Button variant="secondary" onClick={handleClear}>
          {t(props.lang, 'common_clear')}
        </Button>
      </div>

      <section class="rounded-xl border border-border bg-surface-raised p-4">
        <p class="mb-3 text-sm font-medium text-text-secondary">{phraseSets[props.lang].builder}</p>

        <div class="flex flex-wrap gap-2">
          <For each={(Object.keys(phraseSets[props.lang].builderModes) as BuilderMode[])}>
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

          <Show when={builderMode() === 'daily' || builderMode() === 'weekly' || builderMode() === 'monthly'}>
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

          <Show when={builderMode() === 'weekly'}>
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
        </div>

        <div class="mt-4 rounded-lg border border-border bg-surface p-3">
          <p class="text-xs text-text-muted">{phraseSets[props.lang].builderPreview}</p>
          <p class="mt-1 font-mono text-sm text-text-primary">{builderExpression()}</p>
        </div>
      </section>

      <div class="rounded-xl border border-border bg-surface-raised p-4">
        <p class="mb-3 text-sm font-medium text-text-secondary">{phraseSets[props.lang].examples}</p>
        <div class="flex flex-wrap gap-2">
          <For each={cronExamples}>
            {(example) => (
              <Button variant="secondary" size="sm" onClick={() => applyExample(example)}>
                <span class="font-mono">{example}</span>
                <span class="text-text-muted">{phraseSets[props.lang].exampleLabels[example]}</span>
              </Button>
            )}
          </For>
        </div>
      </div>

      <Show when={error()}>
        <StatusMessage type="error" message={error()!} />
      </Show>

      <Show when={result()}>
        {(parsed) => (
          <div class="flex flex-col gap-4">
            <section class="rounded-xl border border-border bg-surface-raised p-4" data-testid="cron-summary">
              <p class="text-sm font-medium text-text-secondary">{phraseSets[props.lang].explanation}</p>
              <p class="mt-2 text-lg font-semibold text-text-primary">{formatSummary(parsed(), props.lang)}</p>
            </section>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-lg border border-border bg-surface-raised p-3">
                <p class="text-xs text-text-muted">{phraseSets[props.lang].normalized}</p>
                <p class="mt-1 font-mono text-sm text-text-primary">{parsed().normalizedExpression}</p>
              </div>
              <Show when={parsed().shortcut}>
                <div class="rounded-lg border border-border bg-surface-raised p-3">
                  <p class="text-xs text-text-muted">{phraseSets[props.lang].shortcut}</p>
                  <p class="mt-1 font-mono text-sm text-text-primary">{parsed().shortcut}</p>
                </div>
              </Show>
            </div>

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
                        <p class="mt-2 text-sm text-text-secondary">{describeField(field, props.lang)}</p>
                      </div>
                    )}
                  </For>
                </div>
              </section>
            </Show>
          </div>
        )}
      </Show>
    </div>
  )
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

  if (isAnyField(minute) && isAnyField(hour) && isAnyField(dayOfMonth) && isAnyField(month) && isAnyField(dayOfWeek)) {
    return phrases.everyMinute
  }

  const minuteValue = getSingleValue(minute)
  const hourValue = getSingleValue(hour)
  const minuteEvery = getEveryStep(minute)

  if (minuteEvery !== null && isAnyField(hour) && isAnyField(dayOfMonth) && isAnyField(month) && isAnyField(dayOfWeek)) {
    return phrases.everyStep(minuteEvery, unitLabels[lang].minute.plural)
  }

  if (minuteValue !== null && hourValue !== null && isAnyField(dayOfMonth) && isAnyField(month) && isAnyField(dayOfWeek)) {
    return phrases.atTime(hourValue, minuteValue)
  }

  if (minuteValue !== null && isAnyField(hour) && isAnyField(dayOfMonth) && isAnyField(month) && isAnyField(dayOfWeek)) {
    return phrases.atMinutePastEveryHour(minuteValue)
  }

  return phrases.join(result.fields.map((field) => describeField(field, lang)))
}

function describeField(field: CronField, lang: Language): string {
  const phrases = phraseSets[lang]
  if (field.segments.length === 1) {
    return describeSegment(field.type, field.segments[0], lang)
  }

  return phrases.join(field.segments.map((segment) => describeSegment(field.type, segment, lang)))
}

function describeSegment(fieldType: CronFieldType, segment: CronSegment, lang: Language): string {
  const phrases = phraseSets[lang]
  const labels = unitLabels[lang][fieldType]

  switch (segment.kind) {
    case 'any':
      return phrases.fieldAny(labels)
    case 'value':
      return phrases.fieldValue(labels, formatFieldValue(fieldType, segment.value, lang))
    case 'range':
      return phrases.fieldRange(
        labels,
        formatFieldValue(fieldType, segment.start, lang),
        formatFieldValue(fieldType, segment.end, lang),
      )
    case 'step':
      if (segment.base.kind === 'any') {
        return phrases.everyStep(segment.every, labels.plural)
      }
      if (segment.base.kind === 'value') {
        return phrases.fieldStepStart(
          segment.every,
          labels.plural,
          formatFieldValue(fieldType, segment.base.value, lang),
        )
      }
      return phrases.fieldStepRange(
        segment.every,
        labels.plural,
        formatFieldValue(fieldType, segment.base.start, lang),
        formatFieldValue(fieldType, segment.base.end, lang),
      )
  }
}

function formatFieldValue(fieldType: CronFieldType, value: number, lang: Language): string {
  if (fieldType === 'month') {
    return new Intl.DateTimeFormat(phraseSets[lang].locale, { month: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2024, value - 1, 1)))
  }

  if (fieldType === 'dayOfWeek') {
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

function isAnyField(field: CronField): boolean {
  return field.segments.length === 1 && field.segments[0]!.kind === 'any'
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
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
