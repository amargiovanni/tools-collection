import { createSignal, Show, For } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { StatusMessage } from '../ui/StatusMessage'
import { computeDiff } from '../../tools/diff-checker'
import type { DiffResult } from '../../tools/diff-checker'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

const lineBg: Record<string, string> = {
  added: 'bg-success-light',
  deleted: 'bg-error-light',
  unchanged: '',
}

const linePrefix: Record<string, string> = {
  added: '+',
  deleted: '-',
  unchanged: ' ',
}

export default function DiffChecker(props: Props) {
  const [left, setLeft] = createSignal('')
  const [right, setRight] = createSignal('')
  const [ignoreCase, setIgnoreCase] = createSignal(false)
  const [ignoreWhitespace, setIgnoreWhitespace] = createSignal(false)
  const [result, setResult] = createSignal<DiffResult | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  const handleCompare = () => {
    setError(null)
    setResult(null)

    const res = computeDiff(left(), right(), {
      ignoreCase: ignoreCase(),
      ignoreWhitespace: ignoreWhitespace(),
    })

    if (res.ok) {
      setResult(res.value)
    } else {
      setError(translateError(props.lang, res.error))
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextArea
          label={t(props.lang, 'tools_diffChecker_originalText')}
          placeholder={t(props.lang, 'tools_diffChecker_originalPlaceholder')}
          value={left()}
          onInput={(e) => setLeft(e.currentTarget.value)}
          rows={8}
          testId="textarea-original"
        />
        <TextArea
          label={t(props.lang, 'tools_diffChecker_modifiedText')}
          placeholder={t(props.lang, 'tools_diffChecker_modifiedPlaceholder')}
          value={right()}
          onInput={(e) => setRight(e.currentTarget.value)}
          rows={8}
          testId="textarea-modified"
        />
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <Checkbox
          label={t(props.lang, 'tools_diffChecker_ignoreCase')}
          checked={ignoreCase()}
          onChange={(e) => setIgnoreCase(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_diffChecker_ignoreWhitespace')}
          checked={ignoreWhitespace()}
          onChange={(e) => setIgnoreWhitespace(e.currentTarget.checked)}
        />
      </div>
      <Button variant="primary" onClick={handleCompare}>
        {t(props.lang, 'tools_diffChecker_compare')}
      </Button>

      {error() && <StatusMessage type="error" message={error()!} />}

      <Show when={result()}>
        {(data) => (
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap gap-2">
              <Badge variant="success" text={`${t(props.lang, 'tools_diffChecker_additions')}: ${data().additions}`} />
              <Badge variant="error" text={`${t(props.lang, 'tools_diffChecker_deletions')}: ${data().deletions}`} />
              <Badge variant="info" text={`${t(props.lang, 'tools_diffChecker_unchanged')}: ${data().unchanged}`} />
            </div>

            <Show when={data().additions === 0 && data().deletions === 0}>
              <StatusMessage type="success" message={t(props.lang, 'tools_diffChecker_noDifferences')} />
            </Show>

            <div class="overflow-auto rounded-lg border border-border">
              <For each={data().lines}>
                {(line) => (
                  <div class={`flex font-mono text-sm ${lineBg[line.type]}`}>
                    <span class="w-10 shrink-0 select-none border-r border-border px-2 py-0.5 text-right text-text-muted">
                      {line.lineNumber}
                    </span>
                    <span class="w-5 shrink-0 select-none px-1 py-0.5 text-center text-text-muted">
                      {linePrefix[line.type]}
                    </span>
                    <span class="whitespace-pre-wrap px-2 py-0.5 text-text-primary">
                      {line.content}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}
