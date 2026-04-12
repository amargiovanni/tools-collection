import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
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

  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      if (typeof saved['includeSubdomains'] === 'boolean') setIncludeSubdomains(saved['includeSubdomains'])
    },
    getState: () => ({ input: input(), includeSubdomains: includeSubdomains() }),
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
