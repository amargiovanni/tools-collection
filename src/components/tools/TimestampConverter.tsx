import { createSignal, Show, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { StatusMessage } from '../ui/StatusMessage'
import { ResultCard } from '../ui/ResultCard'
import { convertTimestamp, currentTimestamp } from '../../tools/timestamp-converter'
import type { TimestampResult } from '../../tools/timestamp-converter'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function TimestampConverter(props: Props) {
  const [input, setInput] = createSignal('')
  const [result, setResult] = createSignal<TimestampResult | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved.input === 'string') setInput(saved.input)
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

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
      setError(translateError(props.lang, converted.error))
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
            <ResultCard label={card.label} value={card.value} />
          ))}
        </div>
      </Show>
    </div>
  )
}
