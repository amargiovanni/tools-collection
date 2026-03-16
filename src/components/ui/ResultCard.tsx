import { CopyButton } from './CopyButton'

interface ResultCardProps {
  label: string
  value: string
}

export function ResultCard(props: ResultCardProps) {
  return (
    <div class="flex items-center justify-between rounded-lg border border-border bg-surface-raised p-3">
      <div class="min-w-0 flex-1">
        <span class="text-xs text-text-muted">{props.label}</span>
        <p class="truncate font-mono text-sm text-text-primary">{props.value}</p>
      </div>
      <CopyButton getValue={() => props.value} />
    </div>
  )
}
