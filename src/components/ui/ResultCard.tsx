import { CopyButton } from './CopyButton'

interface ResultCardProps {
  label: string
  value: string
}

export function ResultCard(props: ResultCardProps) {
  return (
    <div class="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface-raised p-3" data-testid="result-card">
      <div class="min-w-0 flex-1">
        <span class="text-xs text-text-muted">{props.label}</span>
        <p class="font-mono text-sm text-text-primary break-all whitespace-pre-wrap">{props.value}</p>
      </div>
      <div class="shrink-0">
        <CopyButton getValue={() => props.value} />
      </div>
    </div>
  )
}
