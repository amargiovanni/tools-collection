import { createMemo, createSignal, For, onCleanup } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { t } from '../../i18n'
import type { Language } from '../../i18n'
import { analyzeText } from '../../tools/text-counter'

interface Props {
  lang: Language
}

const HISTORY_LIMIT = 50
const HISTORY_DEBOUNCE_MS = 500

function formatDuration(lang: Language, seconds: number): string {
  if (seconds < 60) {
    return `${seconds} ${t(lang, 'tools_textCounter_secondsShort')}`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (remainingSeconds === 0) {
    return `${minutes} ${t(lang, 'tools_textCounter_minutesShort')}`
  }

  return `${minutes} ${t(lang, 'tools_textCounter_minutesShort')} ${remainingSeconds} ${t(lang, 'tools_textCounter_secondsShort')}`
}

export default function TextCounter(props: Props) {
  const [input, setInput] = createSignal('')
  const [history, setHistory] = createSignal([''])
  const [historyIndex, setHistoryIndex] = createSignal(0)
  let historyCommitTimer: number | undefined

  const clearPendingHistoryCommit = () => {
    if (historyCommitTimer !== undefined) {
      window.clearTimeout(historyCommitTimer)
      historyCommitTimer = undefined
    }
  }

  const commitHistoryValue = (nextValue: string) => {
    clearPendingHistoryCommit()

    const baseHistory = history().slice(0, historyIndex() + 1)
    if (baseHistory[baseHistory.length - 1] === nextValue) {
      setInput(nextValue)
      return
    }

    const nextHistory = [...baseHistory, nextValue].slice(-HISTORY_LIMIT)
    const nextIndex = nextHistory.length - 1

    setHistory(nextHistory)
    setHistoryIndex(nextIndex)
    setInput(nextValue)
  }

  const scheduleHistoryCommit = (nextValue: string) => {
    clearPendingHistoryCommit()
    historyCommitTimer = window.setTimeout(() => {
      commitHistoryValue(nextValue)
    }, HISTORY_DEBOUNCE_MS)
  }

  const handleInput = (nextValue: string) => {
    if (nextValue === input()) return
    setInput(nextValue)
    scheduleHistoryCommit(nextValue)
  }

  const applyImmediateText = (nextValue: string) => {
    if (nextValue === input()) return
    commitHistoryValue(nextValue)
  }

  const handleUndo = () => {
    clearPendingHistoryCommit()
    if (historyIndex() === 0) return
    const nextIndex = historyIndex() - 1
    setHistoryIndex(nextIndex)
    setInput(history()[nextIndex] ?? '')
  }

  const handleRedo = () => {
    clearPendingHistoryCommit()
    if (historyIndex() >= history().length - 1) return
    const nextIndex = historyIndex() + 1
    setHistoryIndex(nextIndex)
    setInput(history()[nextIndex] ?? '')
  }

  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') {
        const savedInput = saved['input']
        setInput(savedInput)
        setHistory([savedInput])
        setHistoryIndex(0)
      }
    },
    getState: () => ({ input: input() }),
  })

  onCleanup(() => {
    clearPendingHistoryCommit()
  })

  const stats = createMemo(() => analyzeText(input()))

  const statCards = createMemo(() => [
    {
      id: 'characters',
      label: t(props.lang, 'tools_textCounter_characters'),
      value: stats().characters.toLocaleString(),
    },
    {
      id: 'characters-no-spaces',
      label: t(props.lang, 'tools_textCounter_charactersNoSpaces'),
      value: stats().charactersNoSpaces.toLocaleString(),
    },
    {
      id: 'words',
      label: t(props.lang, 'tools_textCounter_words'),
      value: stats().words.toLocaleString(),
    },
    {
      id: 'sentences',
      label: t(props.lang, 'tools_textCounter_sentences'),
      value: stats().sentences.toLocaleString(),
    },
    {
      id: 'paragraphs',
      label: t(props.lang, 'tools_textCounter_paragraphs'),
      value: stats().paragraphs.toLocaleString(),
    },
    {
      id: 'reading-time',
      label: t(props.lang, 'tools_textCounter_readingTime'),
      value: formatDuration(props.lang, stats().readingTimeSeconds),
    },
    {
      id: 'speaking-time',
      label: t(props.lang, 'tools_textCounter_speakingTime'),
      value: formatDuration(props.lang, stats().speakingTimeSeconds),
    },
  ])

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={handleUndo} disabled={historyIndex() === 0}>
            {t(props.lang, 'tools_textCounter_undo')}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleRedo} disabled={historyIndex() >= history().length - 1}>
            {t(props.lang, 'tools_textCounter_redo')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => applyImmediateText(input().toLocaleUpperCase())} disabled={!input()}>
            {t(props.lang, 'tools_textCounter_uppercase')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => applyImmediateText(input().toLocaleLowerCase())} disabled={!input()}>
            {t(props.lang, 'tools_textCounter_lowercase')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => applyImmediateText('')} disabled={!input()}>
            {t(props.lang, 'tools_textCounter_clear')}
          </Button>
        </div>

        <TextArea
          label={t(props.lang, 'tools_textCounter_inputLabel')}
          placeholder={t(props.lang, 'tools_textCounter_placeholder')}
          rows={16}
          value={input()}
          onInput={(event) => handleInput(event.currentTarget.value)}
        />
      </div>

      <div class="flex flex-col gap-4">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <For each={statCards()}>
            {(stat) => (
              <div class="rounded-lg border border-border bg-surface-raised p-4" data-testid={`text-counter-stat-${stat.id}`}>
                <p class="text-xs text-text-muted">{stat.label}</p>
                <p class="mt-1 text-2xl font-semibold text-text-primary">{stat.value}</p>
              </div>
            )}
          </For>
        </div>

        <div class="rounded-lg border border-border bg-surface-raised p-4" data-testid="text-counter-keywords">
          <p class="text-sm font-medium text-text-secondary">{t(props.lang, 'tools_textCounter_keywords')}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <For each={stats().keywords}>
              {(keyword) => (
                <span class="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm text-text-primary">
                  {keyword.term} x{keyword.count}
                </span>
              )}
            </For>
            {stats().keywords.length === 0 && (
              <p class="text-sm text-text-muted">{t(props.lang, 'tools_textCounter_noKeywords')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
