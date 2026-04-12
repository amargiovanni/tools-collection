import { createSignal, createEffect } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { TextArea } from '../ui/TextArea'
import { Select } from '../ui/Select'
import { Checkbox } from '../ui/Checkbox'
import { Input } from '../ui/Input'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { generateSlug } from '../../tools/slug-generator'
import type { SeparatorType } from '../../tools/slug-generator'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function SlugGenerator(props: Props) {
  const [input, setInput] = createSignal('')
  const [separator, setSeparator] = createSignal<SeparatorType>('hyphen')
  const [lowercase, setLowercase] = createSignal(true)
  const [maxLength, setMaxLength] = createSignal(0)
  const [transliterate, setTransliterate] = createSignal(true)
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      if (typeof saved['separator'] === 'string' && ['hyphen', 'underscore', 'dot'].includes(saved['separator'])) {
        setSeparator(saved['separator'] as SeparatorType)
      }
      if (typeof saved['lowercase'] === 'boolean') setLowercase(saved['lowercase'])
      if (typeof saved['maxLength'] === 'number') setMaxLength(saved['maxLength'])
      if (typeof saved['transliterate'] === 'boolean') setTransliterate(saved['transliterate'])
    },
    getState: () => ({
      input: input(),
      separator: separator(),
      lowercase: lowercase(),
      maxLength: maxLength(),
      transliterate: transliterate(),
    }),
  })

  const separatorOptions = () => [
    { value: 'hyphen', label: t(props.lang, 'tools_slugGenerator_separatorHyphen') },
    { value: 'underscore', label: t(props.lang, 'tools_slugGenerator_separatorUnderscore') },
    { value: 'dot', label: t(props.lang, 'tools_slugGenerator_separatorDot') },
  ]

  // Live preview: regenerate slug whenever any input or option changes
  createEffect(() => {
    const text = input()
    if (text === '') {
      setOutput('')
      setError(null)
      return
    }
    const result = generateSlug(text, {
      separator: separator(),
      lowercase: lowercase(),
      maxLength: maxLength(),
      transliterate: transliterate(),
    })
    if (result.ok) {
      setOutput(result.value)
      setError(null)
    } else {
      setError(translateError(props.lang, result.error))
      setOutput('')
    }
  })

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'tools_slugGenerator_inputLabel')}
        placeholder={t(props.lang, 'tools_slugGenerator_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        rows={3}
      />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label={t(props.lang, 'tools_slugGenerator_separatorLabel')}
          options={separatorOptions()}
          value={separator()}
          onChange={(e) => setSeparator(e.currentTarget.value as SeparatorType)}
        />
        <Input
          type="number"
          label={t(props.lang, 'tools_slugGenerator_maxLengthLabel')}
          placeholder={t(props.lang, 'tools_slugGenerator_maxLengthPlaceholder')}
          value={maxLength()}
          min={0}
          onInput={(e) => setMaxLength(parseInt(e.currentTarget.value, 10) || 0)}
        />
      </div>
      <div class="flex flex-wrap gap-4">
        <Checkbox
          label={t(props.lang, 'tools_slugGenerator_lowercase')}
          checked={lowercase()}
          onChange={(e) => setLowercase(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_slugGenerator_transliterate')}
          checked={transliterate()}
          onChange={(e) => setTransliterate(e.currentTarget.checked)}
        />
      </div>
      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} label={t(props.lang, 'common_result')} />
    </div>
  )
}
