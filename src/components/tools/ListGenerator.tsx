import { createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { TextArea } from '../ui/TextArea'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { generateList } from '../../tools/list-generator'
import type { ListFormat } from '../../tools/list-generator'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function ListGenerator(props: Props) {
  const [input, setInput] = createSignal('')
  const [format, setFormat] = createSignal<ListFormat>('numbered')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved.input === 'string') setInput(saved.input)
      if (typeof saved.format === 'string') setFormat(saved.format as ListFormat)
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input(), format: format() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const formatOptions = () => [
    { value: 'numbered', label: t(props.lang, 'tools_listGenerator_formatNumbered') },
    { value: 'bulleted', label: t(props.lang, 'tools_listGenerator_formatBulleted') },
    { value: 'comma', label: t(props.lang, 'tools_listGenerator_formatComma') },
    { value: 'pipe', label: t(props.lang, 'tools_listGenerator_formatPipe') },
  ]

  const handleGenerate = () => {
    const result = generateList(input(), format())
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
      <TextArea
        label={t(props.lang, 'common_inputText')}
        placeholder={t(props.lang, 'tools_listGenerator_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <Select
        label={t(props.lang, 'tools_listGenerator_outputFormat')}
        options={formatOptions()}
        value={format()}
        onChange={(e) => setFormat(e.currentTarget.value as ListFormat)}
      />
      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'common_convert')}
      </Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} label={t(props.lang, 'common_result')} />
    </div>
  )
}
