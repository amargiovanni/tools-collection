import { createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { Input } from '../ui/Input'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { generatePins } from '../../tools/pin-generator'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function PinGenerator(props: Props) {
  const [length, setLength] = createSignal(4)
  const [count, setCount] = createSignal(10)
  const [unique, setUnique] = createSignal(true)
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved.length === 'number') setLength(saved.length)
      if (typeof saved.count === 'number') setCount(saved.count)
      if (typeof saved.unique === 'boolean') setUnique(saved.unique)
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { length: length(), count: count(), unique: unique() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const handleGenerate = () => {
    const result = generatePins({
      length: length(),
      count: count(),
      unique: unique(),
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
      <Input
        type="number"
        label={t(props.lang, 'tools_pinGenerator_lengthLabel')}
        value={length()}
        min={3}
        max={12}
        onInput={(e) => setLength(parseInt(e.currentTarget.value) || 4)}
      />
      <Input
        type="number"
        label={t(props.lang, 'tools_pinGenerator_countLabel')}
        value={count()}
        min={1}
        max={50}
        onInput={(e) => setCount(parseInt(e.currentTarget.value) || 1)}
      />
      <Checkbox
        label={t(props.lang, 'tools_pinGenerator_unique')}
        checked={unique()}
        onChange={(e) => setUnique(e.currentTarget.checked)}
      />
      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_pinGenerator_generate')}
      </Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} label={t(props.lang, 'tools_pinGenerator_outputLabel')} />
    </div>
  )
}
