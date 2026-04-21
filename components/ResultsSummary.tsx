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
      ? 'var(--c-accent-orange)'
      : accent === 'yellow'
      ? 'var(--c-accent-yellow)'
      : 'var(--c-text-muted)'

  return (
    <div
      className="bg-[var(--c-surface)] p-4 flex flex-col gap-1"
      style={{ transition: 'background 140ms ease', cursor: 'default' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--c-bg)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--c-surface)' }}
    >
      <span className="text-xs font-mono uppercase tracking-widest text-[var(--c-text-muted)]">
        {label}
      </span>
      <span className="text-xl font-bold" style={{ color: valueColor }}>{value}</span>
    </div>
  )
}

export function ResultsSummary({ result, inputs }: ResultsSummaryProps) {
  const { successProbability, medianAtRetirement, medianAtEnd, p10AtRetirement, p90AtRetirement } =
    result

  // First age at which p10 portfolio hits zero — "money runs out at 90% confidence before this age"
  const p10DepletionAge = result.bands
    .filter((b) => b.age > inputs.retirementAge)
    .find((b) => b.p10 <= 0)?.age ?? null

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
      {/* Asymmetric stat layout — hero success probability + 3-col row */}
      <div className="border-2 border-[var(--c-border)] shadow-[4px_4px_0_var(--c-border)]" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Hero row — success probability */}
        <div
          className="p-5 bg-[var(--c-surface)]"
          style={{ borderBottom: '2px solid var(--c-border)', transition: 'background 140ms ease', cursor: 'default' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--c-bg)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--c-surface)' }}
        >
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--c-text-muted)] block mb-2">
            Success probability
          </span>
          <span
            className="font-bold"
            style={{
              fontSize: 'clamp(40px, 6vw, 56px)',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontFamily: 'var(--font-mono)',
              color:
                successAccent === 'orange'
                  ? 'var(--c-accent-orange)'
                  : successAccent === 'yellow'
                  ? 'var(--c-accent-yellow)'
                  : 'var(--c-text-muted)',
            }}
          >
            {formatPercent(successProbability, 0)}
          </span>
        </div>

        {/* Supporting stats — 2×2 grid */}
        <div className="grid grid-cols-2">
          <div style={{ borderRight: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
            <StatCard label="Median at retirement" value={formatCurrency(medianAtRetirement, true)} />
          </div>
          <div style={{ borderBottom: '1px solid var(--c-border)' }}>
            <StatCard label="Median at end" value={formatCurrency(medianAtEnd, true)} />
          </div>
          <div style={{ borderRight: '1px solid var(--c-border)' }}>
            <StatCard
              label="Range at retirement (p10–p90)"
              value={`${formatCurrency(p10AtRetirement, true)}–${formatCurrency(p90AtRetirement, true)}`}
            />
          </div>
          <div>
            <StatCard
              label="Runs dry at (worst 10%)"
              value={p10DepletionAge != null ? `Age ${p10DepletionAge}` : `Age ${inputs.lifeExpectancy}+`}
              accent={p10DepletionAge != null && p10DepletionAge < inputs.lifeExpectancy ? 'muted' : 'yellow'}
            />
          </div>
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
