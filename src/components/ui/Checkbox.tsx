import type { JSX } from 'solid-js'

let idCounter = 0

interface CheckboxProps {
  label: string
  checked?: boolean
  onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>
  id?: string
  class?: string
}

export function Checkbox(props: CheckboxProps) {
  const resolvedId = props.id ?? `checkbox-${++idCounter}`

  return (
    <div class={`flex items-center gap-2 ${props.class ?? ''}`}>
      <input
        id={resolvedId}
        type="checkbox"
        checked={props.checked}
        onChange={props.onChange}
        class="h-4 w-4 rounded border-border text-accent focus:ring-border-focus cursor-pointer"
      />
      <label for={resolvedId} class="text-sm text-text-secondary cursor-pointer select-none">
        {props.label}
      </label>
    </div>
  )
}
