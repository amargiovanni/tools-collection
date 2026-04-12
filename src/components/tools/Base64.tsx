import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { encodeBase64, decodeBase64 } from '../../tools/base64'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function Base64(props: Props) {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
    },
    getState: () => ({ input: input() }),
  })

  const handleAction = (action: 'encode' | 'decode') => {
    setError(null)
    setOutput('')

    const result = action === 'encode'
      ? encodeBase64(input())
      : decodeBase64(input())

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
        placeholder={t(props.lang, 'tools_base64_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <div class="flex gap-2">
        <Button variant="primary" onClick={() => handleAction('encode')}>
          {t(props.lang, 'tools_base64_encode')}
        </Button>
        <Button variant="secondary" onClick={() => handleAction('decode')}>
          {t(props.lang, 'tools_base64_decode')}
        </Button>
      </div>

      {error() && <StatusMessage type="error" message={error()!} />}

      <OutputPanel value={output()} label={t(props.lang, 'common_result')} />
    </div>
  )
}
