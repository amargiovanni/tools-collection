import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { generateJwtSecrets, type JwtSecretFormat, type JwtSecretSize } from '../../tools/jwt-secret-generator'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function JwtSecretGenerator(props: Props) {
  const [size, setSize] = createSignal<JwtSecretSize>(32)
  const [count, setCount] = createSignal(3)
  const [format, setFormat] = createSignal<JwtSecretFormat>('base64url')
  const [output, setOutput] = createSignal('')

  useToolState({
    onRestore(saved) {
      if (saved['size'] === 16 || saved['size'] === 24 || saved['size'] === 32 || saved['size'] === 48 || saved['size'] === 64) {
        setSize(saved['size'])
      }
      if (typeof saved['count'] === 'number') setCount(saved['count'])
      if (saved['format'] === 'hex' || saved['format'] === 'base64url') {
        setFormat(saved['format'])
      }
    },
    getState: () => ({ size: size(), count: count(), format: format() }),
  })

  const handleGenerate = () => {
    const result = generateJwtSecrets({
      size: size(),
      count: count(),
      format: format(),
    })
    if (result.ok) setOutput(result.value.join('\n'))
  }

  return (
    <div class="flex flex-col gap-4">
      <Select
        label={t(props.lang, 'tools_jwtSecretGenerator_sizeLabel')}
        value={String(size())}
        onChange={(e) => setSize(parseInt(e.currentTarget.value, 10) as JwtSecretSize)}
        options={[
          { value: '16', label: t(props.lang, 'tools_jwtSecretGenerator_size16') },
          { value: '24', label: t(props.lang, 'tools_jwtSecretGenerator_size24') },
          { value: '32', label: t(props.lang, 'tools_jwtSecretGenerator_size32') },
          { value: '48', label: t(props.lang, 'tools_jwtSecretGenerator_size48') },
          { value: '64', label: t(props.lang, 'tools_jwtSecretGenerator_size64') },
        ]}
      />
      <Input
        type="number"
        label={t(props.lang, 'tools_jwtSecretGenerator_countLabel')}
        value={count()}
        min={1}
        max={20}
        onInput={(e) => setCount(parseInt(e.currentTarget.value) || 1)}
      />
      <Select
        label={t(props.lang, 'tools_jwtSecretGenerator_formatLabel')}
        value={format()}
        onChange={(e) => setFormat(e.currentTarget.value as JwtSecretFormat)}
        options={[
          { value: 'base64url', label: t(props.lang, 'tools_jwtSecretGenerator_formatBase64Url') },
          { value: 'hex', label: t(props.lang, 'tools_jwtSecretGenerator_formatHex') },
        ]}
      />
      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_jwtSecretGenerator_generate')}
      </Button>
      <OutputPanel value={output()} label={t(props.lang, 'tools_jwtSecretGenerator_outputLabel')} />
    </div>
  )
}
