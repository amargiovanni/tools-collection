import { createSignal, onMount, onCleanup } from 'solid-js'
import { convertBase } from '../../tools/number-base-converter'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

type Base = 2 | 8 | 10 | 16

interface FieldConfig {
  base: Base
  labelKey: 'base_decimal' | 'base_hex' | 'base_binary' | 'base_octal'
  hintKey: 'base_decimalHint' | 'base_hexHint' | 'base_binaryHint' | 'base_octalHint'
  signal: () => string
  setSignal: (v: string) => void
}

export default function NumberBaseConverter(props: Props) {
  const [decimal, setDecimal] = createSignal('')
  const [hex, setHex] = createSignal('')
  const [binary, setBinary] = createSignal('')
  const [octal, setOctal] = createSignal('')
  const [errors, setErrors] = createSignal<Set<Base>>(new Set())

  const fields: FieldConfig[] = [
    { base: 10, labelKey: 'base_decimal', hintKey: 'base_decimalHint', signal: decimal, setSignal: setDecimal },
    { base: 16, labelKey: 'base_hex',     hintKey: 'base_hexHint',     signal: hex,     setSignal: setHex     },
    { base: 2,  labelKey: 'base_binary',  hintKey: 'base_binaryHint',  signal: binary,  setSignal: setBinary  },
    { base: 8,  labelKey: 'base_octal',   hintKey: 'base_octalHint',   signal: octal,   setSignal: setOctal   },
  ]

  const setterMap: Record<Base, (v: string) => void> = {
    10: setDecimal, 16: setHex, 2: setBinary, 8: setOctal,
  }

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['decimal'] === 'string' && saved['decimal']) {
        const result = convertBase(saved['decimal'], 10)
        if (result) {
          setDecimal(result.decimal)
          setHex(result.hex)
          setBinary(result.binary)
          setOctal(result.octal)
        }
      }
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { decimal: decimal() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const handleInput = (base: Base, value: string) => {
    setterMap[base](value)

    if (!value.trim()) {
      fields.forEach((f) => { if (f.base !== base) f.setSignal('') })
      setErrors(new Set<Base>())
      return
    }

    const result = convertBase(value, base)
    if (result) {
      setErrors(new Set<Base>())
      if (base !== 10) setDecimal(result.decimal)
      if (base !== 16) setHex(result.hex)
      if (base !== 2)  setBinary(result.binary)
      if (base !== 8)  setOctal(result.octal)
    } else {
      setErrors(new Set([base]))
    }
  }

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((field) => {
        const hasError = () => errors().has(field.base)
        return (
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-text-primary">
              {t(props.lang, field.labelKey)}
            </label>
            <input
              type="text"
              value={field.signal()}
              placeholder={t(props.lang, field.hintKey)}
              onInput={(e) => handleInput(field.base, e.currentTarget.value)}
              class={`w-full rounded-lg border px-3 py-2 font-mono text-sm bg-surface text-text-primary placeholder-text-muted transition-colors outline-none focus:ring-2 focus:ring-accent/30 ${
                hasError()
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-border focus:border-accent'
              }`}
            />
          </div>
        )
      })}
    </div>
  )
}
