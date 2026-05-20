import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { TextArea } from '../ui/TextArea'
import { Select } from '../ui/Select'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { sortText } from '../../tools/sort-text'
import type { SortMethod } from '../../tools/sort-text'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function SortText(props: Props) {
  const [input, setInput] = createSignal('')
  const [method, setMethod] = createSignal<SortMethod>('alpha-asc')
  const [caseSensitive, setCaseSensitive] = createSignal(false)
  const [trimLines, setTrimLines] = createSignal(false)
  const [removeEmpty, setRemoveEmpty] = createSignal(false)
  const [removeDuplicates, setRemoveDuplicates] = createSignal(false)
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      if (typeof saved['method'] === 'string') setMethod(saved['method'] as SortMethod)
      if (typeof saved['caseSensitive'] === 'boolean') setCaseSensitive(saved['caseSensitive'])
      if (typeof saved['trimLines'] === 'boolean') setTrimLines(saved['trimLines'])
      if (typeof saved['removeEmpty'] === 'boolean') setRemoveEmpty(saved['removeEmpty'])
      if (typeof saved['removeDuplicates'] === 'boolean') setRemoveDuplicates(saved['removeDuplicates'])
    },
    getState: () => ({
      input: input(),
      method: method(),
      caseSensitive: caseSensitive(),
      trimLines: trimLines(),
      removeEmpty: removeEmpty(),
      removeDuplicates: removeDuplicates(),
    }),
  })

  const methodOptions = () => [
    { value: 'alpha-asc', label: t(props.lang, 'tools_sortText_methodAlphaAsc') },
    { value: 'alpha-desc', label: t(props.lang, 'tools_sortText_methodAlphaDesc') },
    { value: 'length-asc', label: t(props.lang, 'tools_sortText_methodLengthAsc') },
    { value: 'length-desc', label: t(props.lang, 'tools_sortText_methodLengthDesc') },
    { value: 'numeric', label: t(props.lang, 'tools_sortText_methodNumeric') },
    { value: 'reverse', label: t(props.lang, 'tools_sortText_methodReverse') },
    { value: 'random', label: t(props.lang, 'tools_sortText_methodRandom') },
  ]

  const handleSort = () => {
    const result = sortText(input(), {
      method: method(),
      caseSensitive: caseSensitive(),
      trimLines: trimLines(),
      removeEmpty: removeEmpty(),
      removeDuplicates: removeDuplicates(),
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
        placeholder={t(props.lang, 'tools_sortText_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />

      <Select
        label={t(props.lang, 'tools_sortText_methodLabel')}
        options={methodOptions()}
        value={method()}
        onChange={(e) => setMethod(e.currentTarget.value as SortMethod)}
      />

      <div class="flex flex-wrap gap-4">
        <Checkbox
          label={t(props.lang, 'common_caseSensitive')}
          checked={caseSensitive()}
          onChange={(e) => setCaseSensitive(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_sortText_trimLines')}
          checked={trimLines()}
          onChange={(e) => setTrimLines(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_sortText_removeEmpty')}
          checked={removeEmpty()}
          onChange={(e) => setRemoveEmpty(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_sortText_removeDuplicates')}
          checked={removeDuplicates()}
          onChange={(e) => setRemoveDuplicates(e.currentTarget.checked)}
        />
      </div>

      <Button variant="primary" onClick={handleSort}>
        {t(props.lang, 'tools_sortText_action')}
      </Button>

      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} label={t(props.lang, 'common_result')} />
    </div>
  )
}
