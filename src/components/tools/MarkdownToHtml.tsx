import { createMemo, createSignal } from 'solid-js'
import { useToolState } from '../../lib/useToolState'
import { TextArea } from '../ui/TextArea'
import { Checkbox } from '../ui/Checkbox'
import { OutputPanel } from '../ui/OutputPanel'
import { StatusMessage } from '../ui/StatusMessage'
import { convertMarkdownToHtml } from '../../tools/markdown-to-html'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'

interface Props {
  lang: Language
}

const DEFAULT_INPUT = `# Hello, world!

This is a **markdown to HTML** converter with a _live preview_.

## Features

- Headings, lists, *emphasis*, ~~strikethrough~~
- [Links](https://example.com) and \`inline code\`
- Code blocks, blockquotes and tables

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`
}
\`\`\`

> Tip: toggle the options to tweak the output.

| Feature | Supported |
| --- | :---: |
| GFM tables | yes |
| Task lists | yes |
`

export default function MarkdownToHtml(props: Props) {
  const [input, setInput] = createSignal(DEFAULT_INPUT)
  const [gfm, setGfm] = createSignal(true)
  const [linkify, setLinkify] = createSignal(true)
  const [breaks, setBreaks] = createSignal(false)

  useToolState({
    onRestore(saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      if (typeof saved['gfm'] === 'boolean') setGfm(saved['gfm'])
      if (typeof saved['linkify'] === 'boolean') setLinkify(saved['linkify'])
      if (typeof saved['breaks'] === 'boolean') setBreaks(saved['breaks'])
    },
    getState: () => ({ input: input(), gfm: gfm(), linkify: linkify(), breaks: breaks() }),
  })

  const result = createMemo(() =>
    convertMarkdownToHtml(input(), { gfm: gfm(), linkify: linkify(), breaks: breaks() }),
  )

  const html = () => {
    const r = result()
    return r.ok ? r.value : ''
  }

  const error = () => {
    const r = result()
    if (r.ok) return null
    if (r.error.code === 'EMPTY_INPUT') return null
    return translateError(props.lang, r.error)
  }

  return (
    <div class="flex flex-col gap-4">
      <TextArea
        label={t(props.lang, 'tools_markdownToHtml_inputLabel')}
        placeholder={t(props.lang, 'tools_markdownToHtml_placeholder')}
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        monospace
        rows={12}
      />

      <div class="flex flex-wrap gap-4">
        <Checkbox
          label={t(props.lang, 'tools_markdownToHtml_optionGfm')}
          checked={gfm()}
          onChange={(e) => setGfm(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_markdownToHtml_optionLinkify')}
          checked={linkify()}
          onChange={(e) => setLinkify(e.currentTarget.checked)}
        />
        <Checkbox
          label={t(props.lang, 'tools_markdownToHtml_optionBreaks')}
          checked={breaks()}
          onChange={(e) => setBreaks(e.currentTarget.checked)}
        />
      </div>

      {error() && <StatusMessage type="error" message={error()!} />}

      <OutputPanel
        value={html()}
        label={t(props.lang, 'tools_markdownToHtml_outputLabel')}
        monospace
        rows={10}
      />

      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-text-secondary">
          {t(props.lang, 'tools_markdownToHtml_previewLabel')}
        </span>
        <div
          class="markdown-preview rounded-lg border border-border bg-surface-raised p-4 text-sm text-text-primary"
          innerHTML={html()}
        />
      </div>
    </div>
  )
}
