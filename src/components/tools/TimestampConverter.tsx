import { createSignal, Show } from 'solid-js'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { CopyButton } from '../ui/CopyButton'
import { StatusMessage } from '../ui/StatusMessage'
import { convertTimestamp, currentTimestamp } from '../../tools/timestamp-converter'
import type { TimestampResult } from '../../tools/timestamp-converter'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function TimestampConverter(props: Props) {
  const [input, setInput] = createSignal('')
  const [result, setResult] = createSignal<TimestampResult | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  const handleConvert = () => {
    const value = Number(input())
    if (isNaN(value)) {
      setError(t(props.lang, 'tools_timestampConverter_invalidDate'))
      setResult(null)
      return
    }

    const converted = convertTimestamp(value)
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

  const handleCurrentTime = () => {
    const ts = currentTimestamp()
    setInput(String(ts))
    const converted = convertTimestamp(ts)
    if (converted.ok) {
      setResult(converted.value)
      setError(null)
    }
  }

  const cards = () => {
    const r = result()
    if (!r) return []
    return [
      { label: t(props.lang, 'tools_timestampConverter_unixSeconds'), value: String(r.seconds) },
      { label: t(props.lang, 'tools_timestampConverter_unixMilliseconds'), value: String(r.milliseconds) },
      { label: 'ISO 8601', value: r.iso },
      { label: 'UTC', value: r.utc },
      { label: t(props.lang, 'tools_timestampConverter_locale'), value: r.locale },
    ]
  }

  return (
    <div class="flex flex-col gap-4">
      <Input
        label={t(props.lang, 'tools_timestampConverter_inputLabel')}
        placeholder={t(props.lang, 'tools_timestampConverter_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />

      <div class="flex gap-2">
        <Button variant="primary" onClick={handleConvert}>
          {t(props.lang, 'common_convert')}
        </Button>
        <Button variant="secondary" onClick={handleCurrentTime}>
          {t(props.lang, 'tools_timestampConverter_useCurrent')}
        </Button>
      </div>

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
