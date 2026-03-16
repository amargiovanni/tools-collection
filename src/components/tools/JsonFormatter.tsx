import { createSignal } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { formatJson, validateJson } from '../../tools/json-formatter'
import type { JsonIndent } from '../../tools/json-formatter'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function JsonFormatter(props: Props) {
  const [input, setInput] = createSignal('')
  const [indent, setIndent] = createSignal<JsonIndent>(2)
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  const indentOptions = () => [
    { value: '2', label: t(props.lang, 'tools_jsonFormatter_indent2') },
    { value: '4', label: t(props.lang, 'tools_jsonFormatter_indent4') },
    { value: 'tab', label: t(props.lang, 'tools_jsonFormatter_indentTab') },
    { value: 'compact', label: t(props.lang, 'tools_jsonFormatter_indentCompact') },
  ]

  const parseIndent = (value: string): JsonIndent => {
    if (value === 'tab') return 'tab'
    if (value === 'compact') return 'compact'
    return Number(value) as 2 | 4
  }

  const handleFormat = () => {
    setError(null)
    setOutput('')

    const validation = validateJson(input())
    if (!validation.ok) {
      setError(translateError(props.lang, validation.error))
      return
    }

    const result = formatJson(input(), indent())
    if (result.ok) {
      setOutput(result.value)
    } else {
      setError(translateError(props.lang, result.error))
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'tools_jsonFormatter_inputLabel')}
        placeholder={t(props.lang, 'tools_jsonFormatter_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        monospace
        rows={8}
      />
      <Select
        label={t(props.lang, 'tools_jsonFormatter_indentLabel')}
        options={indentOptions()}
        value={String(indent())}
        onChange={(e) => setIndent(parseIndent(e.currentTarget.value))}
      />
      <Button variant="primary" onClick={handleFormat}>
        {t(props.lang, 'tools_jsonFormatter_format')}
      </Button>

      {error() && <StatusMessage type="error" message={error()!} />}
      {!error() && output() && (
        <StatusMessage type="success" message={t(props.lang, 'tools_jsonFormatter_valid')} />
      )}

      <OutputPanel
        value={output()}
        label={t(props.lang, 'tools_jsonFormatter_outputLabel')}
        monospace
        rows={10}
      />
    </div>
  )
}
