'use client'

import { SimulationResult, findIncomeSuggestion, findRetirementAgeSuggestion } from '@/lib/montecarlo'
import type { SimulationInputs } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { useMemo } from 'react'

interface ResultsSummaryProps {
  result: SimulationResult
  inputs: SimulationInputs
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'orange' | 'yellow' | 'muted'
}) {
  const valueColor =
    accent === 'orange'
      ? 'text-[var(--c-accent-orange)]'
      : accent === 'yellow'
      ? 'text-[var(--c-accent-yellow)]'
      : 'text-[var(--c-text-muted)]'

  return (
    <div className="bg-[var(--c-surface)] border-2 border-[var(--c-border)] p-4 flex flex-col gap-1">
      <span className="text-xs font-mono uppercase tracking-widest text-[var(--c-text-muted)]">
        {label}
      </span>
      <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
    </div>
  )
}

export function ResultsSummary({ result, inputs }: ResultsSummaryProps) {
  const { successProbability, medianAtRetirement, medianAtEnd, p10AtRetirement, p90AtRetirement } =
    result

  const successAccent =
    successProbability >= 90 ? 'orange' : successProbability >= 70 ? 'yellow' : 'muted'

  const showSuggestions = successProbability < 80

  const suggestions = useMemo(() => {
    if (!showSuggestions) return { income: null, retirementAge: null }
    return {
      income: findIncomeSuggestion(inputs),
      retirementAge: findRetirementAgeSuggestion(inputs),
    }
  }, [showSuggestions, inputs])

  return (
    <div className="flex flex-col gap-4">
      {/* 2×2 stat grid */}
      <div className="grid grid-cols-2 gap-0 border-2 border-[var(--c-border)] shadow-[4px_4px_0_var(--c-border)]">
        <div className="border-r border-b border-[var(--c-border)]">
          <StatCard
            label="Success probability"
            value={formatPercent(successProbability, 0)}
            accent={successAccent}
          />
        </div>
        <div className="border-b border-[var(--c-border)]">
          <StatCard
            label="Median at retirement"
            value={formatCurrency(medianAtRetirement, true)}
          />
        </div>
        <div className="border-r border-[var(--c-border)]">
          <StatCard
            label="Median at end"
            value={formatCurrency(medianAtEnd, true)}
          />
        </div>
        <div>
          <StatCard
            label="Range at retirement"
            value={`${formatCurrency(p10AtRetirement, true)} – ${formatCurrency(p90AtRetirement, true)}`}
          />
        </div>
      </div>

      {/* Auto-suggestions */}
      {showSuggestions && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--c-text-muted)]">
            To reach 90% success
          </span>
          {suggestions.income !== null && (
            <div className="border-2 border-[var(--c-accent-yellow)] p-4 shadow-[3px_3px_0_var(--c-accent-yellow)]">
              <span className="text-sm text-[var(--c-text)]">
                Increase annual employment income by{' '}
                <span className="font-mono text-[var(--c-accent-yellow)]">
                  {formatCurrency(suggestions.income)}
                </span>
              </span>
            </div>
          )}
          {suggestions.retirementAge !== null && (
            <div className="border-2 border-[var(--c-accent-yellow)] p-4 shadow-[3px_3px_0_var(--c-accent-yellow)]">
              <span className="text-sm text-[var(--c-text)]">
                Delay retirement by{' '}
                <span className="font-mono text-[var(--c-accent-yellow)]">
                  {suggestions.retirementAge} year{suggestions.retirementAge === 1 ? '' : 's'}
                </span>{' '}
                to age{' '}
                <span className="font-mono text-[var(--c-accent-yellow)]">
                  {inputs.retirementAge + suggestions.retirementAge}
                </span>
              </span>
            </div>
          )}
          {suggestions.income === null && suggestions.retirementAge === null && (
            <div className="border-2 border-[var(--c-border)] p-4 text-sm text-[var(--c-text-muted)]">
              90% success not achievable within modelled parameters.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
