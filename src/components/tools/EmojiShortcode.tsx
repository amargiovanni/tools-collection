import { createSignal } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { toEmoji, toShortcode } from '../../tools/emoji-shortcode'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function EmojiShortcode(props: Props) {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  const handleConvert = (direction: 'toEmoji' | 'toShortcode') => {
    setError(null)
    setOutput('')

    const result = direction === 'toEmoji'
      ? toEmoji(input())
      : toShortcode(input())

    if (result.ok) {
      setOutput(result.value)
    } else {
      setError(result.error.message)
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
