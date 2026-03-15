import { createSignal, createEffect, Show, For } from 'solid-js'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { StatusMessage } from '../ui/StatusMessage'
import { checkPasswordStrength } from '../../tools/password-strength'
import type { StrengthResult } from '../../tools/password-strength'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

const levelVariant: Record<string, 'error' | 'info' | 'success'> = {
  weak: 'error',
  medium: 'info',
  strong: 'success',
}

const levelColors: Record<string, string> = {
  weak: 'bg-error',
  medium: 'bg-accent',
  strong: 'bg-success',
}

export default function PasswordStrength(props: Props) {
  const [password, setPassword] = createSignal('')
  const [showPassword, setShowPassword] = createSignal(false)
  const [result, setResult] = createSignal<StrengthResult | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  const levelLabel = (level: string): string => {
    if (level === 'weak') return t(props.lang, 'tools_passwordStrength_weak')
    if (level === 'medium') return t(props.lang, 'tools_passwordStrength_medium')
    return t(props.lang, 'tools_passwordStrength_strong')
  }

  const checkLabel = (name: string): string => {
    const map: Record<string, string> = {
      length: t(props.lang, 'tools_passwordStrength_length'),
      uppercase: t(props.lang, 'tools_passwordStrength_uppercase'),
      lowercase: t(props.lang, 'tools_passwordStrength_lowercase'),
      numbers: t(props.lang, 'tools_passwordStrength_numbers'),
      symbols: t(props.lang, 'tools_passwordStrength_symbols'),
    }
    return map[name] ?? name
  }

  createEffect(() => {
    const pw = password()
    if (!pw) {
      setResult(null)
      setError(null)
      return
    }

    const res = checkPasswordStrength(pw)
    if (res.ok) {
      setResult(res.value)
      setError(null)
    } else {
      setError(res.error.message)
      setResult(null)
    }
  })

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-text-secondary">
          {t(props.lang, 'tools_passwordStrength_inputLabel')}
        </label>
        <div class="relative">
          <input
            type={showPassword() ? 'text' : 'password'}
            placeholder={t(props.lang, 'tools_passwordStrength_placeholder')}
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            class="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 pr-20 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-text-secondary hover:text-accent cursor-pointer"
            onClick={() => setShowPassword(!showPassword())}
          >
            {showPassword() ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {error() && <StatusMessage type="error" message={error()!} />}

      <Show when={result()}>
        {(data) => (
          <div class="flex flex-col gap-4">
            {/* Score bar */}
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-sm text-text-secondary">
                  {t(props.lang, 'tools_passwordStrength_score')} {data().score}/8
                </span>
                <Badge
                  variant={levelVariant[data().level]}
                  text={levelLabel(data().level)}
                />
              </div>
              <div class="h-2 w-full rounded-full bg-surface">
                <div
                  class={`h-2 rounded-full transition-all duration-300 ${levelColors[data().level]}`}
                  style={{ width: `${(data().score / 8) * 100}%` }}
                />
              </div>
            </div>

            {/* Checks list */}
            <div class="flex flex-col gap-1">
              <For each={data().checks}>
                {(check) => (
                  <div class="flex items-center gap-2 text-sm">
                    <span class={check.passed ? 'text-success' : 'text-error'}>
                      {check.passed ? '\u2713' : '\u2717'}
                    </span>
                    <span class="text-text-primary">{checkLabel(check.name)}</span>
                  </div>
                )}
              </For>
            </div>

            {/* Suggestions */}
            <Show when={data().suggestions.length > 0}>
              <div class="flex flex-col gap-1">
                <span class="text-sm font-medium text-text-secondary">
                  {t(props.lang, 'tools_passwordStrength_suggestions')}
                </span>
                <For each={data().suggestions}>
                  {(suggestion) => (
                    <p class="text-sm text-text-secondary">- {suggestion}</p>
                  )}
                </For>
              </div>
            </Show>

            <Show when={data().suggestions.length === 0}>
              <StatusMessage type="success" message={t(props.lang, 'tools_passwordStrength_goodPassword')} />
            </Show>
          </div>
        )}
      </Show>
    </div>
  )
}
