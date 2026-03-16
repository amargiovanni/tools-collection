import { Suspense } from 'solid-js'
import { toolComponents } from '../config/tool-components'
import type { Language } from '../i18n'

interface Props {
  toolId: string
  lang: Language
}

export default function ToolRenderer(props: Props) {
  const Component = toolComponents[props.toolId]

  if (!Component) {
    return (
      <div class="rounded-lg border border-border bg-surface-raised p-8 text-center text-text-muted">
        Tool not found
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div class="flex items-center justify-center py-12">
          <div class="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      }
    >
      <Component lang={props.lang} />
    </Suspense>
  )
}
