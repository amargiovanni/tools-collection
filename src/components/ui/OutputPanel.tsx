import { TextArea } from './TextArea'
import { CopyButton } from './CopyButton'

interface OutputPanelProps {
  value: string
  label?: string
  copyable?: boolean
  monospace?: boolean
  rows?: number
  class?: string
}

export function OutputPanel(props: OutputPanelProps) {
  const isCopyable = () => props.copyable !== false
  const isMono = () => props.monospace !== false

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
    </div>
  )
}
