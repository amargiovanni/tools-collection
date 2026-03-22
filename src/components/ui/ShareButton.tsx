import { createSignal, onCleanup } from 'solid-js'
import { Button } from './Button'
import { encodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'

interface Props {
  label: string
  copiedLabel: string
  unavailableLabel: string
}

type FeedbackState = 'idle' | 'copied' | 'unavailable'

export function ShareButton(props: Props) {
  const [feedback, setFeedback] = createSignal<FeedbackState>('idle')

  // Register timeout ref at component root so onCleanup works correctly.
  // Never call onCleanup inside an async handler — it only works in reactive/setup context.
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
  })

  const resetAfter = (ms: number) => {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => setFeedback('idle'), ms)
  }

  const handleShare = async () => {
    if (feedback() !== 'idle') return

    const state = await new Promise<Record<string, unknown> | null>((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener(TOOL_STATE_RESPONSE, handler)
        resolve(null)
      }, 200)

      function handler(e: Event) {
        clearTimeout(timeout)
        window.removeEventListener(TOOL_STATE_RESPONSE, handler)
        resolve((e as CustomEvent<{ state: Record<string, unknown> }>).detail.state)
      }

      window.addEventListener(TOOL_STATE_RESPONSE, handler)
      window.dispatchEvent(new CustomEvent(TOOL_STATE_REQUEST))
    })

    if (state === null) {
      setFeedback('unavailable')
      resetAfter(1500)
      return
    }

    try {
      const encoded = await encodeState(state)
      const url = new URL(location.href)
      url.searchParams.set('s', encoded)
      await navigator.clipboard.writeText(url.toString())
      setFeedback('copied')
      resetAfter(1500)
    } catch {
      setFeedback('unavailable')
      resetAfter(1500)
    }
  }

  const label = () => {
    if (feedback() === 'copied') return `✓ ${props.copiedLabel}`
    if (feedback() === 'unavailable') return props.unavailableLabel
    return `🔗 ${props.label}`
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleShare}>
      {label()}
    </Button>
  )
}
