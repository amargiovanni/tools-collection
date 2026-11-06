import { createSignal, For, Show, onCleanup } from 'solid-js'
import { Button } from '../ui/Button'
import { FileInput } from '../ui/FileInput'
import { Badge } from '../ui/Badge'
import { downloadFile } from '../../lib/download'
import {
  validateHeicHeader,
  toJpgFileName,
  HEADER_BYTES,
  clampJpegQuality,
  uniqueFileNames,
  DEFAULT_JPEG_QUALITY,
  MIN_JPEG_QUALITY,
  MAX_JPEG_QUALITY,
} from '../../tools/heic-to-jpg'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

type Status = 'queued' | 'converting' | 'done' | 'error'

interface Item {
  readonly id: number
  readonly file: File
  readonly outputName: string
  readonly status: Status
  readonly jpeg?: Blob
  readonly url?: string
  readonly error?: string
}

let nextId = 0

export default function HeicToJpg(props: Props) {
  const [items, setItems] = createSignal<Item[]>([])
  const [quality, setQuality] = createSignal(DEFAULT_JPEG_QUALITY)
  const [announcement, setAnnouncement] = createSignal('')
  const [alertMessage, setAlertMessage] = createSignal('')
  let running = false
  // Set on unmount (e.g. ClientRouter navigation): stops the queue and discards late results
  let disposed = false

  const update = (id: number, patch: Partial<Item>) =>
    setItems((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  const fail = (item: Item, code: string, message: string) => {
    const error = translateError(props.lang, { code, message })
    update(item.id, { status: 'error', error })
    setAlertMessage(`${item.file.name}: ${error}`)
  }

  const convert = async (item: Item) => {
    update(item.id, { status: 'converting' })
    try {
      const header = new Uint8Array(await item.file.slice(0, HEADER_BYTES).arrayBuffer())
      const valid = validateHeicHeader(header)
      if (!valid.ok) {
        if (!disposed) fail(item, valid.error.code, valid.error.message)
        return
      }
      // libheif (WASM, ~3 MB) is only fetched once a conversion actually starts
      const { heicTo } = await import('heic-to/csp')
      const jpeg = await heicTo({ blob: item.file, type: 'image/jpeg', quality: clampJpegQuality(quality()) })
      if (disposed) return
      update(item.id, { status: 'done', jpeg, url: URL.createObjectURL(jpeg) })
      setAnnouncement(`${item.file.name}: ${t(props.lang, 'tools_heicToJpg_statusDone')}`)
    } catch (e) {
      // Covers unreadable files too (e.g. removed from a disconnected volume)
      if (!disposed) fail(item, 'HEIC_CONVERSION_FAILED', e instanceof Error ? e.message : String(e))
    }
  }

  // One photo at a time: full-size iPhone images decode to hundreds of MB of pixels
  const processQueue = async () => {
    if (running) return
    running = true
    try {
      for (let next = items().find((i) => i.status === 'queued'); next && !disposed; next = items().find((i) => i.status === 'queued')) {
        await convert(next)
      }
    } finally {
      running = false
    }
  }

  const handleFiles = (files: File[]) => {
    const added = files.map((file) => ({
      id: nextId++,
      file,
      outputName: toJpgFileName(file.name),
      status: 'queued' as const,
    }))
    setItems((list) => [...list, ...added])
    void processQueue()
  }

  const converted = () => items().filter((i) => i.status === 'done' && i.jpeg)
  const busy = () => items().some((i) => i.status === 'queued' || i.status === 'converting')

  const downloadAll = async () => {
    const done = converted()
    const names = uniqueFileNames(done.map((i) => i.outputName))
    const { downloadZip } = await import('client-zip')
    const zip = await downloadZip(done.map((i, n) => ({ name: names[n]!, input: i.jpeg! }))).blob()
    downloadFile(zip, t(props.lang, 'tools_heicToJpg_zipFilename'), 'application/zip')
  }

  const revokeAll = () => {
    for (const item of items()) if (item.url) URL.revokeObjectURL(item.url)
  }

  const clear = () => {
    revokeAll()
    setItems([])
    setAnnouncement('')
    setAlertMessage('')
  }

  onCleanup(() => {
    disposed = true
    revokeAll()
  })

  const statusBadge = (item: Item) => {
    switch (item.status) {
      case 'queued':
        return <Badge variant="info" text={t(props.lang, 'tools_heicToJpg_statusQueued')} />
      case 'converting':
        return <Badge variant="info" text={t(props.lang, 'tools_heicToJpg_statusConverting')} />
      case 'done':
        return <Badge variant="success" text={t(props.lang, 'tools_heicToJpg_statusDone')} />
      case 'error':
        return <Badge variant="error" text={item.error ?? ''} />
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label for="heic-quality" class="text-sm font-medium text-text-secondary">
          {t(props.lang, 'tools_heicToJpg_qualityLabel')} {Math.round(quality() * 100)}%
        </label>
        <input
          id="heic-quality"
          type="range"
          min={MIN_JPEG_QUALITY}
          max={MAX_JPEG_QUALITY}
          step={0.05}
          value={quality()}
          onInput={(e) => setQuality(clampJpegQuality(parseFloat(e.currentTarget.value)))}
          class="w-full accent-accent cursor-pointer"
        />
      </div>

      <FileInput
        label={t(props.lang, 'tools_heicToJpg_uploadLabel')}
        hint={t(props.lang, 'tools_heicToJpg_uploadHint')}
        accept=".heic,.heif,image/heic,image/heif"
        multiple
        onFiles={handleFiles}
      />

      <p class="text-sm text-text-secondary">{t(props.lang, 'tools_heicToJpg_privacyNote')}</p>
      <p class="text-xs text-text-secondary">
        {t(props.lang, 'tools_heicToJpg_licenseNote')} —{' '}
        <a href="/licenses/heic-to/NOTICE.txt" class="underline hover:text-accent">
          {t(props.lang, 'tools_heicToJpg_licenseLink')}
        </a>
      </p>

      {/* Persistent live regions: per-file progress happens while focus stays on the file input */}
      <p class="sr-only" role="status" aria-live="polite" data-testid="heic-status">{announcement()}</p>
      <p class="sr-only" role="alert">{alertMessage()}</p>

      <Show when={items().length > 0}>
        <ul class="flex flex-col gap-2" data-testid="heic-file-list">
          <For each={items()}>
            {(item) => (
              <li class="flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-2">
                <div class="h-14 w-14 shrink-0 overflow-hidden rounded bg-surface">
                  <Show when={item.url}>
                    <img src={item.url} alt={item.outputName} class="h-full w-full object-cover" />
                  </Show>
                </div>
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <span class="truncate text-sm font-medium text-text-primary">{item.file.name}</span>
                  <div>{statusBadge(item)}</div>
                </div>
                <Show when={item.jpeg}>
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`${t(props.lang, 'tools_heicToJpg_download')} ${item.outputName}`}
                    onClick={() => downloadFile(item.jpeg!, item.outputName, 'image/jpeg')}
                  >
                    {t(props.lang, 'tools_heicToJpg_download')}
                  </Button>
                </Show>
              </li>
            )}
          </For>
        </ul>

        <div class="flex flex-wrap gap-2">
          <Show when={converted().length > 1}>
            <Button variant="primary" disabled={busy()} onClick={() => void downloadAll()}>
              {t(props.lang, 'tools_heicToJpg_downloadAll')}
            </Button>
          </Show>
          <Button variant="ghost" disabled={busy()} onClick={clear}>
            {t(props.lang, 'tools_heicToJpg_clear')}
          </Button>
        </div>
      </Show>
    </div>
  )
}
