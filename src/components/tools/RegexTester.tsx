import { createSignal, Show, For, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { Input } from '../ui/Input'
import { TextArea } from '../ui/TextArea'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { StatusMessage } from '../ui/StatusMessage'
import { testRegex } from '../../tools/regex-tester'
import type { RegexMatch } from '../../tools/regex-tester'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function RegexTester(props: Props) {
  const [pattern, setPattern] = createSignal('')
  const [testText, setTestText] = createSignal('')
  const [flagGlobal, setFlagGlobal] = createSignal(true)
  const [flagCase, setFlagCase] = createSignal(false)
  const [flagMultiline, setFlagMultiline] = createSignal(false)
  const [matches, setMatches] = createSignal<RegexMatch[]>([])

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['pattern'] === 'string') setPattern(saved['pattern'])
      if (typeof saved['testText'] === 'string') setTestText(saved['testText'])
      if (typeof saved['flagGlobal'] === 'boolean') setFlagGlobal(saved['flagGlobal'])
      if (typeof saved['flagCase'] === 'boolean') setFlagCase(saved['flagCase'])
      if (typeof saved['flagMultiline'] === 'boolean') setFlagMultiline(saved['flagMultiline'])
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { pattern: pattern(), testText: testText(), flagGlobal: flagGlobal(), flagCase: flagCase(), flagMultiline: flagMultiline() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })
  const [error, setError] = createSignal<string | null>(null)
  const [tested, setTested] = createSignal(false)

  const handleTest = () => {
    setError(null)
    setMatches([])
    setTested(true)

    const result = testRegex(pattern(), testText(), {
      global: flagGlobal(),
      caseInsensitive: flagCase(),
      multiline: flagMultiline(),
    })

    if (result.ok) {
      setMatches(result.value)
    } else {
      setError(result.error.message)
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <Input
        label={t(props.lang, 'tools_regexTester_patternLabel')}
        placeholder={t(props.lang, 'tools_regexTester_patternPlaceholder')}
        value={pattern()}
        onInput={(e) => setPattern(e.currentTarget.value)}
      />
      <div class="flex flex-wrap items-center gap-4">
        <Checkbox
          label={t(props.lang, 'tools_regexTester_global')}
          checked={flagGlobal()}
          onChange={(e) => setFlagGlobal(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_regexTester_ignoreCase')}
          checked={flagCase()}
          onChange={(e) => setFlagCase(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_regexTester_multiline')}
          checked={flagMultiline()}
          onChange={(e) => setFlagMultiline(e.currentTarget.checked)}
        />
      </div>
      <TextArea
        label={t(props.lang, 'tools_regexTester_testTextLabel')}
        placeholder={t(props.lang, 'tools_regexTester_testTextPlaceholder')}
        value={testText()}
        onInput={(e) => setTestText(e.currentTarget.value)}
        rows={6}
      />
      <Button variant="primary" onClick={handleTest}>
        {t(props.lang, 'tools_regexTester_test')}
      </Button>

      {error() && <StatusMessage type="error" message={error()!} />}

      <Show when={tested() && !error()}>
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-text-secondary">
              {t(props.lang, 'tools_regexTester_outputLabel')}
            </span>
            <Badge
              variant={matches().length > 0 ? 'success' : 'info'}
              text={matches().length > 0
                ? `${t(props.lang, 'tools_regexTester_foundMatches')}: ${matches().length}`
                : t(props.lang, 'tools_regexTester_noMatches')}
            />
          </div>

          <Show when={matches().length > 0}>
            <div class="overflow-auto rounded-lg border border-border">
              <For each={matches()}>
                {(match, i) => (
                  <div class="border-b border-border p-3 last:border-b-0">
                    <div class="flex items-center gap-2">
                      <Badge variant="info" text={`#${i() + 1}`} />
                      <span class="font-mono text-sm text-text-primary">
                        "{match.fullMatch}"
                      </span>
                      <span class="text-xs text-text-muted">
                        index: {match.index}
                      </span>
                    </div>
                    <Show when={match.groups.length > 0}>
                      <div class="mt-1 flex flex-wrap gap-1">
                        <For each={match.groups}>
                          {(group, gi) => (
                            <span class="rounded bg-accent-light px-1.5 py-0.5 font-mono text-xs text-accent">
                              Group {gi() + 1}: "{group}"
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  )
}
