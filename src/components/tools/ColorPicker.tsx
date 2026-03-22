import { createSignal, Show, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { StatusMessage } from '../ui/StatusMessage'
import { ResultCard } from '../ui/ResultCard'
import { parseColor } from '../../tools/color-picker'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

interface ColorResult {
  hex: string
  rgb: string
  rgba: string
  hsl: string
}

export default function ColorPicker(props: Props) {
  const [colorInput, setColorInput] = createSignal('#3B82F6')
  const [pickerValue, setPickerValue] = createSignal('#3B82F6')
  const [result, setResult] = createSignal<ColorResult | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved.colorInput === 'string') {
        setColorInput(saved.colorInput)
        setPickerValue(saved.colorInput)
      }
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { colorInput: colorInput() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const handleConvert = (value?: string) => {
    const input = value ?? colorInput()
    const parsed = parseColor(input)
    if (parsed.ok) {
      const { hex, rgb, hsl } = parsed.value
      setResult({
        hex,
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
        hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      })
      setPickerValue(hex)
      setError(null)
    } else {
      setError(translateError(props.lang, parsed.error))
      setResult(null)
    }
  }

  const handlePickerChange = (e: Event) => {
    const hex = (e.target as HTMLInputElement).value
    setPickerValue(hex)
    setColorInput(hex)
    handleConvert(hex)
  }

  const cards = () => {
    const r = result()
    if (!r) return []
    return [
      { label: 'HEX', value: r.hex },
      { label: 'RGB', value: r.rgb },
      { label: 'RGBA', value: r.rgba },
      { label: 'HSL', value: r.hsl },
    ]
  }

  return (
    <div class="flex flex-col gap-4">
      <div class="flex items-end gap-3">
        <div class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-text-secondary">
            {t(props.lang, 'tools_colorPicker_preview')}
          </span>
          <input
            type="color"
            value={pickerValue()}
            onChange={handlePickerChange}
            class="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface-raised"
          />
        </div>
        <Input
          label={t(props.lang, 'tools_colorPicker_inputLabel')}
          placeholder={t(props.lang, 'tools_colorPicker_placeholder')}
          value={colorInput()}
          onInput={(e) => setColorInput(e.currentTarget.value)}
          class="flex-1"
        />
      </div>

      <Button variant="primary" onClick={() => handleConvert()}>
        {t(props.lang, 'tools_colorPicker_convert')}
      </Button>

      <Show when={error()}>
        <StatusMessage type="error" message={error()!} />
      </Show>

      <Show when={result()}>
        <div class="flex items-center gap-3">
          <div
            class="h-16 w-16 shrink-0 rounded-lg border border-border"
            style={{ "background-color": result()!.hex }}
          />
          <span class="text-sm font-medium text-text-secondary">
            {t(props.lang, 'tools_colorPicker_outputLabel')}
          </span>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          {cards().map((card) => (
            <ResultCard label={card.label} value={card.value} />
          ))}
        </div>
      </Show>
    </div>
  )
}
