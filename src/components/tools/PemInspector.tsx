import { createSignal, Show } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { CopyButton } from '../ui/CopyButton'
import { StatusMessage } from '../ui/StatusMessage'
import { inspectPem } from '../../tools/pem-inspector'
import type { CertInfo } from '../../tools/pem-inspector'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function PemInspector(props: Props) {
  const [input, setInput] = createSignal('')
  const [result, setResult] = createSignal<CertInfo | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(false)

  const handleExtract = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    const res = await inspectPem(input())

    if (res.ok) {
      setResult(res.value)
    } else {
      setError(translateError(props.lang, res.error))
    }
    setLoading(false)
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'tools_pemInspector_inputLabel')}
        placeholder={t(props.lang, 'tools_pemInspector_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        monospace
        rows={8}
      />
      <Button variant="primary" onClick={handleExtract} disabled={loading()}>
        {loading() ? '...' : t(props.lang, 'tools_pemInspector_extract')}
      </Button>

      {error() && <StatusMessage type="error" message={error()!} />}

      <Show when={result()}>
        {(info) => (
          <div class="flex flex-col gap-3">
            <div class="rounded-lg border border-border bg-surface-raised p-4">
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-medium text-text-secondary">
                  {t(props.lang, 'tools_pemInspector_fingerprint')}
                </span>
                <CopyButton getValue={() => info().fingerprint} />
              </div>
              <p class="mt-1 break-all font-mono text-sm text-text-primary">
                {info().fingerprint}
              </p>
            </div>

            <div class="rounded-lg border border-border bg-surface-raised p-4">
              <span class="text-sm font-medium text-text-secondary">
                {t(props.lang, 'tools_pemInspector_derSize')}
              </span>
              <p class="mt-1 font-mono text-sm text-text-primary">
                {info().derSize} bytes
              </p>
            </div>

            <div class="rounded-lg border border-border bg-surface-raised p-4">
              <span class="text-sm font-medium text-text-secondary">
                {t(props.lang, 'tools_pemInspector_derHex')}
              </span>
              <p class="mt-1 break-all font-mono text-sm text-text-primary">
                {info().derHex}
              </p>
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}
