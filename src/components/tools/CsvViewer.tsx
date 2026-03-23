import { createSignal, Show, For, onMount, onCleanup } from 'solid-js'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { StatusMessage } from '../ui/StatusMessage'
import { parseCsv, sortRows } from '../../tools/csv-viewer'
import type { SortDirection } from '../../tools/csv-viewer'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function CsvViewer(props: Props) {
  const [input, setInput] = createSignal('')
  const [sortCol, setSortCol] = createSignal<number | null>(null)
  const [sortDir, setSortDir] = createSignal<SortDirection>(null)

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
    return parseCsv(val)
  }

  const handleSort = (colIndex: number) => {
    if (sortCol() === colIndex) {
      setSortDir((d) => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc')
      if (sortDir() === null) setSortCol(null)
    } else {
      setSortCol(colIndex)
      setSortDir('asc')
    }
  }

  const displayRows = () => {
    const p = parsed()
    if (!p || !p.ok) return []
    const col = sortCol()
    if (col === null) return p.rows
    return sortRows(p.rows, col, sortDir())
  }

  const handleExportJson = () => {
    const p = parsed()
    if (!p || !p.ok) return
    const objects = p.rows.map((row) =>
      Object.fromEntries(p.headers.map((h, i) => [h, row[i] ?? '']))
    )
    const blob = new Blob([JSON.stringify(objects, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const sortIcon = (colIndex: number) => {
    if (sortCol() !== colIndex) return '↕'
    return sortDir() === 'asc' ? '↑' : '↓'
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label="CSV"
        placeholder={t(props.lang, 'csv_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        rows={6}
      />

      <Show when={parsed()?.ok === false && input().trim()}>
        <StatusMessage type="error" message={(parsed() as { ok: false; error: string })?.error ?? ''} />
      </Show>

      <Show when={parsed()?.ok === true}>
        {(() => {
          const p = parsed()
          if (!p || !p.ok) return null
          return (
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-text-muted">
                  {t(props.lang, 'csv_rowCount').replace('{n}', String(p.rowCount))}
                </span>
                <Button variant="secondary" size="sm" onClick={handleExportJson}>
                  {t(props.lang, 'csv_exportJson')}
                </Button>
              </div>

              <div class="overflow-x-auto rounded-lg border border-border">
                <table class="w-full text-sm">
                  <thead class="bg-surface-raised">
                    <tr>
                      <For each={p.headers}>
                        {(header, i) => (
                          <th
                            class="px-3 py-2 text-left font-medium text-text-primary whitespace-nowrap cursor-pointer select-none hover:bg-surface transition-colors"
                            onClick={() => handleSort(i())}
                          >
                            <span class="flex items-center gap-1">
                              {header}
                              <span class="text-text-muted text-xs">{sortIcon(i())}</span>
                            </span>
                          </th>
                        )}
                      </For>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={displayRows()}>
                      {(row, i) => (
                        <tr class={i() % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'}>
                          <For each={row}>
                            {(cell) => (
                              <td class="px-3 py-2 text-text-primary font-mono whitespace-nowrap max-w-xs truncate">
                                {cell}
                              </td>
                            )}
                          </For>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}
      </Show>

      <Show when={!input().trim()}>
        <p class="text-sm text-text-muted text-center py-4">{t(props.lang, 'csv_noData')}</p>
      </Show>
    </div>
  )
}
