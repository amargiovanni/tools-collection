import { createSignal, Show, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { Input } from '../ui/Input'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { generateMagnetLink, DEFAULT_MAGNET_TRACKERS } from '../../tools/bittorrent-magnet-link-generator'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

export default function BittorrentMagnetLinkGenerator(props: Props) {
  const [hash, setHash] = createSignal('')
  const [name, setName] = createSignal('')
  const [trackers, setTrackers] = createSignal(DEFAULT_MAGNET_TRACKERS.join('\n'))
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    const params = new URLSearchParams(location.search)
    const saved = await decodeState(params.get('s'))
    let shouldAutoGenerate = false
    if (saved) {
      if (typeof saved['hash'] === 'string') {
        setHash(saved['hash'])
        shouldAutoGenerate = saved['hash'].trim().length > 0
      }
      if (typeof saved['name'] === 'string') setName(saved['name'])
      if (typeof saved['trackers'] === 'string') setTrackers(saved['trackers'])
    } else {
      const sharedHash = params.get('hash')
      const sharedName = params.get('name')
      if (sharedHash) {
        setHash(sharedHash)
        shouldAutoGenerate = sharedHash.trim().length > 0
      }
      if (sharedName) setName(sharedName)
    }

    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { hash: hash(), name: name(), trackers: trackers() } },
      }))
    }

    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))

    if (shouldAutoGenerate) {
      handleGenerate()
    }
  })

  const handleGenerate = () => {
    const result = generateMagnetLink({
      hash: hash(),
      name: name(),
      trackers: trackers(),
    })

    if (result.ok) {
      setOutput(result.value.magnetLink)
      setError(null)
      setName(result.value.resourceName)
      setTrackers(result.value.trackers.join('\n'))
    } else {
      setError(translateError(props.lang, result.error))
      setOutput('')
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <Input
        label={t(props.lang, 'tools_bittorrentMagnetLinkGenerator_hashLabel')}
        placeholder={t(props.lang, 'tools_bittorrentMagnetLinkGenerator_hashPlaceholder')}
        value={hash()}
        onInput={(e) => setHash(e.currentTarget.value)}
      />
      <Input
        label={t(props.lang, 'tools_bittorrentMagnetLinkGenerator_nameLabel')}
        placeholder={t(props.lang, 'tools_bittorrentMagnetLinkGenerator_namePlaceholder')}
        value={name()}
        onInput={(e) => setName(e.currentTarget.value)}
      />
      <TextArea
        label={t(props.lang, 'tools_bittorrentMagnetLinkGenerator_trackersLabel')}
        placeholder={t(props.lang, 'tools_bittorrentMagnetLinkGenerator_trackersPlaceholder')}
        rows={8}
        value={trackers()}
        onInput={(e) => setTrackers(e.currentTarget.value)}
      />
      <p class="text-sm text-text-muted">{t(props.lang, 'tools_bittorrentMagnetLinkGenerator_trackersHint')}</p>
      <Button variant="primary" onClick={handleGenerate}>
        {t(props.lang, 'tools_bittorrentMagnetLinkGenerator_generate')}
      </Button>
      <Show when={error()}>
        <StatusMessage type="error" message={error()!} />
      </Show>
      <Show when={output()}>
        <div class="flex flex-col gap-3">
          <a
            href={output()}
            class="text-sm font-medium text-accent underline underline-offset-2 break-all"
          >
            {t(props.lang, 'tools_bittorrentMagnetLinkGenerator_openLink')}
          </a>
          <OutputPanel
            value={output()}
            label={t(props.lang, 'tools_bittorrentMagnetLinkGenerator_outputLabel')}
            rows={5}
          />
        </div>
      </Show>
    </div>
  )
}
