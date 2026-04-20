import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { generateApiKeys, type ApiKeyFormat } from '../../tools/api-key-generator'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function ApiKeyGenerator(props: Props) {
  const [prefix, setPrefix] = createSignal('sk_live_')
  const [length, setLength] = createSignal(32)
  const [count, setCount] = createSignal(3)
  const [format, setFormat] = createSignal<ApiKeyFormat>('alnum')
  const [output, setOutput] = createSignal('')

  useToolState({
    onRestore(saved) {
      if (typeof saved['prefix'] === 'string') setPrefix(saved['prefix'])
      if (typeof saved['length'] === 'number') setLength(saved['length'])
      if (typeof saved['count'] === 'number') setCount(saved['count'])
      if (saved['format'] === 'alnum' || saved['format'] === 'base64url' || saved['format'] === 'hex') {
        setFormat(saved['format'])
      }
    },
    getState: () => ({ prefix: prefix(), length: length(), count: count(), format: format() }),
  })

  const handleGenerate = () => {
    const result = generateApiKeys({
      prefix: prefix(),
      length: length(),
      count: count(),
      format: format(),
    })
    if (result.ok) {
      setOutput(result.value.join('\n'))
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <Input
        label={t(props.lang, 'tools_apiKeyGenerator_prefixLabel')}
        value={prefix()}
        onInput={(e) => setPrefix(e.currentTarget.value)}
      />
      <Input
        type="number"
        label={t(props.lang, 'tools_apiKeyGenerator_lengthLabel')}
        value={length()}
        min={8}
        max={128}
        onInput={(e) => setLength(parseInt(e.currentTarget.value) || 8)}
      />
      <Input
        type="number"
        label={t(props.lang, 'tools_apiKeyGenerator_countLabel')}
        value={count()}
        min={1}
        max={20}
        onInput={(e) => setCount(parseInt(e.currentTarget.value) || 1)}
      />
      <Select
        label={t(props.lang, 'tools_apiKeyGenerator_formatLabel')}
        value={format()}
        onChange={(e) => setFormat(e.currentTarget.value as ApiKeyFormat)}
        options={[
          { value: 'alnum', label: t(props.lang, 'tools_apiKeyGenerator_formatAlnum') },
          { value: 'base64url', label: t(props.lang, 'tools_apiKeyGenerator_formatBase64Url') },
          { value: 'hex', label: t(props.lang, 'tools_apiKeyGenerator_formatHex') },
        ]}
      />
      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_apiKeyGenerator_generate')}
      </Button>
      <OutputPanel value={output()} label={t(props.lang, 'tools_apiKeyGenerator_outputLabel')} />
    </div>
  )
}
