import {
  createContext,
  createSignal,
  useContext,
  For,
  type ParentProps,
} from 'solid-js'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>()

let nextId = 0
const MAX_VISIBLE = 3
const AUTO_DISMISS_MS = 3000

export function ToastProvider(props: ParentProps) {
  const [toasts, setToasts] = createSignal<Toast[]>([])

  function show(message: string, type: ToastType = 'success') {
    const id = ++nextId
    setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, AUTO_DISMISS_MS)
  }

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const typeStyles: Record<ToastType, string> = {
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    info: 'bg-accent text-white',
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {props.children}
      <div
        class="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        <For each={toasts()}>
          {(toast) => (
            <div
              class={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm shadow-lg animate-in slide-in-from-right ${typeStyles[toast.type]}`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                class="ml-2 opacity-70 hover:opacity-100 cursor-pointer"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}
        </For>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
