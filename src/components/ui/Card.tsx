interface CardProps {
  title: string
  description: string
  icon: string
  href: string
}

export function Card(props: CardProps) {
  return (
    <a
      href={props.href}
      class="group flex flex-col gap-2 rounded-xl border border-border bg-surface-raised p-4 transition-all hover:border-accent hover:shadow-md"
    >
      <div class="flex items-center gap-3">
        <span class="text-2xl" role="img" aria-hidden="true">
          {props.icon}
        </span>
        <h3 class="font-semibold text-text-primary group-hover:text-accent transition-colors">
          {props.title}
        </h3>
      </div>
      <p class="text-sm text-text-secondary line-clamp-2">{props.description}</p>
    </a>
  )
}
