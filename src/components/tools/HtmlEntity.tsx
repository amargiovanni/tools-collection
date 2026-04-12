import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { encodeHtmlEntities, decodeHtmlEntities } from '../../tools/html-entity'
import type { EncodeOptions } from '../../tools/html-entity'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function HtmlEntity(props: Props) {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [mode, setMode] = createSignal<EncodeOptions['mode']>('minimal')

  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      if (typeof saved['mode'] === 'string' && ['minimal', 'all'].includes(saved['mode'])) setMode(saved['mode'] as EncodeOptions['mode'])
    },
    getState: () => ({ input: input(), mode: mode() }),
  })

  const handleAction = (action: 'encode' | 'decode') => {
    setError(null)
    setOutput('')

    const result = action === 'encode'
      ? encodeHtmlEntities(input(), { mode: mode() })
      : decodeHtmlEntities(input())

    if (result.ok) {
      setOutput(result.value)
    } else {
      setError(translateError(props.lang, result.error))
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'common_inputText')}
        placeholder={t(props.lang, 'tools_htmlEntity_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <div class="flex flex-wrap items-center gap-2">
        <label class="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="radio"
            name="encode-mode"
            value="minimal"
            checked={mode() === 'minimal'}
            onChange={() => setMode('minimal')}
          />
          {t(props.lang, 'tools_htmlEntity_modeMinimal')}
        </label>
        <label class="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="radio"
            name="encode-mode"
            value="all"
            checked={mode() === 'all'}
            onChange={() => setMode('all')}
          />
          {t(props.lang, 'tools_htmlEntity_modeAll')}
        </label>
      </div>
      <div class="flex gap-2">
        <Button variant="primary" onClick={() => handleAction('encode')}>
          {t(props.lang, 'tools_htmlEntity_encode')}
        </Button>
        <Button variant="secondary" onClick={() => handleAction('decode')}>
          {t(props.lang, 'tools_htmlEntity_decode')}
        </Button>
      </div>

      {error() && <StatusMessage type="error" message={error()!} />}

      <OutputPanel value={output()} label={t(props.lang, 'common_result')} />
    </div>
  )
}
