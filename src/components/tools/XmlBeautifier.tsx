import { createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
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

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved.input === 'string') setInput(saved.input)
      const indentVal = saved.indent
      if (indentVal === 2 || indentVal === 4 || indentVal === 'tab') setIndent(indentVal as XmlIndent)
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input(), indent: indent() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
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
