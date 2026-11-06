import { onMount, onCleanup } from 'solid-js'
import { decodeState, readSharedParam, withoutLegacyParam, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from './share'

interface UseToolStateOptions {
  /** Called with saved state decoded from the URL #s= fragment (or a legacy ?s=) */
  onRestore: (saved: Record<string, unknown>) => void
  /** Returns current component state for sharing */
  getState: () => Record<string, unknown>
}

export function useToolState(options: UseToolStateOptions): void {
  onMount(async () => {
    const shared = readSharedParam(location)
    // A legacy ?s= link: take the state out of the query so it is not sent
    // again on reload or kept in server-visible history entries.
    if (shared?.legacy) history.replaceState(history.state, '', withoutLegacyParam(location.href))
    const saved = await decodeState(shared?.value ?? null)
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
