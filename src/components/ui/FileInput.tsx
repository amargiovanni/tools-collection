import { createSignal } from 'solid-js'

let idCounter = 0

interface FileInputProps {
  accept?: string
  label?: string
  /** Text shown in the drop zone before a file is chosen */
  hint?: string
  /** Accept several files at once; they are passed to onFiles */
  multiple?: boolean
  onFile?: (file: File) => void
  onFiles?: (files: File[]) => void
  id?: string
  class?: string
}

export function FileInput(props: FileInputProps) {
  const resolvedId = props.id ?? `file-${++idCounter}`
  const [fileName, setFileName] = createSignal<string>('')
  const [dragOver, setDragOver] = createSignal(false)

  const handleFiles = (list: FileList | null | undefined) => {
    const files = Array.from(list ?? [])
    if (files.length === 0) return
    if (props.multiple) {
      // The caller lists the chosen files itself; keep the hint visible
      props.onFiles?.(files)
    } else {
      setFileName(files[0]!.name)
      props.onFile?.(files[0]!)
    }
  }

  const handleChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    handleFiles(input.files)
    // Allow choosing the same file(s) again
    input.value = ''
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer?.files)
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
          multiple={props.multiple}
          onChange={handleChange}
          aria-label={props.label ?? 'Choose a file'}
          class="sr-only"
        />
        <span class="text-sm text-text-secondary">
          {fileName() || props.hint || 'Drop a file here or click to browse'}
        </span>
      </div>
    </div>
  )
}
