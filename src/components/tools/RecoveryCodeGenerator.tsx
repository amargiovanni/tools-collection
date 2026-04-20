import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { generateRecoveryCodes } from '../../tools/recovery-code-generator'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function RecoveryCodeGenerator(props: Props) {
  const [count, setCount] = createSignal(10)
  const [length, setLength] = createSignal(10)
  const [groupSize, setGroupSize] = createSignal(5)
  const [output, setOutput] = createSignal('')

  useToolState({
    onRestore(saved) {
      if (typeof saved['count'] === 'number') setCount(saved['count'])
      if (typeof saved['length'] === 'number') setLength(saved['length'])
      if (typeof saved['groupSize'] === 'number') setGroupSize(saved['groupSize'])
    },
    getState: () => ({ count: count(), length: length(), groupSize: groupSize() }),
  })

  const handleGenerate = () => {
    const result = generateRecoveryCodes(count(), length(), groupSize())
    if (result.ok) setOutput(result.value.join('\n'))
  }

  return (
    <div class="flex flex-col gap-4">
      <Input
        type="number"
        label={t(props.lang, 'tools_recoveryCodeGenerator_countLabel')}
        value={count()}
        min={1}
        max={20}
        onInput={(e) => setCount(parseInt(e.currentTarget.value) || 1)}
      />
      <Input
        type="number"
        label={t(props.lang, 'tools_recoveryCodeGenerator_lengthLabel')}
        value={length()}
        min={6}
        max={32}
        onInput={(e) => setLength(parseInt(e.currentTarget.value) || 10)}
      />
      <Input
        type="number"
        label={t(props.lang, 'tools_recoveryCodeGenerator_groupLabel')}
        value={groupSize()}
        min={2}
        max={8}
        onInput={(e) => setGroupSize(parseInt(e.currentTarget.value) || 4)}
      />
      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_recoveryCodeGenerator_generate')}
      </Button>
      <OutputPanel value={output()} label={t(props.lang, 'tools_recoveryCodeGenerator_outputLabel')} />
    </div>
  )
}
