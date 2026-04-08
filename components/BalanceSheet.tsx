'use client'

import type { SimulationResult } from '@/lib/montecarlo'
import type { SimulationInputs } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface BalanceSheetProps {
  result: SimulationResult
  inputs: SimulationInputs
}

const CELL = { padding: '4px 10px', textAlign: 'right' as const }
const CELL_L = { padding: '4px 10px', textAlign: 'left' as const }

function fmt(v: number) {
  return formatCurrency(v, true)
}

export function BalanceSheet({ result, inputs }: BalanceSheetProps) {
  const visibleAssets = inputs.assets.filter((a) => a.visible)
  const baseYear = new Date().getFullYear()

  // Build flat rows: one per (band × visibleAsset)
  type Row = {
    year: number
    age: number
    assetName: string
    isFirstAsset: boolean
    isRetirementYear: boolean
    opening: number
    returnEarned: number
    income: number
    withdrawal: number
    closing: number
  }

  const rows: Row[] = []
  for (const band of result.bands) {
    const calYear = baseYear + (band.age - inputs.currentAge)
    const isRetirementYear = band.age === inputs.retirementAge

    visibleAssets.forEach((asset, assetIdx) => {
      const data = band.assetMedians.find((m) => m.assetId === asset.id)
      if (!data) return
      rows.push({
        year: calYear,
        age: band.age,
        assetName: asset.name,
        isFirstAsset: assetIdx === 0,
        isRetirementYear,
        opening: data.medianOpeningBalance,
        returnEarned: data.medianReturn,
        income: data.medianIncome,
        withdrawal: data.medianWithdrawal,
        closing: data.medianValue,
      })
    })
  }

  const colMuted: React.CSSProperties = { color: 'var(--c-text-muted)' }
  const colOrange: React.CSSProperties = { color: 'var(--c-accent-orange)' }
  const colGreen: React.CSSProperties = { color: 'var(--c-accent-yellow)', opacity: 0.85 }

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
            <th style={{ ...CELL_L, fontWeight: 400 }}>Year</th>
            <th style={{ ...CELL_L, fontWeight: 400 }}>Age</th>
            <th style={{ ...CELL_L, fontWeight: 400 }}>Asset</th>
            <th style={{ ...CELL, fontWeight: 400 }}>Opening</th>
            <th style={{ ...CELL, fontWeight: 400 }}>+ Return</th>
            <th style={{ ...CELL, fontWeight: 400 }}>+ Income</th>
            <th style={{ ...CELL, fontWeight: 400 }}>− Withdrawal</th>
            <th style={{ ...CELL, fontWeight: 400 }}>= Closing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const isEvenYear = Math.floor(idx / visibleAssets.length) % 2 === 0
            const isLastAssetInGroup = !rows[idx + 1] || rows[idx + 1].isFirstAsset

            return (
              <tr
                key={`${row.year}-${row.assetName}`}
                style={{
                  background: isEvenYear ? 'var(--c-bg)' : 'var(--c-surface)',
                  borderLeft: row.isRetirementYear && row.isFirstAsset
                    ? '3px solid var(--c-accent-yellow)'
                    : row.isRetirementYear
                    ? '3px solid var(--c-accent-yellow)'
                    : '3px solid transparent',
                  borderBottom: isLastAssetInGroup
                    ? '1px solid var(--c-border)'
                    : 'none',
                }}
              >
                {/* Year — only shown on first asset row of group */}
                <td style={{ ...CELL_L, ...colMuted }}>
                  {row.isFirstAsset ? row.year : ''}
                </td>

                {/* Age — only shown on first asset row */}
                <td style={{ ...CELL_L }}>
                  {row.isFirstAsset ? (
                    <span
                      style={{
                        color: row.isRetirementYear
                          ? 'var(--c-accent-yellow)'
                          : 'var(--c-text-muted)',
                        fontWeight: row.isRetirementYear ? 700 : 400,
                      }}
                    >
                      {row.age}
                      {row.isRetirementYear && (
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
                  ) : ''}
                </td>

                {/* Asset name */}
                <td style={{ ...CELL_L, ...colMuted, opacity: 0.7 }}>
                  {row.assetName}
                </td>

                {/* Opening */}
                <td style={{ ...CELL, ...colMuted }}>
                  {row.opening > 0 ? fmt(row.opening) : '—'}
                </td>

                {/* Return */}
                <td style={{ ...CELL, ...colGreen }}>
                  {row.returnEarned !== 0
                    ? (row.returnEarned >= 0 ? '+' : '') + fmt(row.returnEarned)
                    : '—'}
                </td>

                {/* Income */}
                <td style={{ ...CELL, ...colMuted }}>
                  {row.income > 0.5 ? fmt(row.income) : '—'}
                </td>

                {/* Withdrawal */}
                <td style={{ ...CELL, color: row.withdrawal > 0.5 ? 'var(--c-accent-orange)' : 'var(--c-text-muted)' }}>
                  {row.withdrawal > 0.5 ? fmt(row.withdrawal) : '—'}
                </td>

                {/* Closing */}
                <td style={{ ...CELL, ...colOrange }}>
                  {fmt(row.closing)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
