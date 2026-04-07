import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'mono'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--c-surface)] border-[var(--c-border)] text-[var(--c-text-muted)]',
  success: 'bg-[var(--c-surface)] border-[var(--c-accent-orange)] text-[var(--c-accent-orange)]',
  warning: 'bg-[var(--c-surface)] border-[var(--c-accent-yellow)] text-[var(--c-accent-yellow)]',
  danger:  'bg-[var(--c-surface)] border-[var(--c-border-light)] text-[var(--c-text-muted)]',
  mono:    'bg-[var(--c-bg)] border-[var(--c-border)] text-[var(--c-text)] font-mono',
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-xs font-mono',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
)
Badge.displayName = 'Badge'

export { Badge }
