import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { generateSalts, type SaltFormat, type SaltSize } from '../../tools/salt-generator'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function SaltGenerator(props: Props) {
  const [size, setSize] = createSignal<SaltSize>(16)
  const [count, setCount] = createSignal(5)
  const [format, setFormat] = createSignal<SaltFormat>('base64url')
  const [output, setOutput] = createSignal('')

  useToolState({
    onRestore(saved) {
      if (saved['size'] === 8 || saved['size'] === 16 || saved['size'] === 24 || saved['size'] === 32) {
        setSize(saved['size'])
      }
      if (typeof saved['count'] === 'number') setCount(saved['count'])
      if (saved['format'] === 'hex' || saved['format'] === 'base64' || saved['format'] === 'base64url') {
        setFormat(saved['format'])
      }
    },
    getState: () => ({ size: size(), count: count(), format: format() }),
  })

  const handleGenerate = () => {
    const result = generateSalts({
      size: size(),
      count: count(),
      format: format(),
    })
    if (result.ok) setOutput(result.value.join('\n'))
  }

  return (
    <div class="flex flex-col gap-4">
      <Select
        label={t(props.lang, 'tools_saltGenerator_sizeLabel')}
        value={String(size())}
        onChange={(e) => setSize(parseInt(e.currentTarget.value, 10) as SaltSize)}
        options={[
          { value: '8', label: t(props.lang, 'tools_saltGenerator_size8') },
          { value: '16', label: t(props.lang, 'tools_saltGenerator_size16') },
          { value: '24', label: t(props.lang, 'tools_saltGenerator_size24') },
          { value: '32', label: t(props.lang, 'tools_saltGenerator_size32') },
        ]}
      />
      <Input
        type="number"
        label={t(props.lang, 'tools_saltGenerator_countLabel')}
        value={count()}
        min={1}
        max={20}
        onInput={(e) => setCount(parseInt(e.currentTarget.value) || 1)}
      />
      <Select
        label={t(props.lang, 'tools_saltGenerator_formatLabel')}
        value={format()}
        onChange={(e) => setFormat(e.currentTarget.value as SaltFormat)}
        options={[
          { value: 'base64url', label: t(props.lang, 'tools_saltGenerator_formatBase64Url') },
          { value: 'base64', label: t(props.lang, 'tools_saltGenerator_formatBase64') },
          { value: 'hex', label: t(props.lang, 'tools_saltGenerator_formatHex') },
        ]}
      />
      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_saltGenerator_generate')}
      </Button>
      <OutputPanel value={output()} label={t(props.lang, 'tools_saltGenerator_outputLabel')} />
    </div>
  )
}
