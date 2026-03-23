import { createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { TextArea } from '../ui/TextArea'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { removeDuplicateLines } from '../../tools/remove-duplicate-lines'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function RemoveDuplicateLines(props: Props) {
  const [input, setInput] = createSignal('')
  const [caseSensitive, setCaseSensitive] = createSignal(true)
  const [preserveOrder, setPreserveOrder] = createSignal(true)
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      if (typeof saved['caseSensitive'] === 'boolean') setCaseSensitive(saved['caseSensitive'])
      if (typeof saved['preserveOrder'] === 'boolean') setPreserveOrder(saved['preserveOrder'])
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input(), caseSensitive: caseSensitive(), preserveOrder: preserveOrder() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const handleRemove = () => {
    const result = removeDuplicateLines(input(), {
      caseSensitive: caseSensitive(),
      preserveOrder: preserveOrder(),
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
      <TextArea
        label={t(props.lang, 'common_inputText')}
        placeholder={t(props.lang, 'tools_removeDuplicateLines_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <div class="flex flex-wrap gap-4">
        <Checkbox
          label={t(props.lang, 'common_caseSensitive')}
          checked={caseSensitive()}
          onChange={(e) => setCaseSensitive(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_removeDuplicateLines_preserveOrder')}
          checked={preserveOrder()}
          onChange={(e) => setPreserveOrder(e.currentTarget.checked)}
        />
      </div>
      <Button variant="primary" onClick={handleRemove}>
        {t(props.lang, 'tools_removeDuplicateLines_action')}
      </Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} label={t(props.lang, 'common_result')} />
    </div>
  )
}
