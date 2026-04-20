import { createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { generateRandomStrings } from '../../tools/random-string-generator'
import { ALNUM_ALPHABET, BASE64URL_ALPHABET, HEX_ALPHABET, SAFE_ALPHABET, SYMBOL_ALPHABET } from '../../tools/random-secrets'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

type CharsetPreset = 'alnum' | 'base64url' | 'hex' | 'safe' | 'symbols'

const ALPHABETS: Record<CharsetPreset, string> = {
  alnum: ALNUM_ALPHABET,
  base64url: BASE64URL_ALPHABET,
  hex: HEX_ALPHABET,
  safe: SAFE_ALPHABET,
  symbols: `${ALNUM_ALPHABET}${SYMBOL_ALPHABET}`,
}

export default function RandomStringGenerator(props: Props) {
  const [length, setLength] = createSignal(24)
  const [count, setCount] = createSignal(5)
  const [charset, setCharset] = createSignal<CharsetPreset>('alnum')
  const [output, setOutput] = createSignal('')

  useToolState({
    onRestore(saved) {
      if (typeof saved['length'] === 'number') setLength(saved['length'])
      if (typeof saved['count'] === 'number') setCount(saved['count'])
      if (saved['charset'] === 'alnum' || saved['charset'] === 'base64url' || saved['charset'] === 'hex' || saved['charset'] === 'safe' || saved['charset'] === 'symbols') {
        setCharset(saved['charset'])
      }
    },
    getState: () => ({ length: length(), count: count(), charset: charset() }),
  })

  const handleGenerate = () => {
    const result = generateRandomStrings(length(), count(), ALPHABETS[charset()])
    if (result.ok) setOutput(result.value.join('\n'))
  }

  return (
    <div class="flex flex-col gap-4">
      <Input
        type="number"
        label={t(props.lang, 'tools_randomStringGenerator_lengthLabel')}
        value={length()}
        min={4}
        max={128}
        onInput={(e) => setLength(parseInt(e.currentTarget.value) || 24)}
      />
      <Input
        type="number"
        label={t(props.lang, 'tools_randomStringGenerator_countLabel')}
        value={count()}
        min={1}
        max={20}
        onInput={(e) => setCount(parseInt(e.currentTarget.value) || 1)}
      />
      <Select
        label={t(props.lang, 'tools_randomStringGenerator_charsetLabel')}
        value={charset()}
        onChange={(e) => setCharset(e.currentTarget.value as CharsetPreset)}
        options={[
          { value: 'alnum', label: t(props.lang, 'tools_randomStringGenerator_charsetAlnum') },
          { value: 'base64url', label: t(props.lang, 'tools_randomStringGenerator_charsetBase64Url') },
          { value: 'hex', label: t(props.lang, 'tools_randomStringGenerator_charsetHex') },
          { value: 'safe', label: t(props.lang, 'tools_randomStringGenerator_charsetSafe') },
          { value: 'symbols', label: t(props.lang, 'tools_randomStringGenerator_charsetSymbols') },
        ]}
      />
      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_randomStringGenerator_generate')}
      </Button>
      <OutputPanel value={output()} label={t(props.lang, 'tools_randomStringGenerator_outputLabel')} />
    </div>
  )
}
