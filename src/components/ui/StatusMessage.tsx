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
  success: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  error: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5"/><path d="M12 16h.01"/>',
  warning: '<path d="M12 4 3 19h18z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
}

export function StatusMessage(props: StatusMessageProps) {
  return (
    <div
      class={statusVariants({ type: props.type })}
      role={props.type === 'error' ? 'alert' : 'status'}
      data-testid="status-message"
    >
      <span
        class="mt-px shrink-0"
        aria-hidden="true"
        innerHTML={`<svg class="icon icon-sm" viewBox="0 0 24 24">${icons[props.type]}</svg>`}
      />
      <span class="flex-1">{props.message}</span>
      <Show when={props.onDismiss}>
        <button
          type="button"
          class="shrink-0 text-current opacity-60 hover:opacity-100 cursor-pointer"
          onClick={props.onDismiss}
          aria-label="Dismiss"
          innerHTML='<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
        />
      </Show>
    </div>
  )
}
