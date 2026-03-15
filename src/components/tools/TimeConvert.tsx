import { createSignal, Show } from 'solid-js'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { CopyButton } from '../ui/CopyButton'
import { StatusMessage } from '../ui/StatusMessage'
import { convertTime, formatNumber } from '../../tools/time-convert'
import type { TimeUnit, TimeConvertResult } from '../../tools/time-convert'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function TimeConvert(props: Props) {
  const [input, setInput] = createSignal('')
  const [unit, setUnit] = createSignal<TimeUnit>('s')
  const [result, setResult] = createSignal<TimeConvertResult | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  const unitOptions = () => [
    { value: 'ms', label: t(props.lang, 'tools_timeConvert_unitMilliseconds') },
    { value: 's', label: t(props.lang, 'tools_timeConvert_unitSeconds') },
    { value: 'min', label: t(props.lang, 'tools_timeConvert_unitMinutes') },
    { value: 'h', label: t(props.lang, 'tools_timeConvert_unitHours') },
    { value: 'd', label: t(props.lang, 'tools_timeConvert_unitDays') },
  ]

  const handleConvert = () => {
    const value = Number(input())
    if (isNaN(value)) {
      setError(t(props.lang, 'tools_timeConvert_invalid'))
      setResult(null)
      return
    }

    const converted = convertTime(value, unit())
    if (converted.ok) {
      setResult(converted.value)
      setError(null)
    } else {
      const errorMsg = (() => {
        const key = `errors_${converted.error.code}` as any
        try { return t(props.lang, key) } catch { return converted.error.message }
      })()
      setError(errorMsg)
      setResult(null)
    }
  }

  const cards = () => {
    const r = result()
    if (!r) return []
    return [
      { label: t(props.lang, 'tools_timeConvert_milliseconds'), value: formatNumber(r.ms) },
      { label: t(props.lang, 'tools_timeConvert_seconds'), value: formatNumber(r.s) },
      { label: t(props.lang, 'tools_timeConvert_minutes'), value: formatNumber(r.min) },
      { label: t(props.lang, 'tools_timeConvert_hours'), value: formatNumber(r.h) },
      { label: t(props.lang, 'tools_timeConvert_days'), value: formatNumber(r.d) },
      { label: t(props.lang, 'tools_timeConvert_formatted'), value: r.formatted },
    ]
  }

  return (
    <div class="flex flex-col gap-4">
      <div class="flex items-end gap-3">
        <Input
          label={t(props.lang, 'tools_timeConvert_inputLabel')}
          placeholder={t(props.lang, 'tools_timeConvert_placeholder')}
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          class="flex-1"
        />
        <Select
          label={t(props.lang, 'tools_timeConvert_unitLabel')}
          options={unitOptions()}
          value={unit()}
          onChange={(e) => setUnit(e.currentTarget.value as TimeUnit)}
          class="w-40"
        />
      </div>

      <Button variant="primary" onClick={handleConvert}>
        {t(props.lang, 'tools_timeConvert_convert')}
      </Button>

      <Show when={error()}>
        <StatusMessage type="error" message={error()!} />
      </Show>

      <Show when={result()}>
        <div class="grid gap-3 sm:grid-cols-2">
          {cards().map((card) => (
            <div class="flex items-center justify-between rounded-lg border border-border bg-surface-raised p-3">
              <div>
                <span class="text-xs text-text-muted">{card.label}</span>
                <p class="font-mono text-sm text-text-primary">{card.value}</p>
              </div>
              <CopyButton getValue={() => card.value} />
            </div>
          ))}
        </div>
      </Show>
    </div>
  )
}
