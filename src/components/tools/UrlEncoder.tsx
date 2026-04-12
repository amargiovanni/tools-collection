import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { encodeUrl, decodeUrl } from '../../tools/url-encoder'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function UrlEncoder(props: Props) {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
    },
    getState: () => ({ input: input() }),
  })

  const handleAction = (action: 'encodeFull' | 'decode' | 'encodeComponent') => {
    setError(null)
    setOutput('')

    const result = action === 'decode'
      ? decodeUrl(input())
      : encodeUrl(input(), action === 'encodeComponent' ? 'component' : 'full')

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
        placeholder={t(props.lang, 'tools_urlEncoder_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <div class="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => handleAction('encodeFull')}>
          {t(props.lang, 'tools_urlEncoder_encode')}
        </Button>
        <Button variant="secondary" onClick={() => handleAction('decode')}>
          {t(props.lang, 'tools_urlEncoder_decode')}
        </Button>
        <Button variant="secondary" onClick={() => handleAction('encodeComponent')}>
          {t(props.lang, 'tools_urlEncoder_encodeComponent')}
        </Button>
      </div>

      {error() && <StatusMessage type="error" message={error()!} />}

      <OutputPanel value={output()} label={t(props.lang, 'common_result')} />
    </div>
  )
}
