import { createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { TextArea } from '../ui/TextArea'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { formatYaml, validateYaml, minifyYaml, yamlToJson, jsonToYaml } from '../../tools/yaml-formatter'
import type { YamlIndent } from '../../tools/yaml-formatter'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

type YamlAction = 'format' | 'minify' | 'yaml-to-json' | 'json-to-yaml'

interface Props {
  lang: Language
}

export default function YamlFormatter(props: Props) {
  const [input, setInput] = createSignal('')
  const [indent, setIndent] = createSignal<YamlIndent>(2)
  const [action, setAction] = createSignal<YamlAction>('format')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      const indentVal = saved['indent']
      if (indentVal === 2 || indentVal === 4 || indentVal === 8) {
        setIndent(indentVal)
      }
      const actionVal = saved['action']
      if (
        actionVal === 'format' ||
        actionVal === 'minify' ||
        actionVal === 'yaml-to-json' ||
        actionVal === 'json-to-yaml'
      ) {
        setAction(actionVal)
      }
    }
    const handler = () => {
      window.dispatchEvent(
        new CustomEvent(TOOL_STATE_RESPONSE, {
          detail: { state: { input: input(), indent: indent(), action: action() } },
        }),
      )
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const indentOptions = () => [
    { value: '2', label: t(props.lang, 'tools_yamlFormatter_indent2') },
    { value: '4', label: t(props.lang, 'tools_yamlFormatter_indent4') },
    { value: '8', label: t(props.lang, 'tools_yamlFormatter_indent8') },
  ]

  const actionOptions = () => [
    { value: 'format', label: t(props.lang, 'tools_yamlFormatter_actionFormat') },
    { value: 'minify', label: t(props.lang, 'tools_yamlFormatter_actionMinify') },
    { value: 'yaml-to-json', label: t(props.lang, 'tools_yamlFormatter_actionYamlToJson') },
    { value: 'json-to-yaml', label: t(props.lang, 'tools_yamlFormatter_actionJsonToYaml') },
  ]

  const parseIndent = (value: string): YamlIndent => {
    const n = Number(value)
    if (n === 4) return 4
    if (n === 8) return 8
    return 2
  }

  const handleExecute = () => {
    setError(null)
    setOutput('')

    const currentAction = action()

    if (currentAction === 'format') {
      const validation = validateYaml(input())
      if (!validation.ok) {
        setError(translateError(props.lang, validation.error))
        return
      }
      const result = formatYaml(input(), indent())
      if (result.ok) {
        setOutput(result.value)
      } else {
        setError(translateError(props.lang, result.error))
      }
    } else if (currentAction === 'minify') {
      const result = minifyYaml(input())
      if (result.ok) {
        setOutput(result.value)
      } else {
        setError(translateError(props.lang, result.error))
      }
    } else if (currentAction === 'yaml-to-json') {
      const result = yamlToJson(input())
      if (result.ok) {
        setOutput(result.value)
      } else {
        setError(translateError(props.lang, result.error))
      }
    } else if (currentAction === 'json-to-yaml') {
      const result = jsonToYaml(input(), indent())
      if (result.ok) {
        setOutput(result.value)
      } else {
        setError(translateError(props.lang, result.error))
      }
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'tools_yamlFormatter_inputLabel')}
        placeholder={t(props.lang, 'tools_yamlFormatter_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        monospace
        rows={8}
      />
      <Select
        label={t(props.lang, 'tools_yamlFormatter_actionLabel')}
        options={actionOptions()}
        value={action()}
        onChange={(e) => setAction(e.currentTarget.value as YamlAction)}
      />
      <Select
        label={t(props.lang, 'tools_yamlFormatter_indentLabel')}
        options={indentOptions()}
        value={String(indent())}
        onChange={(e) => setIndent(parseIndent(e.currentTarget.value))}
      />
      <Button variant="primary" onClick={handleExecute}>
        {t(props.lang, 'tools_yamlFormatter_execute')}
      </Button>

      {error() && <StatusMessage type="error" message={error()!} />}
      {!error() && output() && (
        <StatusMessage type="success" message={t(props.lang, 'tools_yamlFormatter_valid')} />
      )}

      <OutputPanel
        value={output()}
        label={t(props.lang, 'tools_yamlFormatter_outputLabel')}
        monospace
        rows={10}
      />
    </div>
  )
}
