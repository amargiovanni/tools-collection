import { createSignal, createEffect } from 'solid-js'
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
