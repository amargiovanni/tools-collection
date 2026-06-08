import { Show } from 'solid-js'
import { TextArea } from './TextArea'
import { CopyButton } from './CopyButton'

interface OutputPanelProps {
  value: string
  label?: string
  copyable?: boolean
  monospace?: boolean
  rows?: number
  class?: string
  /** Show a character/line count under the output (default true). */
  showCount?: boolean
}

export function OutputPanel(props: OutputPanelProps) {
  const isCopyable = () => props.copyable !== false
  const isMono = () => props.monospace !== false
  const showCount = () => props.showCount !== false
  const charCount = () => props.value.length
  const lineCount = () => (props.value ? props.value.split('\n').length : 0)

  return (
    <div class={`relative ${props.class ?? ''}`} data-testid="output-panel">
      <TextArea
        label={props.label}
        value={props.value}
        readonly
        monospace={isMono()}
        rows={props.rows ?? 6}
      />
      {isCopyable() && props.value && (
        <div class="absolute right-2 top-7">
          <CopyButton getValue={() => props.value} />
        </div>
      )}
      <Show when={showCount() && props.value}>
        <p class="mt-1.5 text-right font-mono text-xs text-text-muted tabular-nums" aria-hidden="true">
          {charCount().toLocaleString()} chars · {lineCount().toLocaleString()} lines
        </p>
      </Show>
    </div>
  )
}
