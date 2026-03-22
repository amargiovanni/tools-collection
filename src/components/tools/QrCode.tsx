import { createSignal, Show, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { TextArea } from '../ui/TextArea'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { FileInput } from '../ui/FileInput'
import { DownloadButton } from '../ui/DownloadButton'
import { StatusMessage } from '../ui/StatusMessage'
import { OutputPanel } from '../ui/OutputPanel'
import { generateQrUrl, isBarcodeDetectorAvailable } from '../../tools/qr-code'
import type { QrSize } from '../../tools/qr-code'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

const sizeOptions = [
  { value: '200', label: '200x200' },
  { value: '300', label: '300x300' },
  { value: '400', label: '400x400' },
] as const

export default function QrCode(props: Props) {
  const [text, setText] = createSignal('')
  const [size, setSize] = createSignal<QrSize>(300)
  const [qrImage, setQrImage] = createSignal<string | null>(null)
  const [decodedText, setDecodedText] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [readError, setReadError] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(false)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['text'] === 'string') setText(saved['text'])
      if (typeof saved['size'] === 'number') setSize(saved['size'] as QrSize)
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { text: text(), size: size() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const handleGenerate = () => {
    setLoading(true)
    setError(null)
    setQrImage(null)

    const result = generateQrUrl({ text: text(), size: size() })
    if (result.ok) {
      setQrImage(result.value)
    } else {
      setError(translateError(props.lang, result.error))
    }
    setLoading(false)
  }

  const handleFileRead = async (file: File) => {
    setReadError(null)
    setDecodedText('')

    if (!isBarcodeDetectorAvailable()) {
      setReadError(t(props.lang, 'tools_qrCode_barcodeUnsupported'))
      return
    }

    try {
      const bitmap = await createImageBitmap(file)
      const detector = new (globalThis as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect(source: ImageBitmapSource): Promise<{ rawValue: string }[]> } }).BarcodeDetector({ formats: ['qr_code'] })
      const barcodes = await detector.detect(bitmap)

      if (barcodes.length === 0) {
        setReadError(t(props.lang, 'tools_qrCode_noQrFound'))
        return
      }

      setDecodedText(barcodes[0]!.rawValue)
    } catch {
      setReadError(t(props.lang, 'tools_qrCode_readError'))
    }
  }

  return (
    <div class="flex flex-col gap-4">
      {/* QR Generation */}
      <TextArea
        label={t(props.lang, 'tools_qrCode_inputLabel')}
        placeholder={t(props.lang, 'tools_qrCode_placeholder')}
        value={text()}
        onInput={(e) => setText(e.currentTarget.value)}
        rows={3}
      />
      <Select
        label={t(props.lang, 'tools_qrCode_sizeLabel')}
        options={[...sizeOptions]}
        value={String(size())}
        onChange={(e) => setSize(Number(e.currentTarget.value) as QrSize)}
      />
      <Button variant="primary" onClick={handleGenerate} disabled={loading()}>
        {loading() ? '...' : t(props.lang, 'tools_qrCode_generate')}
      </Button>

      {error() && <StatusMessage type="error" message={error()!} />}

      <Show when={qrImage()}>
        {(src) => (
          <div class="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface-raised p-4">
            <img src={src()} alt="QR Code" class="rounded" width={size()} height={size()} />
            <DownloadButton
              getData={() => src()}
              filename="qrcode.png"
              label={t(props.lang, 'tools_qrCode_download')}
            />
          </div>
        )}
      </Show>

      {/* QR Reading */}
      <div class="border-t border-border pt-4">
        <FileInput
          label={t(props.lang, 'tools_qrCode_uploadLabel')}
          accept="image/*"
          onFile={handleFileRead}
        />
      </div>

      {readError() && <StatusMessage type="error" message={readError()!} />}

      <Show when={decodedText()}>
        <OutputPanel
          label={t(props.lang, 'tools_qrCode_decodedLabel')}
          value={decodedText()}
          rows={3}
        />
      </Show>
    </div>
  )
}
