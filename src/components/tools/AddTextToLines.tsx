import { createSignal, createEffect, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { TextArea } from '../ui/TextArea'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { addTextToLines } from '../../tools/add-text-to-lines'
import type { Position } from '../../tools/add-text-to-lines'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function AddTextToLines(props: Props) {
  const [input, setInput] = createSignal('')
  const [addition, setAddition] = createSignal('')
  const [position, setPosition] = createSignal<Position>('start')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      if (typeof saved['addition'] === 'string') setAddition(saved['addition'])
      if (saved['position'] === 'start' || saved['position'] === 'end') setPosition(saved['position'])
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input(), addition: addition(), position: position() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const updateOutput = () => {
    if (input() === '') {
      setOutput('')
      setError(null)
      return
    }
    const result = addTextToLines(input(), addition(), position())
    if (result.ok) {
      setOutput(result.value)
      setError(null)
    } else {
      setError(translateError(props.lang, result.error))
      setOutput('')
    }
  }

  createEffect(updateOutput)

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'tools_addTextToLines_originalText')}
        placeholder={t(props.lang, 'common_inputPlaceholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <Input
        label={t(props.lang, 'tools_addTextToLines_textToAdd')}
        placeholder={t(props.lang, 'tools_addTextToLines_additionPlaceholder')}
        value={addition()}
        onInput={(e) => setAddition(e.currentTarget.value)}
      />
      <div class="flex gap-2">
        <Button
          variant={position() === 'start' ? 'primary' : 'secondary'}
          onClick={() => setPosition('start')}
        >
          {t(props.lang, 'tools_addTextToLines_positionStart')}
        </Button>
        <Button
          variant={position() === 'end' ? 'primary' : 'secondary'}
          onClick={() => setPosition('end')}
        >
          {t(props.lang, 'tools_addTextToLines_positionEnd')}
        </Button>
      </div>
      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} label={t(props.lang, 'common_result')} />
    </div>
  )
}
