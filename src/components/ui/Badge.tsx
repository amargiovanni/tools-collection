import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        info: 'bg-accent-light text-accent',
        success: 'bg-success-light text-success',
        error: 'bg-error-light text-error',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

type BadgeVariantProps = VariantProps<typeof badgeVariants>

interface BadgeProps {
  variant?: NonNullable<BadgeVariantProps['variant']>
  text: string
}

export function Badge(props: BadgeProps) {
  return (
    <span class={badgeVariants({ variant: props.variant })}>
      {props.text}
    </span>
  )
}
