import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { generateUsernames } from '../../tools/username-generator'
import type { UsernameStyle } from '../../tools/username-generator'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function UsernameGenerator(props: Props) {
  const [style, setStyle] = createSignal<UsernameStyle>('random')
  const [count, setCount] = createSignal(10)
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  useToolState({
    onRestore(saved) {
      if (typeof saved['style'] === 'string') setStyle(saved['style'] as UsernameStyle)
      if (typeof saved['count'] === 'number') setCount(saved['count'])
    },
    getState: () => ({ style: style(), count: count() }),
  })

  const styleOptions = () => [
    { value: 'random', label: t(props.lang, 'tools_usernameGenerator_styleRandom') },
    { value: 'tech', label: t(props.lang, 'tools_usernameGenerator_styleTech') },
    { value: 'fantasy', label: t(props.lang, 'tools_usernameGenerator_styleFantasy') },
    { value: 'cool', label: t(props.lang, 'tools_usernameGenerator_styleCool') },
  ]

  const handleGenerate = () => {
    const result = generateUsernames(style(), count())
    if (result.ok) {
      setOutput(result.value.join('\n'))
      setError(null)
    } else {
      setError(translateError(props.lang, result.error))
      setOutput('')
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <Select
        label={t(props.lang, 'tools_usernameGenerator_style')}
        options={styleOptions()}
        value={style()}
        onChange={(e) => setStyle(e.currentTarget.value as UsernameStyle)}
      />
      <Input
        type="number"
        label={t(props.lang, 'tools_usernameGenerator_count')}
        value={count()}
        min={1}
        max={50}
        onInput={(e) => setCount(parseInt(e.currentTarget.value) || 1)}
      />
      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_usernameGenerator_generate')}
      </Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      <OutputPanel value={output()} label={t(props.lang, 'tools_usernameGenerator_outputLabel')} />
    </div>
  )
}
