import { onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from './share'

interface UseToolStateOptions {
  /** Called with saved state decoded from the URL ?s= parameter */
  onRestore: (saved: Record<string, unknown>) => void
  /** Returns current component state for sharing */
  getState: () => Record<string, unknown>
}

export function useToolState(options: UseToolStateOptions): void {
  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      options.onRestore(saved)
    }
    const handler = () => {
      window.dispatchEvent(
        new CustomEvent(TOOL_STATE_RESPONSE, {
          detail: { state: options.getState() },
        }),
      )
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })
}
