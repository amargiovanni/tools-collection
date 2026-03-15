import { createSignal } from 'solid-js'
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
