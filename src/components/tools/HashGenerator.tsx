import { createSignal, Show, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { StatusMessage } from '../ui/StatusMessage'
import { ResultCard } from '../ui/ResultCard'
import { generateHashes } from '../../tools/hash-generator'
import type { HashResult } from '../../tools/hash-generator'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function HashGenerator(props: Props) {
  const [input, setInput] = createSignal('')
  const [result, setResult] = createSignal<HashResult | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(false)

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

  const handleGenerate = async () => {
    if (input().trim() === '') {
      setError(t(props.lang, 'errors_EMPTY_INPUT'))
      setResult(null)
      return
    }

    setLoading(true)
    setError(null)

    const hashed = await generateHashes(input())
    if (hashed.ok) {
      setResult(hashed.value)
      setError(null)
    } else {
      setError(translateError(props.lang, hashed.error))
      setResult(null)
    }

    setLoading(false)
  }

  const cards = () => {
    const r = result()
    if (!r) return []
    return [
      { label: 'SHA-1', value: r.sha1 },
      { label: 'SHA-256', value: r.sha256 },
      { label: 'SHA-512', value: r.sha512 },
    ]
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'tools_hashGenerator_inputLabel')}
        placeholder={t(props.lang, 'tools_hashGenerator_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />

      <Button variant="primary" onClick={handleGenerate} disabled={loading()}>
        {loading() ? '...' : t(props.lang, 'tools_hashGenerator_generate')}
      </Button>

      <Show when={error()}>
        <StatusMessage type="error" message={error()!} />
      </Show>

      <Show when={result()}>
        <div class="grid gap-3">
          {cards().map((card) => (
            <ResultCard label={card.label} value={card.value} />
          ))}
        </div>
      </Show>
    </div>
  )
}
