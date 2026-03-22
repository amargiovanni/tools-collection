import { createSignal, Show, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { TextArea } from '../ui/TextArea'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { FileInput } from '../ui/FileInput'
import { OutputPanel } from '../ui/OutputPanel'
import { DownloadButton } from '../ui/DownloadButton'
import { Badge } from '../ui/Badge'
import { StatusMessage } from '../ui/StatusMessage'
import { convertRegToGpo } from '../../tools/reg2gpo'
import type { GpoResult } from '../../tools/reg2gpo'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function Reg2Gpo(props: Props) {
  const [regContent, setRegContent] = createSignal('')
  const [collectionName, setCollectionName] = createSignal('')
  const [result, setResult] = createSignal<GpoResult | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved.regContent === 'string') setRegContent(saved.regContent)
      if (typeof saved.collectionName === 'string') setCollectionName(saved.collectionName)
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { regContent: regContent(), collectionName: collectionName() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      setRegContent(text)
    }
    reader.readAsText(file)
  }

  const handleGenerate = () => {
    const converted = convertRegToGpo(regContent(), collectionName())
    if (converted.ok) {
      setResult(converted.value)
      setError(null)
    } else {
      setError(translateError(props.lang, converted.error))
      setResult(null)
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'tools_reg2gpo_inputLabel')}
        placeholder={t(props.lang, 'tools_reg2gpo_placeholder')}
        value={regContent()}
        onInput={(e) => setRegContent(e.currentTarget.value)}
        monospace
        rows={8}
      />

      <FileInput
        label={t(props.lang, 'tools_reg2gpo_uploadLabel')}
        accept=".reg"
        onFile={handleFile}
      />

      <Input
        label={t(props.lang, 'tools_reg2gpo_collectionLabel')}
        placeholder={t(props.lang, 'tools_reg2gpo_collectionPlaceholder')}
        value={collectionName()}
        onInput={(e) => setCollectionName(e.currentTarget.value)}
      />

      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_reg2gpo_generate')}
      </Button>

      <Show when={error()}>
        <StatusMessage type="error" message={error()!} />
      </Show>

      <Show when={result()}>
        <div class="flex items-center gap-2">
          <Badge variant="success" text={`${result()!.entriesCount} ${t(props.lang, 'tools_reg2gpo_generated')}`} />
          <Show when={result()!.skippedCount > 0}>
            <Badge variant="info" text={`${result()!.skippedCount} ${t(props.lang, 'tools_reg2gpo_skipped')}`} />
          </Show>
        </div>

        <OutputPanel
          label={t(props.lang, 'tools_reg2gpo_outputLabel')}
          value={result()!.xml}
          monospace
          rows={12}
        />

        <DownloadButton
          getData={() => result()!.xml}
          filename={t(props.lang, 'tools_reg2gpo_downloadFilename')}
          mimeType="application/xml"
          label={t(props.lang, 'tools_reg2gpo_download')}
        />
      </Show>
    </div>
  )
}
