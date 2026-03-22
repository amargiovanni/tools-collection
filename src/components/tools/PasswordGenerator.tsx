import { createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { Input } from '../ui/Input'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { generatePasswords } from '../../tools/password-generator'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function PasswordGenerator(props: Props) {
  const [length, setLength] = createSignal(16)
  const [count, setCount] = createSignal(5)
  const [uppercase, setUppercase] = createSignal(true)
  const [lowercase, setLowercase] = createSignal(true)
  const [numbers, setNumbers] = createSignal(true)
  const [symbols, setSymbols] = createSignal(true)
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['length'] === 'number') setLength(saved['length'])
      if (typeof saved['count'] === 'number') setCount(saved['count'])
      if (typeof saved['uppercase'] === 'boolean') setUppercase(saved['uppercase'])
      if (typeof saved['lowercase'] === 'boolean') setLowercase(saved['lowercase'])
      if (typeof saved['numbers'] === 'boolean') setNumbers(saved['numbers'])
      if (typeof saved['symbols'] === 'boolean') setSymbols(saved['symbols'])
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { length: length(), count: count(), uppercase: uppercase(), lowercase: lowercase(), numbers: numbers(), symbols: symbols() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const handleGenerate = () => {
    const result = generatePasswords({
      length: length(),
      count: count(),
      uppercase: uppercase(),
      lowercase: lowercase(),
      numbers: numbers(),
      symbols: symbols(),
    })

    if (result.ok) {
      setOutput(result.value.join('\n'))
      setError(null)
    } else {
      setError(translateError(props.lang, result.error))
      setOutput('')
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-text-secondary">
          {t(props.lang, 'tools_passwordGenerator_lengthLabel')} {length()}
        </label>
        <input
          type="range"
          min={8}
          max={64}
          value={length()}
          onInput={(e) => setLength(parseInt(e.currentTarget.value))}
          class="w-full accent-accent cursor-pointer"
        />
      </div>
      <Input
        type="number"
        label={t(props.lang, 'tools_passwordGenerator_countLabel')}
        value={count()}
        min={1}
        max={20}
        onInput={(e) => setCount(parseInt(e.currentTarget.value) || 1)}
      />
      <div class="flex flex-wrap gap-4">
        <Checkbox
          label={t(props.lang, 'tools_passwordGenerator_includeUppercase')}
          checked={uppercase()}
          onChange={(e) => setUppercase(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_passwordGenerator_includeLowercase')}
          checked={lowercase()}
          onChange={(e) => setLowercase(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_passwordGenerator_includeNumbers')}
          checked={numbers()}
          onChange={(e) => setNumbers(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_passwordGenerator_includeSymbols')}
          checked={symbols()}
          onChange={(e) => setSymbols(e.currentTarget.checked)}
        />
      </div>
      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_passwordGenerator_generate')}
      </Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} label={t(props.lang, 'tools_passwordGenerator_outputLabel')} />
    </div>
  )
}
