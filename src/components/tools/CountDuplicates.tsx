import { createSignal, For, Show } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'
import { StatusMessage } from '../ui/StatusMessage'
import { countDuplicates } from '../../tools/count-duplicates'
import type { DuplicateEntry } from '../../tools/count-duplicates'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function CountDuplicates(props: Props) {
  const [input, setInput] = createSignal('')
  const [caseSensitive, setCaseSensitive] = createSignal(true)
  const [sortByCount, setSortByCount] = createSignal(true)
  const [entries, setEntries] = createSignal<DuplicateEntry[]>([])
  const [error, setError] = createSignal<string | null>(null)

  const handleAnalyze = () => {
    const result = countDuplicates(input(), {
      caseSensitive: caseSensitive(),
      sortByCount: sortByCount(),
    })

    if (result.ok) {
      setEntries(result.value)
      setError(null)
    } else {
      setError(translateError(props.lang, result.error))
      setEntries([])
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'tools_countDuplicates_inputLabel')}
        placeholder={t(props.lang, 'tools_countDuplicates_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <div class="flex flex-wrap gap-4">
        <Checkbox
          label={t(props.lang, 'common_caseSensitive')}
          checked={caseSensitive()}
          onChange={(e) => setCaseSensitive(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_countDuplicates_sortByCount')}
          checked={sortByCount()}
          onChange={(e) => setSortByCount(e.currentTarget.checked)}
        />
      </div>
      <Button variant="primary" onClick={handleAnalyze}>
        {t(props.lang, 'tools_countDuplicates_analyze')}
      </Button>
      {error() && <StatusMessage type="error" message={error()!} />}
      <Show when={entries().length > 0}>
        <div class="overflow-x-auto rounded-lg border border-border">
          <table class="w-full text-sm text-left">
            <thead class="bg-surface-raised text-text-secondary">
              <tr>
                <th class="px-4 py-2 font-medium">Value</th>
                <th class="px-4 py-2 font-medium text-right">Count</th>
                <th class="px-4 py-2 font-medium text-right">%</th>
              </tr>
            </thead>
            <tbody>
              <For each={entries()}>
                {(entry) => (
                  <tr class="border-t border-border hover:bg-surface-raised/50">
                    <td class="px-4 py-2 font-mono text-text-primary">{entry.value}</td>
                    <td class="px-4 py-2 text-right text-text-primary">{entry.count}</td>
                    <td class="px-4 py-2 text-right text-text-secondary">{entry.percentage}%</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  )
}
