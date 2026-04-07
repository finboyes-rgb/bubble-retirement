'use client'

import { cn } from '@/lib/utils'

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  className?: string
}

export function Slider({ value, onChange, min, max, step = 0.1, className }: SliderProps) {
  return (
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      min={min}
      max={max}
      step={step}
      className={cn('w-full cursor-pointer', className)}
      style={{
        accentColor: 'var(--c-accent-orange)',
        height: 16,
        background: 'transparent',
      }}
    />
  )
}
