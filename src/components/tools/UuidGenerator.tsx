import { createSignal, For, onMount, onCleanup } from 'solid-js'
import { Button } from '../ui/Button'
import { CopyButton } from '../ui/CopyButton'
import { generateUUIDv4, generateUUIDv7, generateULID } from '../../tools/uuid-generator'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { t } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

type IdType = 'v4' | 'v7' | 'ulid'

interface Section {
  type: IdType
  labelKey: 'uuid_v4Label' | 'uuid_v7Label' | 'uuid_ulidLabel'
  descKey: 'uuid_v4Description' | 'uuid_v7Description' | 'uuid_ulidDescription'
  generate: () => string
}

const sections: Section[] = [
  { type: 'v4',   labelKey: 'uuid_v4Label',   descKey: 'uuid_v4Description',   generate: generateUUIDv4 },
  { type: 'v7',   labelKey: 'uuid_v7Label',   descKey: 'uuid_v7Description',   generate: generateUUIDv7 },
  { type: 'ulid', labelKey: 'uuid_ulidLabel', descKey: 'uuid_ulidDescription', generate: generateULID },
]

function generateBatch(gen: () => string, count: number): string[] {
  return Array.from({ length: count }, () => gen())
}

export default function UuidGenerator(props: Props) {
  const [count, setCount] = createSignal(1)
  const [results, setResults] = createSignal<Record<IdType, string[]>>({
    v4: [generateUUIDv4()],
    v7: [generateUUIDv7()],
    ulid: [generateULID()],
  })

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['count'] === 'number') setCount(saved['count'])
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { count: count() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const handleGenerate = (n: number) => {
    setCount(n)
    setResults({
      v4: generateBatch(generateUUIDv4, n),
      v7: generateBatch(generateUUIDv7, n),
      ulid: generateBatch(generateULID, n),
    })
  }

  return (
    <div class="flex flex-col gap-6">
      <div class="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => handleGenerate(1)}>
          {t(props.lang, 'uuid_generate')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleGenerate(10)}>
          {t(props.lang, 'uuid_generateTen')}
        </Button>
      </div>

      <For each={sections}>
        {(section) => (
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm font-semibold text-text-primary">{t(props.lang, section.labelKey)}</span>
                <span class="ml-2 text-xs text-text-muted">{t(props.lang, section.descKey)}</span>
              </div>
              <CopyButton getValue={() => results()[section.type].join('\n')} label={t(props.lang, 'uuid_copyAll')} />
            </div>
            <div class="flex flex-col gap-1 rounded-lg border border-border bg-surface-raised p-2">
              <For each={results()[section.type]}>
                {(id) => (
                  <div class="flex items-center justify-between px-1">
                    <code class="font-mono text-sm text-text-primary select-all">{id}</code>
                    <CopyButton getValue={() => id} />
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  )
}
