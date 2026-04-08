import { createMemo, createSignal, For, onCleanup, onMount } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { t } from '../../i18n'
import type { Language } from '../../i18n'
import { analyzeText } from '../../tools/text-counter'

interface Props {
  lang: Language
}

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

  const pushHistoryValue = (nextValue: string) => {
    const nextHistory = [...history().slice(0, historyIndex() + 1), nextValue]
    setHistory(nextHistory)
    setHistoryIndex(nextHistory.length - 1)
    setInput(nextValue)
  }

  const applyText = (nextValue: string) => {
    if (nextValue === input()) return
    pushHistoryValue(nextValue)
  }

  const handleUndo = () => {
    if (historyIndex() === 0) return
    const nextIndex = historyIndex() - 1
    setHistoryIndex(nextIndex)
    setInput(history()[nextIndex] ?? '')
  }

  const handleRedo = () => {
    if (historyIndex() >= history().length - 1) return
    const nextIndex = historyIndex() + 1
    setHistoryIndex(nextIndex)
    setInput(history()[nextIndex] ?? '')
  }

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved && typeof saved['input'] === 'string') {
      const savedInput = saved['input']
      setInput(savedInput)
      setHistory([savedInput])
      setHistoryIndex(0)
    }

    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input() } },
      }))
    }

    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const stats = createMemo(() => analyzeText(input()))

  const statCards = createMemo(() => [
    {
      label: t(props.lang, 'tools_textCounter_characters'),
      value: stats().characters.toLocaleString(),
    },
    {
      label: t(props.lang, 'tools_textCounter_charactersNoSpaces'),
      value: stats().charactersNoSpaces.toLocaleString(),
    },
    {
      label: t(props.lang, 'tools_textCounter_words'),
      value: stats().words.toLocaleString(),
    },
    {
      label: t(props.lang, 'tools_textCounter_sentences'),
      value: stats().sentences.toLocaleString(),
    },
    {
      label: t(props.lang, 'tools_textCounter_paragraphs'),
      value: stats().paragraphs.toLocaleString(),
    },
    {
      label: t(props.lang, 'tools_textCounter_readingTime'),
      value: formatDuration(props.lang, stats().readingTimeSeconds),
    },
    {
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
          <Button variant="secondary" size="sm" onClick={() => applyText(input().toLocaleUpperCase())} disabled={!input()}>
            {t(props.lang, 'tools_textCounter_uppercase')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => applyText(input().toLocaleLowerCase())} disabled={!input()}>
            {t(props.lang, 'tools_textCounter_lowercase')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => applyText('')} disabled={!input()}>
            {t(props.lang, 'tools_textCounter_clear')}
          </Button>
        </div>

        <TextArea
          label={t(props.lang, 'tools_textCounter_inputLabel')}
          placeholder={t(props.lang, 'tools_textCounter_placeholder')}
          rows={16}
          value={input()}
          onInput={(event) => applyText(event.currentTarget.value)}
        />
      </div>

      <div class="flex flex-col gap-4">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <For each={statCards()}>
            {(stat) => (
              <div class="rounded-lg border border-border bg-surface-raised p-4">
                <p class="text-xs text-text-muted">{stat.label}</p>
                <p class="mt-1 text-2xl font-semibold text-text-primary">{stat.value}</p>
              </div>
            )}
          </For>
        </div>

        <div class="rounded-lg border border-border bg-surface-raised p-4">
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
