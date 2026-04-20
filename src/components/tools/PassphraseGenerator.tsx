import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { generatePassphrases } from '../../tools/passphrase-generator'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function PassphraseGenerator(props: Props) {
  const [wordCount, setWordCount] = createSignal(4)
  const [count, setCount] = createSignal(5)
  const [separator, setSeparator] = createSignal('-')
  const [output, setOutput] = createSignal('')

  useToolState({
    onRestore(saved) {
      if (typeof saved['wordCount'] === 'number') setWordCount(saved['wordCount'])
      if (typeof saved['count'] === 'number') setCount(saved['count'])
      if (typeof saved['separator'] === 'string') setSeparator(saved['separator'])
    },
    getState: () => ({ wordCount: wordCount(), count: count(), separator: separator() }),
  })

  const handleGenerate = () => {
    const result = generatePassphrases(wordCount(), count(), separator())
    if (result.ok) setOutput(result.value.join('\n'))
  }

  return (
    <div class="flex flex-col gap-4">
      <Input
        type="number"
        label={t(props.lang, 'tools_passphraseGenerator_wordCountLabel')}
        value={wordCount()}
        min={2}
        max={8}
        onInput={(e) => setWordCount(parseInt(e.currentTarget.value) || 4)}
      />
      <Input
        type="number"
        label={t(props.lang, 'tools_passphraseGenerator_countLabel')}
        value={count()}
        min={1}
        max={20}
        onInput={(e) => setCount(parseInt(e.currentTarget.value) || 1)}
      />
      <Input
        label={t(props.lang, 'tools_passphraseGenerator_separatorLabel')}
        value={separator()}
        onInput={(e) => setSeparator(e.currentTarget.value)}
      />
      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_passphraseGenerator_generate')}
      </Button>
      <OutputPanel value={output()} label={t(props.lang, 'tools_passphraseGenerator_outputLabel')} />
    </div>
  )
}
