import type { JSX } from 'solid-js'

let idCounter = 0

interface TextAreaProps {
  label?: string
  placeholder?: string
  rows?: number
  readonly?: boolean
  value?: string
  onInput?: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent>
  id?: string
  class?: string
  monospace?: boolean
  testId?: string
}

export function TextArea(props: TextAreaProps) {
  const resolvedId = props.id ?? `textarea-${++idCounter}`

  return (
    <div class={`flex flex-col gap-1.5 ${props.class ?? ''}`}>
      {props.label && (
        <label for={resolvedId} class="text-sm font-medium text-text-secondary">
          {props.label}
        </label>
      )}
      <textarea
        id={resolvedId}
        data-testid={props.testId ?? 'textarea'}
        placeholder={props.placeholder}
        rows={props.rows ?? 6}
        readonly={props.readonly}
        value={props.value ?? ''}
        onInput={props.onInput}
        class={`w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus resize-y ${
          props.readonly ? 'bg-surface cursor-default' : ''
        } ${props.monospace ? 'font-mono' : ''}`}
      />
    </div>
  )
}
