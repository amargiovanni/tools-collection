import { createMemo, createSignal, Show } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { StatusMessage } from '../ui/StatusMessage'
import { ResultCard } from '../ui/ResultCard'
import { generateAesKey } from '../../tools/aes-key-generator'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function AesKeyGenerator(props: Props) {
  const [sizeBits, setSizeBits] = createSignal<'128' | '192' | '256'>('256')
  const [result, setResult] = createSignal<{
    hex: string
    base64: string
  } | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  useToolState({
    onRestore(saved) {
      if (saved['sizeBits'] === '128' || saved['sizeBits'] === '192' || saved['sizeBits'] === '256') {
        setSizeBits(saved['sizeBits'])
      }
    },
    getState: () => ({ sizeBits: sizeBits() }),
  })

  const handleGenerate = () => {
    const generated = generateAesKey(parseInt(sizeBits(), 10))
    if (generated.ok) {
      setResult({
        hex: generated.value.hex,
        base64: generated.value.base64,
      })
      setError(null)
    } else {
      setResult(null)
      setError(translateError(props.lang, generated.error))
    }
  }

  const cards = createMemo(() => {
    const current = result()
    if (!current) return []
    return [
      { label: 'Hex', value: current.hex },
      { label: 'Base64', value: current.base64 },
    ]
  })

  return (
    <div class="flex flex-col gap-4">
      <Select
        label={t(props.lang, 'tools_aesKeyGenerator_sizeLabel')}
        value={sizeBits()}
        onChange={(e) => setSizeBits(e.currentTarget.value as '128' | '192' | '256')}
        options={[
          { value: '128', label: t(props.lang, 'tools_aesKeyGenerator_size128') },
          { value: '192', label: t(props.lang, 'tools_aesKeyGenerator_size192') },
          { value: '256', label: t(props.lang, 'tools_aesKeyGenerator_size256') },
        ]}
      />

      <p class="text-sm text-text-muted">{t(props.lang, 'tools_aesKeyGenerator_hint')}</p>

      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_aesKeyGenerator_generate')}
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
