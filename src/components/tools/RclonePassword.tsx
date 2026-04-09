import { createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { revealRclonePassword } from '../../tools/rclone-password'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function RclonePassword(props: Props) {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(false)

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const handleReveal = async () => {
    setLoading(true)
    setError(null)
    setOutput('')

    const result = await revealRclonePassword(input())
    if (result.ok) {
      setOutput(result.value)
    } else {
      setError(translateError(props.lang, result.error))
    }

    setLoading(false)
  }

  return (
    <div class="flex flex-col gap-4">
      <p class="text-sm text-text-secondary">
        {t(props.lang, 'tools_rclonePassword_originalScriptPrefix')}{' '}
        <a
          href="https://www.powershellgallery.com/packages/Get-RclonePassword"
          target="_blank"
          rel="noreferrer"
          class="font-medium text-accent underline-offset-4 hover:underline"
        >
          Get-RclonePassword
        </a>
        {t(props.lang, 'tools_rclonePassword_originalScriptSuffix')}
      </p>

      <TextArea
        label={t(props.lang, 'tools_rclonePassword_inputLabel')}
        placeholder={t(props.lang, 'tools_rclonePassword_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        monospace
        rows={5}
      />

      <Button variant="primary" onClick={handleReveal} disabled={loading()}>
        {loading() ? '...' : t(props.lang, 'tools_rclonePassword_reveal')}
      </Button>

      {error() && <StatusMessage type="error" message={error()!} />}

      <OutputPanel
        label={t(props.lang, 'tools_rclonePassword_outputLabel')}
        value={output()}
        rows={4}
      />
    </div>
  )
}
