import { cva, type VariantProps } from 'class-variance-authority'
import { Show } from 'solid-js'

const statusVariants = cva(
  'flex items-start gap-2 rounded-lg p-3 text-sm',
  {
    variants: {
      type: {
        success: 'bg-success-light text-success border border-success/20',
        error: 'bg-error-light text-error border border-error/20',
        warning: 'bg-warning-light text-warning border border-warning/20',
      },
    },
  },
)

type StatusVariantProps = VariantProps<typeof statusVariants>

interface StatusMessageProps {
  type: NonNullable<StatusVariantProps['type']>
  message: string
  onDismiss?: () => void
}

const icons: Record<string, string> = {
  success: '✓',
  error: '✗',
  warning: '⚠',
}

export function StatusMessage(props: StatusMessageProps) {
  return (
    <div
      class={statusVariants({ type: props.type })}
      role={props.type === 'error' ? 'alert' : 'status'}
      data-testid="status-message"
    >
      <span class="shrink-0 font-bold">{icons[props.type]}</span>
      <span class="flex-1">{props.message}</span>
      <Show when={props.onDismiss}>
        <button
          type="button"
          class="shrink-0 text-current opacity-60 hover:opacity-100 cursor-pointer"
          onClick={props.onDismiss}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </Show>
    </div>
  )
}
