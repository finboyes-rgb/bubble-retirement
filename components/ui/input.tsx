import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefix?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefix, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            'flex items-center border-2 bg-[var(--c-bg)] transition-colors',
            error ? 'border-[var(--c-accent-orange)]' : 'border-[var(--c-border)] focus-within:border-[var(--c-border-light)]'
          )}
        >
          {prefix && (
            <span className="pl-3 text-[var(--c-text-muted)] font-mono text-sm select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'flex-1 bg-transparent px-3 py-2 text-sm text-[var(--c-text)] placeholder:text-[var(--c-text-dim)] outline-none font-mono',
              prefix && 'pl-1',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-[var(--c-accent-orange)] font-mono">{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
