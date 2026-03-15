import { cva, type VariantProps } from 'class-variance-authority'
import type { JSX, ParentProps } from 'solid-js'
import { splitProps } from 'solid-js'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent-hover',
        secondary:
          'border border-border bg-surface-raised text-text-primary hover:bg-accent-light hover:border-accent',
        ghost: 'text-text-secondary hover:bg-accent-light hover:text-accent',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonVariantProps = VariantProps<typeof buttonVariants>

interface ButtonProps extends ParentProps {
  variant?: NonNullable<ButtonVariantProps['variant']>
  size?: NonNullable<ButtonVariantProps['size']>
  disabled?: boolean
  class?: string
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>
  type?: 'button' | 'submit' | 'reset'
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    'variant',
    'size',
    'disabled',
    'class',
    'onClick',
    'type',
    'children',
  ])

  return (
    <button
      type={local.type ?? 'button'}
      class={`${buttonVariants({ variant: local.variant, size: local.size })} ${local.class ?? ''}`}
      disabled={local.disabled}
      onClick={local.onClick}
    >
      {local.children}
    </button>
  )
}
