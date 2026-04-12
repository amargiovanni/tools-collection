import { createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { Input } from '../ui/Input'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { Select } from '../ui/Select'
import { StatusMessage } from '../ui/StatusMessage'
import { generateLoremIpsum } from '../../tools/lorem-ipsum-generator'
import type { OutputType } from '../../tools/lorem-ipsum-generator'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function LoremIpsumGenerator(props: Props) {
  const [outputType, setOutputType] = createSignal<OutputType>('paragraphs')
  const [count, setCount] = createSignal(3)
  const [startWithClassic, setStartWithClassic] = createSignal(true)
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  const typeOptions = () => [
    { value: 'paragraphs', label: t(props.lang, 'tools_loremIpsumGenerator_typeParagraphs') },
    { value: 'sentences', label: t(props.lang, 'tools_loremIpsumGenerator_typeSentences') },
    { value: 'words', label: t(props.lang, 'tools_loremIpsumGenerator_typeWords') },
  ]

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['outputType'] === 'string') setOutputType(saved['outputType'] as OutputType)
      if (typeof saved['count'] === 'number') setCount(saved['count'])
      if (typeof saved['startWithClassic'] === 'boolean') setStartWithClassic(saved['startWithClassic'])
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { outputType: outputType(), count: count(), startWithClassic: startWithClassic() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const handleGenerate = () => {
    const result = generateLoremIpsum({
      type: outputType(),
      count: count(),
      startWithClassic: startWithClassic(),
    })

    if (result.ok) {
      setOutput(result.value)
      setError(null)
    } else {
      setError(translateError(props.lang, result.error))
      setOutput('')
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <Select
        label={t(props.lang, 'tools_loremIpsumGenerator_typeLabel')}
        options={typeOptions()}
        value={outputType()}
        onChange={(e) => setOutputType(e.currentTarget.value as OutputType)}
      />
      <Input
        type="number"
        label={t(props.lang, 'tools_loremIpsumGenerator_countLabel')}
        value={count()}
        min={1}
        max={100}
        onInput={(e) => setCount(parseInt(e.currentTarget.value) || 1)}
      />
      <div class="flex flex-wrap gap-4">
        <Checkbox
          label={t(props.lang, 'tools_loremIpsumGenerator_startWithClassic')}
          checked={startWithClassic()}
          onChange={(e) => setStartWithClassic(e.currentTarget.checked)}
        />
      </div>
      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_loremIpsumGenerator_generate')}
      </Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel
        value={output()}
        label={t(props.lang, 'tools_loremIpsumGenerator_outputLabel')}
        monospace={false}
        rows={10}
      />
    </div>
  )
}
