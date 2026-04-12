import { createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { TextArea } from '../ui/TextArea'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import {
  formatToml,
  validateToml,
  minifyTomlStr,
  tomlToJson,
  jsonToToml,
} from '../../tools/toml-formatter'
import type { TomlIndent } from '../../tools/toml-formatter'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

type TomlAction = 'format' | 'minify' | 'toml-to-json' | 'json-to-toml'

interface Props {
  lang: Language
}

export default function TomlFormatter(props: Props) {
  const [input, setInput] = createSignal('')
  const [indent, setIndent] = createSignal<TomlIndent>(2)
  const [action, setAction] = createSignal<TomlAction>('format')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [success, setSuccess] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      const indentVal = saved['indent']
      if (indentVal === 2 || indentVal === 4 || indentVal === 'tab') {
        setIndent(indentVal)
      }
      const actionVal = saved['action']
      if (actionVal === 'format' || actionVal === 'minify' || actionVal === 'toml-to-json' || actionVal === 'json-to-toml') {
        setAction(actionVal)
      }
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input(), indent: indent(), action: action() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const indentOptions = () => [
    { value: '2', label: t(props.lang, 'tools_tomlFormatter_indent2') },
    { value: '4', label: t(props.lang, 'tools_tomlFormatter_indent4') },
    { value: 'tab', label: t(props.lang, 'tools_tomlFormatter_indentTab') },
  ]

  const actionOptions = () => [
    { value: 'format', label: t(props.lang, 'tools_tomlFormatter_actionFormat') },
    { value: 'minify', label: t(props.lang, 'tools_tomlFormatter_actionMinify') },
    { value: 'toml-to-json', label: t(props.lang, 'tools_tomlFormatter_actionToJson') },
    { value: 'json-to-toml', label: t(props.lang, 'tools_tomlFormatter_actionFromJson') },
  ]

  const parseIndent = (value: string): TomlIndent => {
    if (value === 'tab') return 'tab'
    return Number(value) as 2 | 4
  }

  const handleExecute = () => {
    setError(null)
    setOutput('')
    setSuccess(null)

    const currentAction = action()
    const currentInput = input()
    const currentIndent = indent()

    if (currentAction === 'format') {
      const validation = validateToml(currentInput)
      if (!validation.ok) {
        setError(translateError(props.lang, validation.error))
        return
      }
      const result = formatToml(currentInput, currentIndent)
      if (result.ok) {
        setOutput(result.value)
        setSuccess(t(props.lang, 'tools_tomlFormatter_valid'))
      } else {
        setError(translateError(props.lang, result.error))
      }
    } else if (currentAction === 'minify') {
      const result = minifyTomlStr(currentInput)
      if (result.ok) {
        setOutput(result.value)
        setSuccess(t(props.lang, 'tools_tomlFormatter_minified'))
      } else {
        setError(translateError(props.lang, result.error))
      }
    } else if (currentAction === 'toml-to-json') {
      const result = tomlToJson(currentInput)
      if (result.ok) {
        setOutput(result.value)
        setSuccess(t(props.lang, 'tools_tomlFormatter_converted'))
      } else {
        setError(translateError(props.lang, result.error))
      }
    } else if (currentAction === 'json-to-toml') {
      const result = jsonToToml(currentInput, currentIndent)
      if (result.ok) {
        setOutput(result.value)
        setSuccess(t(props.lang, 'tools_tomlFormatter_converted'))
      } else {
        setError(translateError(props.lang, result.error))
      }
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'tools_tomlFormatter_inputLabel')}
        placeholder={t(props.lang, 'tools_tomlFormatter_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        monospace
        rows={8}
      />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label={t(props.lang, 'tools_tomlFormatter_actionLabel')}
          options={actionOptions()}
          value={action()}
          onChange={(e) => setAction(e.currentTarget.value as TomlAction)}
        />
        <Select
          label={t(props.lang, 'tools_tomlFormatter_indentLabel')}
          options={indentOptions()}
          value={String(indent())}
          onChange={(e) => setIndent(parseIndent(e.currentTarget.value))}
        />
      </div>
      <Button variant="primary" onClick={handleExecute}>
        {t(props.lang, 'tools_tomlFormatter_execute')}
      </Button>

      {error() && <StatusMessage type="error" message={error()!} />}
      {!error() && success() && (
        <StatusMessage type="success" message={success()!} />
      )}

      <OutputPanel
        value={output()}
        label={t(props.lang, 'tools_tomlFormatter_outputLabel')}
        monospace
        rows={10}
      />
    </div>
  )
}
