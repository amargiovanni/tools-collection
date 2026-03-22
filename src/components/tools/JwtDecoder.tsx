import { createSignal, Show, onMount, onCleanup } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { StatusMessage } from '../ui/StatusMessage'
import { ResultCard } from '../ui/ResultCard'
import { parseJwt, getExpiryStatus } from '../../tools/jwt-decoder'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000)
  if (totalSecs < 60) return `${totalSecs}s`
  const mins = Math.floor(totalSecs / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

export default function JwtDecoder(props: Props) {
  const [input, setInput] = createSignal('')

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

  const parsed = () => {
    const val = input().trim()
    if (!val) return null
    return parseJwt(val)
  }

  const expiry = () => {
    const p = parsed()
    if (!p || !p.ok) return null
    return getExpiryStatus(p.payload)
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label="JWT"
        placeholder={t(props.lang, 'jwt_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        rows={4}
      />

      <Show when={input().trim() && parsed()?.ok === false}>
        <StatusMessage type="error" message={(parsed() as { ok: false; error: string })?.error ?? ''} />
      </Show>

      <Show when={parsed()?.ok === true}>
        {(() => {
          const p = parsed()
          if (!p || !p.ok) return null
          const exp = expiry()

          return (
            <div class="flex flex-col gap-3">
              <Show when={exp && exp.status !== 'none'}>
                {(() => {
                  if (!exp || exp.status === 'none') return null
                  const isValid = exp.status === 'valid'
                  const timeStr = formatDuration(isValid ? exp.remainingMs : exp.elapsedMs)
                  const label = isValid
                    ? t(props.lang, 'jwt_expiresIn').replace('{time}', timeStr)
                    : t(props.lang, 'jwt_expiredAgo').replace('{time}', timeStr)
                  return (
                    <div
                      class={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold w-fit ${
                        isValid
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      <span class={`h-2 w-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span>{isValid ? t(props.lang, 'jwt_valid') : t(props.lang, 'jwt_expired')}</span>
                      <span class="font-normal opacity-60">·</span>
                      <span class="font-normal">{label}</span>
                    </div>
                  )
                })()}
              </Show>

              <ResultCard label={t(props.lang, 'jwt_header')} value={JSON.stringify(p.header, null, 2)} />
              <ResultCard label={t(props.lang, 'jwt_payload')} value={JSON.stringify(p.payload, null, 2)} />

              <div class="flex flex-col gap-1">
                <ResultCard label={t(props.lang, 'jwt_signature')} value={p.signatureHex} />
                <p class="text-xs text-text-muted px-1">{t(props.lang, 'jwt_notVerified')}</p>
              </div>
            </div>
          )
        })()}
      </Show>
    </div>
  )
}
