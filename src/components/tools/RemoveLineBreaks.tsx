import { createSignal, Show } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { removeLineBreaks } from '../../tools/remove-line-breaks'
import type { BreakReplacement } from '../../tools/remove-line-breaks'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function RemoveLineBreaks(props: Props) {
  const [input, setInput] = createSignal('')
  const [replaceType, setReplaceType] = createSignal<'space' | 'none' | 'custom'>('space')
  const [customValue, setCustomValue] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  const replaceOptions = () => [
    { value: 'space', label: t(props.lang, 'tools_removeLineBreaks_space') },
    { value: 'none', label: t(props.lang, 'tools_removeLineBreaks_nothing') },
    { value: 'custom', label: t(props.lang, 'tools_removeLineBreaks_custom') },
  ]

  const handleRemove = () => {
    let replacement: BreakReplacement
    switch (replaceType()) {
      case 'space':
        replacement = { type: 'space' }
        break
      case 'none':
        replacement = { type: 'none' }
        break
      case 'custom':
        replacement = { type: 'custom', value: customValue() }
        break
    }

    const result = removeLineBreaks(input(), replacement)
    if (result.ok) {
      setOutput(result.value)
      setError(null)
    } else {
      const errorMsg = (() => {
        const key = `errors_${result.error.code}` as any
        try { return t(props.lang, key) } catch { return result.error.message }
      })()
      setError(errorMsg)
      setOutput('')
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'common_inputText')}
        placeholder={t(props.lang, 'tools_removeLineBreaks_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <Select
        label={t(props.lang, 'tools_removeLineBreaks_replaceWith')}
        options={replaceOptions()}
        value={replaceType()}
        onChange={(e) => setReplaceType(e.currentTarget.value as 'space' | 'none' | 'custom')}
      />
      <Show when={replaceType() === 'custom'}>
        <Input
          label={t(props.lang, 'tools_removeLineBreaks_custom')}
          value={customValue()}
          onInput={(e) => setCustomValue(e.currentTarget.value)}
        />
      </Show>
      <Button variant="primary" onClick={handleRemove}>
        {t(props.lang, 'tools_removeLineBreaks_action')}
      </Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} label={t(props.lang, 'common_result')} />
    </div>
  )
}
