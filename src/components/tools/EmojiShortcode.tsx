import { createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { toEmoji, toShortcode } from '../../tools/emoji-shortcode'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function EmojiShortcode(props: Props) {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const handleConvert = (direction: 'toEmoji' | 'toShortcode') => {
    setError(null)
    setOutput('')

    const result = direction === 'toEmoji'
      ? toEmoji(input())
      : toShortcode(input())

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
        placeholder={t(props.lang, 'tools_emojiShortcode_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <div class="flex gap-2">
        <Button variant="primary" onClick={() => handleConvert('toEmoji')}>
          {t(props.lang, 'tools_emojiShortcode_toEmoji')}
        </Button>
        <Button variant="secondary" onClick={() => handleConvert('toShortcode')}>
          {t(props.lang, 'tools_emojiShortcode_toShortcode')}
        </Button>
      </div>

      {error() && <StatusMessage type="error" message={error()!} />}

      <OutputPanel value={output()} label={t(props.lang, 'common_result')} />
    </div>
  )
}
