import { createSignal, createMemo, Show } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { ResultCard } from '../ui/ResultCard'
import { StatusMessage } from '../ui/StatusMessage'
import { calculateDateInterval } from '../../tools/date-interval'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus'

function DateField(props: { label: string; value: string; onInput: (v: string) => void }) {
  return (
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-text-secondary">{props.label}</label>
      <input
        type="date"
        value={props.value}
        onInput={(e) => props.onInput(e.currentTarget.value)}
        class={INPUT_CLASS}
      />
    </div>
  )
}

export default function DateInterval(props: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [start, setStart] = createSignal(today)
  const [end, setEnd] = createSignal(today)

  useToolState({
    onRestore(saved) {
      if (typeof saved['start'] === 'string') setStart(saved['start'])
      if (typeof saved['end'] === 'string') setEnd(saved['end'])
    },
    getState: () => ({ start: start(), end: end() }),
  })

  const result = createMemo(() => calculateDateInterval(start(), end()))

  const cards = createMemo(() => {
    const r = result()
    if (!r) return []

    const ymd = [
      r.years > 0 ? `${r.years} ${t(props.lang, 'tools_dateInterval_yearUnit')}` : '',
      r.months > 0 ? `${r.months} ${t(props.lang, 'tools_dateInterval_monthUnit')}` : '',
      r.days > 0 ? `${r.days} ${t(props.lang, 'tools_dateInterval_dayUnit')}` : '',
    ]
      .filter(Boolean)
      .join(', ')

    return [
      {
        label: t(props.lang, 'tools_dateInterval_totalDays'),
        value: String(r.totalDays),
      },
      {
        label: t(props.lang, 'tools_dateInterval_breakdown'),
        value: ymd || t(props.lang, 'tools_dateInterval_sameDay'),
      },
      {
        label: t(props.lang, 'tools_dateInterval_totalWeeks'),
        value:
          r.remainderDays > 0
            ? `${r.totalWeeks} ${t(props.lang, 'tools_dateInterval_weekUnit')} + ${r.remainderDays} ${t(props.lang, 'tools_dateInterval_dayUnit')}`
            : `${r.totalWeeks} ${t(props.lang, 'tools_dateInterval_weekUnit')}`,
      },
      {
        label: t(props.lang, 'tools_dateInterval_workingDays'),
        value: String(r.workingDays),
      },
      {
        label: t(props.lang, 'tools_dateInterval_weekendDays'),
        value: String(r.weekendDays),
      },
    ]
  })

  return (
    <div class="flex flex-col gap-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <DateField
          label={t(props.lang, 'tools_dateInterval_startLabel')}
          value={start()}
          onInput={setStart}
        />
        <DateField
          label={t(props.lang, 'tools_dateInterval_endLabel')}
          value={end()}
          onInput={setEnd}
        />
      </div>

      <Show when={result()?.swapped}>
        <StatusMessage type="warning" message={t(props.lang, 'tools_dateInterval_swapped')} />
      </Show>

      <Show when={result()}>
        <div class="grid gap-3 sm:grid-cols-2">
          {cards().map((card) => (
            <ResultCard label={card.label} value={card.value} />
          ))}
        </div>
      </Show>
    </div>
  )
}
