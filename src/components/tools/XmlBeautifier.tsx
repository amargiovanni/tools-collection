import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { TextArea } from '../ui/TextArea'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { formatXml } from '../../tools/xml-beautifier'
import type { XmlIndent } from '../../tools/xml-beautifier'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function XmlBeautifier(props: Props) {
  const [input, setInput] = createSignal('')
  const [indent, setIndent] = createSignal<XmlIndent>(2)
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      const indentVal = saved['indent']
      if (indentVal === 2 || indentVal === 4 || indentVal === 'tab') setIndent(indentVal as XmlIndent)
    },
    getState: () => ({ input: input(), indent: indent() }),
  })

  const indentOptions = () => [
    { value: '2', label: t(props.lang, 'tools_xmlBeautifier_indent2') },
    { value: '4', label: t(props.lang, 'tools_xmlBeautifier_indent4') },
    { value: 'tab', label: t(props.lang, 'tools_xmlBeautifier_indentTab') },
  ]

  const parseIndent = (value: string): XmlIndent => {
    if (value === 'tab') return 'tab'
    return Number(value) as 2 | 4
  }

  const handleFormat = () => {
    setError(null)
    setOutput('')

    const result = formatXml(input(), indent())

    if (result.ok) {
      setOutput(result.value)
    } else {
      setError(translateError(props.lang, result.error))
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'tools_xmlBeautifier_inputLabel')}
        placeholder={t(props.lang, 'tools_xmlBeautifier_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        monospace
        rows={8}
      />
      <Select
        label={t(props.lang, 'tools_xmlBeautifier_indentLabel')}
        options={indentOptions()}
        value={String(indent())}
        onChange={(e) => setIndent(parseIndent(e.currentTarget.value))}
      />
      <Button variant="primary" onClick={handleFormat}>
        {t(props.lang, 'tools_xmlBeautifier_format')}
      </Button>

      {error() && <StatusMessage type="error" message={error()!} />}
      {!error() && output() && (
        <StatusMessage type="success" message={t(props.lang, 'tools_xmlBeautifier_valid')} />
      )}

      <OutputPanel
        value={output()}
        label={t(props.lang, 'tools_xmlBeautifier_outputLabel')}
        monospace
        rows={10}
      />
    </div>
  )
}
