import { createSignal } from 'solid-js'
import { Button } from './Button'
import { copyToClipboard } from '../../lib/clipboard'
import { iconSvg } from '../../lib/icons'

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
    <Button variant="ghost" size="sm" onClick={handleCopy} class={props.class}>
      <span class="inline-flex items-center gap-1.5">
        <span class="inline-flex" innerHTML={iconSvg(copied() ? 'shieldcheck' : 'copy', 'icon-sm')} />
        {copied() ? <span>Copied!</span> : props.label ? <span>{props.label}</span> : null}
      </span>
    </Button>
  )
}
