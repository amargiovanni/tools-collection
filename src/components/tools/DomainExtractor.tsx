import { createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { TextArea } from '../ui/TextArea'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { extractDomains } from '../../tools/domain-extractor'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function DomainExtractor(props: Props) {
  const [input, setInput] = createSignal('')
  const [includeSubdomains, setIncludeSubdomains] = createSignal(false)
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      if (typeof saved['includeSubdomains'] === 'boolean') setIncludeSubdomains(saved['includeSubdomains'])
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input(), includeSubdomains: includeSubdomains() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const handleExtract = () => {
    const result = extractDomains(input(), includeSubdomains())
    if (result.ok) {
      setOutput(result.value.join('\n'))
      setError(null)
    } else {
      setError(translateError(props.lang, result.error))
      setOutput('')
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'tools_domainExtractor_inputLabel')}
        placeholder={t(props.lang, 'tools_domainExtractor_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <Checkbox
        label={t(props.lang, 'tools_domainExtractor_includeSubdomains')}
        checked={includeSubdomains()}
        onChange={(e) => setIncludeSubdomains(e.currentTarget.checked)}
      />
      <Button variant="primary" onClick={handleExtract}>
        {t(props.lang, 'tools_domainExtractor_extract')}
      </Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} label={t(props.lang, 'tools_domainExtractor_outputLabel')} />
    </div>
  )
}
