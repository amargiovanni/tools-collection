import { createSignal } from 'solid-js'
import { Button } from './Button'
import { copyToClipboard } from '../../lib/clipboard'

interface CopyButtonProps {
  getValue: () => string
  label?: string
  class?: string
}

export function CopyButton(props: CopyButtonProps) {
  const [copied, setCopied] = createSignal(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(props.getValue())
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      class={props.class}
    >
      {copied() ? '✓' : '📋'} {copied() ? (props.label ? '' : '') : (props.label ?? '')}
    </Button>
  )
}
