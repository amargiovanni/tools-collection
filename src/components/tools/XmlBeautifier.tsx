import { createSignal } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { formatXml } from '../../tools/xml-beautifier'
import type { XmlIndent } from '../../tools/xml-beautifier'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function XmlBeautifier(props: Props) {
  const [input, setInput] = createSignal('')
  const [indent, setIndent] = createSignal<XmlIndent>(2)
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [valid, setValid] = createSignal<boolean | null>(null)

  const indentOptions = [
    { value: '2', label: '2 spaces' },
    { value: '4', label: '4 spaces' },
    { value: 'tab', label: 'Tab' },
  ] as const

  const parseIndent = (value: string): XmlIndent => {
    if (value === 'tab') return 'tab'
    return Number(value) as 2 | 4
  }

  const handleFormat = () => {
    setError(null)
    setValid(null)
    setOutput('')

    const result = formatXml(input(), indent())

    if (result.ok) {
      setOutput(result.value)
      setValid(true)
    } else {
      setError(result.error.message)
      setValid(false)
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
        label="Indent:"
        options={[...indentOptions]}
        value={String(indent())}
        onChange={(e) => setIndent(parseIndent(e.currentTarget.value))}
      />
      <Button variant="primary" onClick={handleFormat}>
        {t(props.lang, 'tools_xmlBeautifier_format')}
      </Button>

      {error() && <StatusMessage type="error" message={error()!} />}
      {valid() === true && (
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
