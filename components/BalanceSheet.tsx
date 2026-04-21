'use client'

import * as XLSX from 'xlsx'
import type { SimulationResult } from '@/lib/montecarlo'
import type { SimulationInputs, YearBand } from '@/lib/types'
import { formatCurrency, getPhaseExpenses } from '@/lib/utils'

interface BalanceSheetProps {
  result: SimulationResult
  inputs: SimulationInputs
}

function fmt(v: number) {
  return formatCurrency(v, true)
}

function fmtPct(v: number) {
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%'
}

const LABEL_W = 196
const COL_W = 90

type RowDef =
  | { type: 'section-header'; label: string }
  | { type: 'asset-header'; assetId: string; label: string }
  | { type: 'asset-metric'; assetId: string; metric: 'opening' | 'pct-growth' | 'dollar-growth' | 'fee' | 'tax' | 'withdrawal' | 'closing' }
  | { type: 'spacer' }
  | { type: 'total-assets' }
  | { type: 'income-stream'; streamId: string; label: string }
  | { type: 'income-tax'; streamId: string }
  | { type: 'total-income' }
  | { type: 'expense-metric'; metric: 'target-spending' | 'covered-by-income' | 'portfolio-drawdown' | 'lump-sum' }

const orange: React.CSSProperties = { color: 'var(--c-accent-orange)' }
const yellow: React.CSSProperties = { color: 'var(--c-accent-yellow)', opacity: 0.85 }
const muted: React.CSSProperties = { color: 'var(--c-text-muted)' }
const dim: React.CSSProperties = { color: 'var(--c-text-muted)', opacity: 0.4 }
const bright: React.CSSProperties = { color: 'var(--c-text)' }
const boldBright: React.CSSProperties = { color: 'var(--c-text)', fontWeight: 600 }

function getCellContent(
  row: RowDef,
  band: YearBand,
  inputs: SimulationInputs
): { value: string; style: React.CSSProperties } {
  const isPostRetirement = band.age >= inputs.retirementAge

  switch (row.type) {
    case 'asset-metric': {
      const data = band.assetMedians.find((m) => m.assetId === row.assetId)
      if (!data) return { value: '—', style: dim }
      switch (row.metric) {
        case 'opening':
          return data.medianOpeningBalance < 0.5
            ? { value: '—', style: dim }
            : { value: fmt(data.medianOpeningBalance), style: muted }
        case 'pct-growth': {
          if (data.medianOpeningBalance < 0.5) return { value: '—', style: dim }
          const pct = data.medianReturn / data.medianOpeningBalance
          return { value: fmtPct(pct), style: pct >= 0 ? yellow : orange }
        }
        case 'dollar-growth':
          if (Math.abs(data.medianReturn) < 0.5) return { value: '—', style: dim }
          return {
            value: (data.medianReturn >= 0 ? '+' : '') + fmt(data.medianReturn),
            style: data.medianReturn >= 0 ? yellow : orange,
          }
        case 'fee': {
          const asset = inputs.assets.find((a) => a.id === row.assetId)
          const feeRate = asset?.feeRate ?? 0
          if (data.medianOpeningBalance < 0.5 || feeRate === 0) return { value: '—', style: dim }
          return { value: '−' + fmt(data.medianOpeningBalance * feeRate / 100), style: orange }
        }
        case 'tax': {
          const asset = inputs.assets.find((a) => a.id === row.assetId)
          const taxRate = asset?.taxRate ?? 0
          const grossReturn = data.medianOpeningBalance * (asset?.expectedReturn ?? 0) / 100
          if (grossReturn < 0.5 || taxRate === 0) return { value: '—', style: dim }
          return { value: '−' + fmt(grossReturn * taxRate / 100), style: orange }
        }
        case 'withdrawal':
          return data.medianDraw < 0.5
            ? { value: '—', style: dim }
            : { value: '−' + fmt(data.medianDraw), style: orange }
        case 'closing':
          return data.medianValue < 0.5
            ? { value: '—', style: dim }
            : { value: fmt(data.medianValue), style: orange }
      }
      break
    }

    case 'total-assets':
      return { value: fmt(band.p50), style: boldBright }

    case 'income-stream': {
      const stream = inputs.incomeStreams.find((s) => s.id === row.streamId)
      if (!stream) return { value: '—', style: dim }
      const active = band.age >= stream.startAge && band.age <= stream.endAge
      return active
        ? { value: fmt(stream.annualAmount), style: bright }
        : { value: '—', style: dim }
    }

    case 'income-tax': {
      const stream = inputs.incomeStreams.find((s) => s.id === row.streamId)
      if (!stream) return { value: '—', style: dim }
      const active = band.age >= stream.startAge && band.age <= stream.endAge
      const taxRate = stream.taxRate ?? 0
      if (!active || taxRate === 0) return { value: '—', style: dim }
      return { value: '−' + fmt(stream.annualAmount * taxRate / 100), style: orange }
    }

    case 'total-income':
      return band.totalIncome < 0.5
        ? { value: '—', style: dim }
        : { value: fmt(band.totalIncome), style: boldBright }

    case 'expense-metric': {
      switch (row.metric) {
        case 'target-spending':
          return { value: fmt(getPhaseExpenses(band.age, inputs)), style: bright }
        case 'covered-by-income':
          return band.totalIncome < 0.5
            ? { value: '—', style: dim }
            : { value: '−' + fmt(band.totalIncome), style: yellow }
        case 'portfolio-drawdown':
          if (!isPostRetirement) return { value: '—', style: dim }
          return band.totalPortfolioDraw < 0.5
            ? { value: '—', style: dim }
            : { value: fmt(band.totalPortfolioDraw), style: orange }
        case 'lump-sum':
          return band.totalLumpSum < 0.5
            ? { value: '—', style: dim }
            : { value: fmt(band.totalLumpSum), style: orange }
      }
      break
    }

    default:
      return { value: '', style: {} }
  }
  return { value: '', style: {} }
}

const METRIC_LABELS: Record<string, string> = {
  opening: 'Opening balance',
  'pct-growth': '% growth',
  'dollar-growth': '$ growth',
  fee: 'Mgmt fees (est.)',
  tax: 'Tax (est.)',
  withdrawal: 'Withdrawal',
  closing: 'Closing balance',
  'target-spending': 'Annual expenses',
  'covered-by-income': 'Covered by income',
  'portfolio-drawdown': 'Portfolio drawdown',
  'lump-sum': 'Lump sums',
}

function exportToXlsx(result: SimulationResult, inputs: SimulationInputs) {
  const visibleAssets = inputs.assets.filter((a) => a.visible)
  const baseYear = new Date().getFullYear()
  const bands = result.bands

  const ageRow = ['Age', ...bands.map((b) => b.age)]
  const yearRow = ['Year', ...bands.map((b) => baseYear + (b.age - inputs.currentAge))]

  const sheetData: (string | number)[][] = [ageRow, yearRow, []]

  // Assets
  sheetData.push(['ASSETS'])
  for (const asset of visibleAssets) {
    sheetData.push([asset.name])
    sheetData.push(['  Opening balance', ...bands.map((b) => {
      const d = b.assetMedians.find((m) => m.assetId === asset.id)
      return d ? Math.round(d.medianOpeningBalance) : 0
    })])
    sheetData.push(['  $ growth', ...bands.map((b) => {
      const d = b.assetMedians.find((m) => m.assetId === asset.id)
      return d ? Math.round(d.medianReturn) : 0
    })])
    if ((asset.feeRate ?? 0) > 0) {
      sheetData.push(['  Mgmt fees (est.)', ...bands.map((b) => {
        const d = b.assetMedians.find((m) => m.assetId === asset.id)
        return d ? -Math.round(d.medianOpeningBalance * (asset.feeRate ?? 0) / 100) : 0
      })])
    }
    if ((asset.taxRate ?? 0) > 0) {
      sheetData.push(['  Tax (est.)', ...bands.map((b) => {
        const d = b.assetMedians.find((m) => m.assetId === asset.id)
        return d ? -Math.round(d.medianOpeningBalance * asset.expectedReturn / 100 * (asset.taxRate ?? 0) / 100) : 0
      })])
    }
    sheetData.push(['  Withdrawal', ...bands.map((b) => {
      const d = b.assetMedians.find((m) => m.assetId === asset.id)
      return d ? Math.round(d.medianDraw) : 0
    })])
    sheetData.push(['  Closing balance', ...bands.map((b) => {
      const d = b.assetMedians.find((m) => m.assetId === asset.id)
      return d ? Math.round(d.medianValue) : 0
    })])
  }
  sheetData.push(['TOTAL ASSETS (median, p50)', ...bands.map((b) => Math.round(b.p50))])
  sheetData.push(['p10', ...bands.map((b) => Math.round(b.p10))])
  sheetData.push(['p25', ...bands.map((b) => Math.round(b.p25))])
  sheetData.push(['p75', ...bands.map((b) => Math.round(b.p75))])
  sheetData.push(['p90', ...bands.map((b) => Math.round(b.p90))])
  sheetData.push([])

  // Income
  sheetData.push(['INCOME'])
  for (const stream of inputs.incomeStreams) {
    sheetData.push([stream.label, ...bands.map((b) => {
      const active = b.age >= stream.startAge && b.age <= stream.endAge
      return active ? stream.annualAmount : 0
    })])
    if ((stream.taxRate ?? 0) > 0) {
      sheetData.push([`  Tax (${stream.taxRate}%)`, ...bands.map((b) => {
        const active = b.age >= stream.startAge && b.age <= stream.endAge
        return active ? -Math.round(stream.annualAmount * (stream.taxRate ?? 0) / 100) : 0
      })])
    }
  }
  sheetData.push(['Total income', ...bands.map((b) => Math.round(b.totalIncome))])
  sheetData.push([])

  // Expenses
  sheetData.push(['EXPENSES'])
  sheetData.push(['Annual expenses', ...bands.map((b) => getPhaseExpenses(b.age, inputs))])
  sheetData.push(['Covered by income', ...bands.map((b) => Math.round(b.totalIncome))])
  sheetData.push(['Portfolio drawdown', ...bands.map((b) => Math.round(b.totalPortfolioDraw))])
  if (bands.some((b) => b.totalLumpSum > 0)) {
    sheetData.push(['Lump sums', ...bands.map((b) => Math.round(b.totalLumpSum))])
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet')
  XLSX.writeFile(wb, `bubble-retirement-balance-sheet.xlsx`)
}

export function BalanceSheet({ result, inputs }: BalanceSheetProps) {
  const visibleAssets = inputs.assets.filter((a) => a.visible)
  const baseYear = new Date().getFullYear()
  const bands = result.bands
  const hasLumpSums = bands.some((b) => b.totalLumpSum > 0.5)

  // Build row definitions
  const rows: RowDef[] = []

  rows.push({ type: 'section-header', label: 'ASSETS' })
  for (const asset of visibleAssets) {
    rows.push({ type: 'asset-header', assetId: asset.id, label: asset.name })
    rows.push({ type: 'asset-metric', assetId: asset.id, metric: 'opening' })
    rows.push({ type: 'asset-metric', assetId: asset.id, metric: 'pct-growth' })
    rows.push({ type: 'asset-metric', assetId: asset.id, metric: 'dollar-growth' })
    if ((asset.feeRate ?? 0) > 0) rows.push({ type: 'asset-metric', assetId: asset.id, metric: 'fee' })
    if ((asset.taxRate ?? 0) > 0) rows.push({ type: 'asset-metric', assetId: asset.id, metric: 'tax' })
    rows.push({ type: 'asset-metric', assetId: asset.id, metric: 'withdrawal' })
    rows.push({ type: 'asset-metric', assetId: asset.id, metric: 'closing' })
    rows.push({ type: 'spacer' })
  }
  rows.push({ type: 'total-assets' })
  rows.push({ type: 'spacer' })

  rows.push({ type: 'section-header', label: 'INCOME' })
  for (const stream of inputs.incomeStreams) {
    rows.push({ type: 'income-stream', streamId: stream.id, label: stream.label })
    if ((stream.taxRate ?? 0) > 0) rows.push({ type: 'income-tax', streamId: stream.id })
  }
  rows.push({ type: 'total-income' })
  rows.push({ type: 'spacer' })

  rows.push({ type: 'section-header', label: 'EXPENSES' })
  rows.push({ type: 'expense-metric', metric: 'target-spending' })
  rows.push({ type: 'expense-metric', metric: 'covered-by-income' })
  rows.push({ type: 'expense-metric', metric: 'portfolio-drawdown' })
  if (hasLumpSums) {
    rows.push({ type: 'expense-metric', metric: 'lump-sum' })
  }

  const baseLabelCell: React.CSSProperties = {
    position: 'sticky',
    left: 0,
    zIndex: 1,
    minWidth: LABEL_W,
    maxWidth: LABEL_W,
    padding: '3px 10px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
  }

  const baseDataCell: React.CSSProperties = {
    minWidth: COL_W,
    padding: '3px 8px',
    textAlign: 'right',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => exportToXlsx(result, inputs)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '6px 14px',
            border: '2px solid var(--c-border)',
            background: 'transparent',
            color: 'var(--c-text-muted)',
            cursor: 'pointer',
            boxShadow: '2px 2px 0 var(--c-border)',
            transition: 'color 120ms ease, border-color 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--c-text)'
            e.currentTarget.style.borderColor = 'var(--c-border-light)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--c-text-muted)'
            e.currentTarget.style.borderColor = 'var(--c-border)'
          }}
        >
          ↓ Download XLSX
        </button>
      </div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
        <thead>
          {/* Calendar year row */}
          <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
            <th
              style={{
                ...baseLabelCell,
                background: 'var(--c-bg)',
                fontWeight: 400,
                color: 'var(--c-text-muted)',
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                paddingBottom: 2,
              }}
            />
            {bands.map((band) => {
              const calYear = baseYear + (band.age - inputs.currentAge)
              const isRetire = band.age === inputs.retirementAge
              return (
                <th
                  key={band.age}
                  style={{
                    ...baseDataCell,
                    fontWeight: 400,
                    color: isRetire ? 'var(--c-accent-yellow)' : 'var(--c-text-muted)',
                    fontSize: 10,
                    letterSpacing: '0.04em',
                    borderLeft: isRetire ? '2px solid var(--c-accent-yellow)' : '1px solid transparent',
                    paddingBottom: 2,
                  }}
                >
                  {calYear}
                </th>
              )
            })}
          </tr>

          {/* Age row */}
          <tr style={{ borderBottom: '2px solid var(--c-border)' }}>
            <th
              style={{
                ...baseLabelCell,
                background: 'var(--c-bg)',
                fontWeight: 400,
                color: 'var(--c-text-muted)',
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                paddingTop: 2,
              }}
            >
              Age →
            </th>
            {bands.map((band) => {
              const isRetire = band.age === inputs.retirementAge
              return (
                <th
                  key={band.age}
                  style={{
                    ...baseDataCell,
                    fontWeight: isRetire ? 700 : 400,
                    color: isRetire ? 'var(--c-accent-yellow)' : 'var(--c-text-muted)',
                    fontSize: 10,
                    borderLeft: isRetire ? '2px solid var(--c-accent-yellow)' : '1px solid transparent',
                    paddingTop: 2,
                  }}
                >
                  {band.age}{isRetire ? ' ★' : ''}
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIdx) => {
            // Spacer
            if (row.type === 'spacer') {
              return (
                <tr key={`spacer-${rowIdx}`}>
                  <td style={{ ...baseLabelCell, background: 'var(--c-bg)', height: 10, padding: 0 }} />
                  {bands.map((band) => (
                    <td key={band.age} style={{ height: 10, padding: 0 }} />
                  ))}
                </tr>
              )
            }

            // Section header
            if (row.type === 'section-header') {
              return (
                <tr
                  key={`sh-${row.label}`}
                  style={{ borderTop: rowIdx > 0 ? '1px solid var(--c-border)' : undefined }}
                >
                  <td
                    style={{
                      ...baseLabelCell,
                      background: 'var(--c-surface)',
                      color: 'var(--c-text-muted)',
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      paddingTop: 7,
                      paddingBottom: 7,
                    }}
                  >
                    {row.label}
                  </td>
                  {bands.map((band) => {
                    const isRetire = band.age === inputs.retirementAge
                    return (
                      <td
                        key={band.age}
                        style={{
                          background: 'var(--c-surface)',
                          borderLeft: isRetire ? '2px solid var(--c-accent-yellow)' : '1px solid transparent',
                        }}
                      />
                    )
                  })}
                </tr>
              )
            }

            // Data rows
            const isAssetHeader = row.type === 'asset-header'
            const isSubMetric = row.type === 'asset-metric' || row.type === 'income-stream' || row.type === 'income-tax' || row.type === 'expense-metric'
            const isTotalRow = row.type === 'total-assets' || row.type === 'total-income'
            const isPortfolioDrawdown = row.type === 'expense-metric' && row.metric === 'portfolio-drawdown'

            let labelText = ''
            let labelIndent = 0
            let labelColor: string = 'var(--c-text)'
            let labelFontWeight = 400
            let labelFontSize = 11

            if (row.type === 'asset-header') {
              labelText = row.label
              labelFontWeight = 600
            } else if (row.type === 'asset-metric') {
              labelText = METRIC_LABELS[row.metric]
              labelIndent = 12
              labelColor = 'var(--c-text-muted)'
            } else if (row.type === 'total-assets') {
              labelText = 'TOTAL ASSETS'
              labelFontWeight = 700
              labelFontSize = 9
              labelColor = 'var(--c-text)'
            } else if (row.type === 'income-stream') {
              labelText = row.label
              labelIndent = 12
              labelColor = 'var(--c-text-muted)'
            } else if (row.type === 'income-tax') {
              const stream = inputs.incomeStreams.find((s) => s.id === row.streamId)
              labelText = `Tax (${(stream?.taxRate ?? 0).toFixed(0)}%)`
              labelIndent = 24
              labelColor = 'var(--c-text-muted)'
            } else if (row.type === 'total-income') {
              labelText = 'Total income'
              labelFontWeight = 600
            } else if (row.type === 'expense-metric') {
              labelText = METRIC_LABELS[row.metric]
              if (row.metric !== 'target-spending') {
                labelIndent = 12
                labelColor = 'var(--c-text-muted)'
              }
              if (isPortfolioDrawdown) {
                labelFontWeight = 600
                labelColor = 'var(--c-text)'
              }
            }

            return (
              <tr
                key={`row-${rowIdx}`}
                style={{
                  borderTop: isTotalRow || isPortfolioDrawdown ? '1px solid var(--c-border)' : undefined,
                }}
              >
                <td
                  style={{
                    ...baseLabelCell,
                    background: 'var(--c-bg)',
                    paddingLeft: labelIndent + 10,
                    color: labelColor,
                    fontWeight: labelFontWeight,
                    fontSize: labelFontSize,
                    letterSpacing: (row.type === 'total-assets') ? '0.1em' : undefined,
                    textTransform: (row.type === 'total-assets') ? 'uppercase' : undefined,
                    paddingTop: isAssetHeader ? 6 : 3,
                    paddingBottom: isSubMetric && !isAssetHeader ? 3 : isAssetHeader ? 2 : 3,
                    opacity: (row.type === 'asset-metric' && row.metric !== 'closing') ? 0.75 : 1,
                  }}
                >
                  {labelText}
                </td>
                {bands.map((band) => {
                  const isRetire = band.age === inputs.retirementAge
                  const { value, style } = getCellContent(row, band, inputs)
                  return (
                    <td
                      key={band.age}
                      style={{
                        ...baseDataCell,
                        ...style,
                        borderLeft: isRetire ? '2px solid var(--c-accent-yellow)' : '1px solid transparent',
                        paddingTop: isAssetHeader ? 6 : 3,
                        paddingBottom: isAssetHeader ? 2 : 3,
                      }}
                    >
                      {value}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </div>
  )
}
