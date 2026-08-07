import { createSignal } from 'solid-js'

let idCounter = 0

interface FileInputProps {
  accept?: string
  label?: string
  onFile: (file: File) => void
  id?: string
  class?: string
}

export function FileInput(props: FileInputProps) {
  const resolvedId = props.id ?? `file-${++idCounter}`
  const [fileName, setFileName] = createSignal<string>('')
  const [dragOver, setDragOver] = createSignal(false)

  const handleFile = (file: File) => {
    setFileName(file.name)
    props.onFile(file)
  }

  const handleChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files[0]
    if (file) handleFile(file)
  }

  return (
    <div class={`flex flex-col gap-1.5 ${props.class ?? ''}`} data-testid="file-input">
      {props.label && (
        <label for={resolvedId} class="text-sm font-medium text-text-secondary">
          {props.label}
        </label>
      )}
      <div
        class={`relative flex items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer focus-within:border-accent ${
          dragOver()
            ? 'border-accent bg-accent-light'
            : 'border-border hover:border-accent-hover'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById(resolvedId)?.click()}
      >
        <input
          id={resolvedId}
          type="file"
          accept={props.accept}
          onChange={handleChange}
          aria-label={props.label ?? 'Choose a file'}
          class="sr-only"
        />
        <span class="text-sm text-text-secondary">
          {fileName() || 'Drop a file here or click to browse'}
        </span>
      </div>
    </div>
  )
}
