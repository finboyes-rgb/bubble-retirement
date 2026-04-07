import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--c-accent-orange)] text-[var(--c-bg)] border-2 border-[var(--c-accent-orange)] shadow-[3px_3px_0_var(--c-border)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--c-border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
        outline:
          'bg-transparent text-[var(--c-text)] border-2 border-[var(--c-border)] shadow-[3px_3px_0_var(--c-border)] hover:border-[var(--c-accent-orange)] hover:text-[var(--c-accent-orange)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
        ghost:
          'bg-transparent text-[var(--c-text-muted)] border-2 border-transparent hover:text-[var(--c-text)] hover:border-[var(--c-border-light)]',
      },
      size: {
        sm: 'text-xs px-3 py-1.5 gap-1.5',
        md: 'text-sm px-4 py-2 gap-2',
        lg: 'text-base px-6 py-3 gap-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
