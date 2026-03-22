import { createSignal, Show, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { StatusMessage } from '../ui/StatusMessage'
import { ResultCard } from '../ui/ResultCard'
import { convertDataSize, formatDataSize } from '../../tools/data-size-converter'
import type { DataSizeUnit, DataSizeResult } from '../../tools/data-size-converter'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function DataSizeConverter(props: Props) {
  const [input, setInput] = createSignal('')
  const [unit, setUnit] = createSignal<DataSizeUnit>('GiB')
  const [result, setResult] = createSignal<DataSizeResult | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved.input === 'string') setInput(saved.input)
      if (typeof saved.unit === 'string') setUnit(saved.unit as DataSizeUnit)
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input(), unit: unit() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const unitOptions = () => [
    { value: 'b', label: t(props.lang, 'tools_dataSizeConverter_unitBit') },
    { value: 'B', label: t(props.lang, 'tools_dataSizeConverter_unitByte') },
    { value: 'KB', label: t(props.lang, 'tools_dataSizeConverter_unitKB') },
    { value: 'MB', label: t(props.lang, 'tools_dataSizeConverter_unitMB') },
    { value: 'GB', label: t(props.lang, 'tools_dataSizeConverter_unitGB') },
    { value: 'TB', label: t(props.lang, 'tools_dataSizeConverter_unitTB') },
    { value: 'KiB', label: t(props.lang, 'tools_dataSizeConverter_unitKiB') },
    { value: 'MiB', label: t(props.lang, 'tools_dataSizeConverter_unitMiB') },
    { value: 'GiB', label: t(props.lang, 'tools_dataSizeConverter_unitGiB') },
    { value: 'TiB', label: t(props.lang, 'tools_dataSizeConverter_unitTiB') },
  ]

  const handleConvert = () => {
    const value = Number(input())
    if (isNaN(value)) {
      setError(t(props.lang, 'tools_dataSizeConverter_invalid'))
      setResult(null)
      return
    }

    const converted = convertDataSize(value, unit())
    if (converted.ok) {
      setResult(converted.value)
      setError(null)
    } else {
      setError(translateError(props.lang, converted.error))
      setResult(null)
    }
  }

  const cards = () => {
    const r = result()
    if (!r) return []
    return [
      { label: t(props.lang, 'tools_dataSizeConverter_bits'), value: formatDataSize(r.b) },
      { label: t(props.lang, 'tools_dataSizeConverter_bytes'), value: formatDataSize(r.B) },
      { label: t(props.lang, 'tools_dataSizeConverter_kilobytes'), value: formatDataSize(r.KB) },
      { label: t(props.lang, 'tools_dataSizeConverter_megabytes'), value: formatDataSize(r.MB) },
      { label: t(props.lang, 'tools_dataSizeConverter_gigabytes'), value: formatDataSize(r.GB) },
      { label: t(props.lang, 'tools_dataSizeConverter_terabytes'), value: formatDataSize(r.TB) },
      { label: t(props.lang, 'tools_dataSizeConverter_kibibytes'), value: formatDataSize(r.KiB) },
      { label: t(props.lang, 'tools_dataSizeConverter_mebibytes'), value: formatDataSize(r.MiB) },
      { label: t(props.lang, 'tools_dataSizeConverter_gibibytes'), value: formatDataSize(r.GiB) },
      { label: t(props.lang, 'tools_dataSizeConverter_tebibytes'), value: formatDataSize(r.TiB) },
    ]
  }

  return (
    <div class="flex flex-col gap-4">
      <div class="flex items-end gap-3">
        <Input
          label={t(props.lang, 'tools_dataSizeConverter_inputLabel')}
          placeholder={t(props.lang, 'tools_dataSizeConverter_placeholder')}
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          class="flex-1"
        />
        <Select
          label={t(props.lang, 'tools_dataSizeConverter_unitLabel')}
          options={unitOptions()}
          value={unit()}
          onChange={(e) => setUnit(e.currentTarget.value as DataSizeUnit)}
          class="w-44"
        />
      </div>

      <div class="flex flex-col gap-1 rounded-lg border border-border bg-surface-raised p-3 text-xs text-text-secondary">
        <p>{t(props.lang, 'tools_dataSizeConverter_unitHint')}</p>
        <p>{t(props.lang, 'tools_dataSizeConverter_exampleHint')}</p>
      </div>

      <Button variant="primary" onClick={handleConvert}>
        {t(props.lang, 'tools_dataSizeConverter_convert')}
      </Button>

      <Show when={error()}>
        <StatusMessage type="error" message={error()!} />
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
