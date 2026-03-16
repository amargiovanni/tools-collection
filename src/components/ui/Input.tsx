import type { JSX } from 'solid-js'

let idCounter = 0

interface InputProps {
  type?: 'text' | 'number' | 'password' | 'color'
  label?: string
  placeholder?: string
  value?: string | number
  onInput?: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>
  onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>
  min?: number
  max?: number
  step?: number
  id?: string
  class?: string
  testId?: string
}

export function Input(props: InputProps) {
  const resolvedId = props.id ?? `input-${++idCounter}`

  return (
    <div class={`flex flex-col gap-1.5 ${props.class ?? ''}`}>
      {props.label && (
        <label for={resolvedId} class="text-sm font-medium text-text-secondary">
          {props.label}
        </label>
      )}
      <input
        id={resolvedId}
        data-testid={props.testId ?? 'input'}
        type={props.type ?? 'text'}
        placeholder={props.placeholder}
        value={props.value ?? ''}
        onInput={props.onInput}
        onChange={props.onChange}
        min={props.min}
        max={props.max}
        step={props.step}
        class="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
      />
    </div>
  )
}
