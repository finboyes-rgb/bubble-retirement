'use client'

import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface Tab {
  value: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({ tabs, value, onValueChange, children, className }: TabsProps) {
  return (
    <BaseTabs.Root
      value={value}
      onValueChange={onValueChange}
      className={cn('flex flex-col', className)}
    >
      <BaseTabs.List className="flex border-b-2 border-[var(--c-border)] gap-0">
        {tabs.map((tab) => (
          <BaseTabs.Tab
            key={tab.value}
            value={tab.value}
            className={cn(
              'px-4 py-2 text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors outline-none',
              'text-[var(--c-text-muted)] border-b-2 border-transparent -mb-[2px]',
              'hover:text-[var(--c-text)]',
              'data-[selected]:text-[var(--c-accent-orange)] data-[selected]:border-[var(--c-accent-orange)]'
            )}
          >
            {tab.label}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {children}
    </BaseTabs.Root>
  )
}

export { BaseTabs as TabsPanel }
