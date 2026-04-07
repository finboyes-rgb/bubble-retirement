import { cn } from '@/lib/utils'
import { LabelHTMLAttributes, forwardRef } from 'react'

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-xs font-mono uppercase tracking-widest text-[var(--c-text-muted)]',
        className
      )}
      {...props}
    />
  )
)
Label.displayName = 'Label'

export { Label }
