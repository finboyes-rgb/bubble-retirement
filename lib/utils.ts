import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SimulationInputs } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      return `NZ$${(value / 1_000_000).toFixed(1)}M`
    }
    if (Math.abs(value) >= 1_000) {
      return `NZ$${(value / 1_000).toFixed(0)}K`
    }
    return `NZ$${value.toFixed(0)}`
  }
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/** Returns the applicable annual expense for a given age, based on expense phases or legacy annualExpenses. */
export function getPhaseExpenses(age: number, inputs: SimulationInputs): number {
  const phases = inputs.expensePhases
  if (phases && phases.length > 0) {
    const sorted = [...phases].sort((a, b) => a.fromAge - b.fromAge)
    for (const phase of sorted) {
      const end = phase.toAge ?? Infinity
      if (phase.fromAge <= age && age <= end) return phase.amount
    }
    return 0
  }
  return inputs.annualExpenses ?? 0
}
