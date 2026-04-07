'use client'

import type { SimulationResult } from '@/lib/montecarlo'
import type { SimulationInputs } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface YearlyTableProps {
  result: SimulationResult
  inputs: SimulationInputs
}

export function YearlyTable({ result, inputs }: YearlyTableProps) {
  const visibleAssets = inputs.assets.filter((a) => a.visible)
  const retirementAge = inputs.retirementAge

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          whiteSpace: 'nowrap',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '2px solid var(--c-border)',
              color: 'var(--c-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: 10,
            }}
          >
            <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 400 }}>Age</th>
            <th style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 400 }}>
              Portfolio (median)
            </th>
            {visibleAssets.map((a) => (
              <th key={a.id} style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 400 }}>
                {a.name}
              </th>
            ))}
            <th style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 400 }}>
              Total Income
            </th>
            <th style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 400 }}>
              Withdrawal
            </th>
          </tr>
        </thead>
        <tbody>
          {result.bands.map((band, i) => {
            const isRetirementRow = band.age === retirementAge
            const isEven = i % 2 === 0

            return (
              <tr
                key={band.age}
                style={{
                  background: isEven ? 'var(--c-bg)' : 'var(--c-surface)',
                  borderLeft: isRetirementRow
                    ? '3px solid var(--c-accent-yellow)'
                    : '3px solid transparent',
                  color: isRetirementRow ? 'var(--c-text)' : 'var(--c-text-muted)',
                }}
              >
                <td style={{ padding: '5px 12px', textAlign: 'left' }}>
                  <span
                    style={{
                      color: isRetirementRow
                        ? 'var(--c-accent-yellow)'
                        : 'var(--c-text-muted)',
                      fontWeight: isRetirementRow ? 700 : 400,
                    }}
                  >
                    {band.age}
                    {isRetirementRow && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 9,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--c-accent-yellow)',
                        }}
                      >
                        retire
                      </span>
                    )}
                  </span>
                </td>
                <td style={{ padding: '5px 12px', textAlign: 'right', color: 'var(--c-accent-orange)' }}>
                  {formatCurrency(band.p50, true)}
                </td>
                {visibleAssets.map((a) => {
                  const assetData = band.assetMedians.find((m) => m.assetId === a.id)
                  return (
                    <td key={a.id} style={{ padding: '5px 12px', textAlign: 'right' }}>
                      {assetData ? formatCurrency(assetData.medianValue, true) : '—'}
                    </td>
                  )
                })}
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>
                  {band.totalIncome > 0 ? formatCurrency(band.totalIncome, true) : '—'}
                </td>
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>
                  {band.totalWithdrawal > 0 ? formatCurrency(band.totalWithdrawal, true) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
