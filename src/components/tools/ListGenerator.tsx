import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
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

  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      if (typeof saved['format'] === 'string') setFormat(saved['format'] as ListFormat)
    },
    getState: () => ({ input: input(), format: format() }),
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
