import { createSignal, createEffect, For, Show, onMount, onCleanup } from 'solid-js'
import Fuse from 'fuse.js'
import { toolRegistry } from '../config/tools'
import { t, getCategoryName, getToolNameKey, getToolDescKey } from '../i18n'
import type { Language } from '../i18n'
import { iconSvg, toolIconSvg, hueOf } from '../lib/icons'
import { clearRecents } from '../lib/recents'
import { upstreamRepositoryUrl } from '../config/site'

interface Props {
  lang: Language
}

interface ToolItem {
  kind: 'tool'
  id: string
  name: string
  description: string
  category: string
  hue: string
  path: string
  keywords: readonly string[]
}

interface ActionItem {
  kind: 'action'
  id: string
  name: string
  icon: string
  run: () => void
}

type Item = ToolItem | ActionItem

function buildToolItems(lang: Language): ToolItem[] {
  return toolRegistry.map((tool) => ({
    kind: 'tool',
    id: tool.id,
    name: t(lang, getToolNameKey(tool.id)),
    description: t(lang, getToolDescKey(tool.id)),
    category: getCategoryName(lang, tool.category),
    hue: hueOf(tool.category),
    path: `/${lang}/tools/${tool.id}/`,
    keywords: tool.keywords,
  }))
}

export default function CommandPalette(props: Props) {
  const [open, setOpen] = createSignal(false)
  const [query, setQuery] = createSignal('')
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  const [toolResults, setToolResults] = createSignal<ToolItem[]>([])

  let inputRef: HTMLInputElement | undefined
  let listRef: HTMLDivElement | undefined

  const toolItems = buildToolItems(props.lang)
  const fuse = new Fuse(toolItems, {
    keys: [
      { name: 'name', weight: 3 },
      { name: 'keywords', weight: 2 },
      { name: 'description', weight: 1 },
    ],
    threshold: 0.4,
    includeScore: true,
  })

  const actions: ActionItem[] = [
    {
      kind: 'action',
      id: 'home',
      name: t(props.lang, 'commandPalette_actionHome'),
      icon: 'list',
      run: () => {
        window.location.href = `/${props.lang}/`
      },
    },
    {
      kind: 'action',
      id: 'theme',
      name: t(props.lang, 'commandPalette_actionTheme'),
      icon: 'sparkles',
      run: () => document.getElementById('theme-toggle')?.click(),
    },
    {
      kind: 'action',
      id: 'github',
      name: t(props.lang, 'commandPalette_actionGithub'),
      icon: 'code',
      run: () => window.open(upstreamRepositoryUrl, '_blank', 'noopener'),
    },
    {
      kind: 'action',
      id: 'clear-recents',
      name: t(props.lang, 'commandPalette_actionClearRecents'),
      icon: 'rotate',
      run: () => clearRecents(),
    },
  ]

  const actionResults = (): ActionItem[] => {
    const q = query().trim().toLowerCase()
    if (!q) return actions
    return actions.filter((a) => a.name.toLowerCase().includes(q))
  }

  const allResults = (): Item[] => [...actionResults(), ...toolResults()]

  createEffect(() => {
    const q = query().trim()
    setToolResults(q ? fuse.search(q).map((r) => r.item) : toolItems)
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
  function runItem(item: Item | undefined) {
    if (!item) return
    if (item.kind === 'action') {
      closePalette()
      item.run()
    } else {
      closePalette()
      window.location.href = item.path
    }
  }

  function scrollToSelected() {
    requestAnimationFrame(() => {
      listRef?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
    })
  }

  function isTypingTarget(el: EventTarget | null): boolean {
    const node = el as HTMLElement | null
    if (!node) return false
    const tag = node.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || node.isContentEditable
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!open()) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openPalette()
      } else if (e.key === '/' && !isTypingTarget(e.target)) {
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
        setSelectedIndex((i) => Math.min(i + 1, allResults().length - 1))
        scrollToSelected()
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        scrollToSelected()
        break
      case 'Enter': {
        e.preventDefault()
        runItem(allResults()[selectedIndex()])
        break
      }
    }
  }

  onMount(() => document.addEventListener('keydown', handleKeyDown))
  onCleanup(() => document.removeEventListener('keydown', handleKeyDown))

  const resultLabel = () => {
    const n = allResults().length
    if (!n) return ''
    return `${n} ${n === 1 ? t(props.lang, 'commandPalette_result') : t(props.lang, 'commandPalette_results')}`
  }

  return (
    <Show when={open()}>
      <div
        class="cmdk-scrim"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => {
          if (e.target === e.currentTarget) closePalette()
        }}
      >
        <div class="cmdk">
          <div class="cmdk-input">
            <span innerHTML={iconSvg('search')} />
            <input
              ref={inputRef}
              type="text"
              placeholder={t(props.lang, 'commandPalette_placeholder')}
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              autocomplete="off"
              spellcheck={false}
              role="combobox"
              aria-expanded="true"
              aria-controls="command-palette-list"
              aria-activedescendant={`cp-item-${selectedIndex()}`}
            />
            <span class="esc">ESC</span>
          </div>

          <div ref={listRef} id="command-palette-list" class="cmdk-list" role="listbox">
            <Show
              when={allResults().length > 0}
              fallback={<div class="cmdk-empty">{t(props.lang, 'commandPalette_noResults')}</div>}
            >
              <Show when={actionResults().length > 0}>
                <div class="cmdk-group-label">{t(props.lang, 'commandPalette_actionsLabel')}</div>
                <For each={actionResults()}>
                  {(action, index) => (
                    <div
                      id={`cp-item-${index()}`}
                      role="option"
                      aria-selected={index() === selectedIndex()}
                      data-selected={index() === selectedIndex()}
                      class={`cmdk-item ${index() === selectedIndex() ? 'sel' : ''}`}
                      onClick={() => runItem(action)}
                      onMouseEnter={() => setSelectedIndex(index())}
                    >
                      <span class="tile" style="--tint:var(--ink-2)" innerHTML={iconSvg(action.icon)} />
                      <span class="ci-body">
                        <span class="ci-name">{action.name}</span>
                      </span>
                      <span class="ci-cat">{t(props.lang, 'commandPalette_actionBadge')}</span>
                    </div>
                  )}
                </For>
              </Show>

              <Show when={toolResults().length > 0}>
                <div class="cmdk-group-label">
                  {t(props.lang, 'commandPalette_toolsLabel')} · {toolResults().length}
                </div>
                <For each={toolResults()}>
                  {(item, index) => {
                    const globalIndex = () => actionResults().length + index()
                    return (
                      <div
                        id={`cp-item-${globalIndex()}`}
                        role="option"
                        aria-selected={globalIndex() === selectedIndex()}
                        data-selected={globalIndex() === selectedIndex()}
                        class={`cmdk-item ${globalIndex() === selectedIndex() ? 'sel' : ''}`}
                        onClick={() => runItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIndex())}
                      >
                        <span class="tile" style={`--tint:${item.hue}`} innerHTML={toolIconSvg(item.id)} />
                        <span class="ci-body">
                          <span class="ci-name">{item.name}</span>
                          <span class="ci-desc">{item.description}</span>
                        </span>
                        <span class="ci-cat">{item.category}</span>
                      </div>
                    )
                  }}
                </For>
              </Show>
            </Show>
          </div>

          <div class="cmdk-foot">
            <span class="hintset"><span class="kbd">↑</span><span class="kbd">↓</span> {t(props.lang, 'commandPalette_navigate')}</span>
            <span class="hintset"><span class="kbd">↵</span> {t(props.lang, 'commandPalette_open')}</span>
            <span class="hintset"><span class="kbd">⌘</span><span class="kbd">K</span> {t(props.lang, 'commandPalette_toggle')}</span>
            <span class="spacer"></span>
            <span>{resultLabel()}</span>
          </div>
        </div>
      </div>
    </Show>
  )
}
