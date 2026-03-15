import { createSignal } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { Badge } from '../ui/Badge'
import { extractEmails } from '../../tools/email-extractor'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function EmailExtractor(props: Props) {
  const [input, setInput] = createSignal('')
  const [removeDuplicates, setRemoveDuplicates] = createSignal(true)
  const [output, setOutput] = createSignal('')
  const [count, setCount] = createSignal(0)
  const [error, setError] = createSignal<string | null>(null)

  const handleExtract = () => {
    const result = extractEmails(input(), removeDuplicates())
    if (result.ok) {
      setOutput(result.value.join('\n'))
      setCount(result.value.length)
      setError(null)
    } else {
      setError(translateError(props.lang, result.error))
      setOutput('')
      setCount(0)
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'common_inputText')}
        placeholder={t(props.lang, 'tools_emailExtractor_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <Checkbox
        label={t(props.lang, 'tools_emailExtractor_removeDuplicates')}
        checked={removeDuplicates()}
        onChange={(e) => setRemoveDuplicates(e.currentTarget.checked)}
      />
      <Button variant="primary" onClick={handleExtract}>
        {t(props.lang, 'tools_emailExtractor_extract')}
      </Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      {count() > 0 && (
        <Badge variant="info" text={`${t(props.lang, 'tools_emailExtractor_found')}: ${count()}`} />
      )}
      <OutputPanel value={output()} label={t(props.lang, 'tools_emailExtractor_outputLabel')} />
    </div>
  )
}
