import type { JSX } from 'solid-js'
import { For } from 'solid-js'

let idCounter = 0

export interface SelectOption {
  readonly value: string
  readonly label: string
}

interface SelectProps {
  options: readonly SelectOption[]
  label?: string
  value?: string
  onChange?: JSX.EventHandlerUnion<HTMLSelectElement, Event>
  id?: string
  class?: string
}

export function Select(props: SelectProps) {
  const resolvedId = props.id ?? `select-${++idCounter}`

  return (
    <div class={`flex flex-col gap-1.5 ${props.class ?? ''}`}>
      {props.label && (
        <label for={resolvedId} class="text-sm font-medium text-text-secondary">
          {props.label}
        </label>
      )}
      <select
        id={resolvedId}
        value={props.value}
        onChange={props.onChange}
        class="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus cursor-pointer"
      >
        <For each={props.options}>
          {(opt) => <option value={opt.value}>{opt.label}</option>}
        </For>
      </select>
    </div>
  )
}
