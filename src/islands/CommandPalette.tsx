import { createSignal, createEffect, For, Show, onMount, onCleanup } from 'solid-js'
import Fuse from 'fuse.js'
import { toolRegistry } from '../config/tools'
import { t, getCategoryName, getToolNameKey, getToolDescKey } from '../i18n'
import type { Language } from '../i18n'
import type { ToolMeta } from '../config/tools'

interface Props {
  lang: Language
}

interface SearchItem {
  id: string
  name: string
  description: string
  category: string
  icon: string
  path: string
  keywords: readonly string[]
}

function buildSearchItems(lang: Language): SearchItem[] {
  return toolRegistry.map((tool) => {
    return {
      id: tool.id,
      name: t(lang, getToolNameKey(tool.id)),
      description: t(lang, getToolDescKey(tool.id)),
      category: getCategoryName(lang, tool.category),
      icon: tool.icon,
      path: `/${lang}/tools/${tool.id}/`,
      keywords: tool.keywords,
    }
  })
}

export default function CommandPalette(props: Props) {
  const [open, setOpen] = createSignal(false)
  const [query, setQuery] = createSignal('')
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  const [results, setResults] = createSignal<SearchItem[]>([])

  let inputRef: HTMLInputElement | undefined
  let listRef: HTMLDivElement | undefined

  const items = buildSearchItems(props.lang)
  const fuse = new Fuse(items, {
    keys: [
      { name: 'name', weight: 3 },
      { name: 'keywords', weight: 2 },
      { name: 'description', weight: 1 },
    ],
    threshold: 0.4,
    includeScore: true,
  })

  createEffect(() => {
    const q = query().trim()
    if (!q) {
      setResults(items)
    } else {
      setResults(fuse.search(q).map((r) => r.item))
    }
    setSelectedIndex(0)
  })

  function openPalette() {
    setOpen(true)
    setQuery('')
    requestAnimationFrame(() => inputRef?.focus())
  }

  function closePalette() {
    setOpen(false)
    setQuery('')
  }

  function navigate(path: string) {
    closePalette()
    window.location.href = path
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!open()) {
      // Open on Cmd/Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openPalette()
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        closePalette()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results().length - 1))
        scrollToSelected()
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        scrollToSelected()
        break
      case 'Enter': {
        e.preventDefault()
        const item = results()[selectedIndex()]
        if (item) navigate(item.path)
        break
      }
    }
  }

  function scrollToSelected() {
    requestAnimationFrame(() => {
      const el = listRef?.querySelector('[data-selected="true"]')
      el?.scrollIntoView({ block: 'nearest' })
    })
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <Show when={open()}>
      {/* Backdrop */}
      <div
        class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh]"
        onClick={(e) => {
          if (e.target === e.currentTarget) closePalette()
        }}
      >
        {/* Modal */}
        <div
          class="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface-raised shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          {/* Search input */}
          <div class="flex items-center gap-3 border-b border-border px-4 py-3">
            <svg class="h-5 w-5 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder={t(props.lang, 'commandPalette_placeholder')}
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              class="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-palette-list"
              aria-activedescendant={`cp-item-${selectedIndex()}`}
            />
            <kbd class="hidden sm:inline-flex rounded border border-border px-1.5 py-0.5 text-xs text-text-muted">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            id="command-palette-list"
            class="max-h-80 overflow-y-auto p-2"
            role="listbox"
          >
            <Show
              when={results().length > 0}
              fallback={
                <p class="py-8 text-center text-sm text-text-muted">
                  {t(props.lang, 'commandPalette_noResults')}
                </p>
              }
            >
              <For each={results()}>
                {(item, index) => (
                  <div
                    id={`cp-item-${index()}`}
                    role="option"
                    aria-selected={index() === selectedIndex()}
                    data-selected={index() === selectedIndex()}
                    class={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                      index() === selectedIndex()
                        ? 'bg-accent text-white'
                        : 'text-text-primary hover:bg-surface'
                    }`}
                    onClick={() => navigate(item.path)}
                    onMouseEnter={() => setSelectedIndex(index())}
                  >
                    <span class="text-lg shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate">{item.name}</p>
                      <p class={`text-xs truncate ${
                        index() === selectedIndex() ? 'text-white/70' : 'text-text-muted'
                      }`}>
                        {item.category} — {item.description}
                      </p>
                    </div>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  )
}
