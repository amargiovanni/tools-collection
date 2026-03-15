import { createSignal } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { Input } from '../ui/Input'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { Badge } from '../ui/Badge'
import { removeLinesContaining } from '../../tools/remove-lines-containing'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function RemoveLinesContaining(props: Props) {
  const [input, setInput] = createSignal('')
  const [termsInput, setTermsInput] = createSignal('')
  const [caseSensitive, setCaseSensitive] = createSignal(false)
  const [output, setOutput] = createSignal('')
  const [removed, setRemoved] = createSignal(0)
  const [kept, setKept] = createSignal(0)
  const [error, setError] = createSignal<string | null>(null)

  const handleRemove = () => {
    const terms = termsInput()
      .split(',')
      .map(term => term.trim())
      .filter(Boolean)

    const result = removeLinesContaining(input(), {
      terms,
      caseSensitive: caseSensitive(),
    })

    if (result.ok) {
      setOutput(result.value.output)
      setRemoved(result.value.removed)
      setKept(result.value.kept)
      setError(null)
    } else {
      const errorMsg = (() => {
        const key = `errors_${result.error.code}` as any
        try { return t(props.lang, key) } catch { return result.error.message }
      })()
      setError(errorMsg)
      setOutput('')
      setRemoved(0)
      setKept(0)
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'common_inputText')}
        placeholder={t(props.lang, 'common_inputPlaceholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <Input
        label={t(props.lang, 'tools_removeLinesContaining_termsLabel')}
        placeholder={t(props.lang, 'tools_removeLinesContaining_termsPlaceholder')}
        value={termsInput()}
        onInput={(e) => setTermsInput(e.currentTarget.value)}
      />
      <Checkbox
        label={t(props.lang, 'common_caseSensitive')}
        checked={caseSensitive()}
        onChange={(e) => setCaseSensitive(e.currentTarget.checked)}
      />
      <Button variant="primary" onClick={handleRemove}>
        {t(props.lang, 'tools_removeLinesContaining_action')}
      </Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      {(removed() > 0 || kept() > 0) && (
        <div class="flex gap-2">
          <Badge variant="error" text={`${t(props.lang, 'tools_removeLinesContaining_removedLines')}: ${removed()}`} />
          <Badge variant="success" text={`${t(props.lang, 'tools_removeLinesContaining_keptLines')}: ${kept()}`} />
        </div>
      )}
      <OutputPanel value={output()} label={t(props.lang, 'common_result')} />
    </div>
  )
}
