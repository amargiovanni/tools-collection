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

  return <Component lang={props.lang} />
}
