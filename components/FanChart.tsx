'use client'

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { SimulationResult } from '@/lib/montecarlo'
import { formatCurrency } from '@/lib/utils'

interface FanChartProps {
  result: SimulationResult
  retirementAge: number
  currentAge: number
}

interface TooltipPayload {
  dataKey: string
  value: number
  color: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: number
}) {
  if (!active || !payload?.length) return null

  const data = payload.reduce<Record<string, number>>((acc, p) => {
    acc[p.dataKey] = p.value
    return acc
  }, {})

  const rows: Array<{ label: string; key: string; color: string }> = [
    { label: 'p95', key: 'p95', color: 'var(--c-text-muted)' },
    { label: 'p75', key: 'p75', color: 'var(--c-text-muted)' },
    { label: 'p50 (median)', key: 'p50', color: 'var(--c-accent-orange)' },
    { label: 'p25', key: 'p25', color: 'var(--c-text-muted)' },
    { label: 'p10', key: 'p10', color: 'var(--c-text-muted)' },
  ]

  return (
    <div
      style={{
        background: 'var(--c-surface)',
        border: '2px solid var(--c-border)',
        padding: '10px 14px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        boxShadow: '4px 4px 0 var(--c-border)',
      }}
    >
      <div style={{ color: 'var(--c-text-muted)', marginBottom: 6, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Age {label}
      </div>
      {rows.map((row) =>
        data[row.key] !== undefined ? (
          <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: row.color, marginBottom: 2 }}>
            <span>{row.label}</span>
            <span>{formatCurrency(data[row.key], true)}</span>
          </div>
        ) : null
      )}
    </div>
  )
}

export function FanChart({ result, retirementAge, currentAge }: FanChartProps) {
  const BG = '#17130E'
  const ORANGE = '#FF4800'
  const YELLOW = '#F5DF00'
  const BORDER = '#4A3828'

  // Only show every 5 years on x-axis
  const tickFormatter = (age: number) => (age % 5 === 0 ? String(age) : '')

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart
        data={result.bands}
        margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
      >
        <XAxis
          dataKey="age"
          tickFormatter={tickFormatter}
          tick={{ fill: '#A89880', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={{ stroke: BORDER }}
          tickLine={false}
          domain={[currentAge, 'dataMax']}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v, true)}
          tick={{ fill: '#A89880', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip content={<CustomTooltip />} />

        {/* Retirement age reference line */}
        <ReferenceLine
          x={retirementAge}
          stroke={YELLOW}
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{
            value: 'Retire',
            position: 'insideTopRight',
            fill: YELLOW,
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            dy: -2,
          }}
        />

        {/* Fan chart using "erase" technique:
            1. Draw p95 fill (faint)
            2. Draw p5 fill using background colour (erases below p5)
            3. Draw p75 fill (medium)
            4. Draw p25 fill using background colour (erases below p25)
            5. Draw p50 as a line */}

        {/* Outer band: p5–p95 */}
        <Area
          type="monotone"
          dataKey="p95"
          stroke="none"
          fill={ORANGE}
          fillOpacity={0.08}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="p5"
          stroke="none"
          fill={BG}
          fillOpacity={1}
          isAnimationActive={false}
        />

        {/* Inner band: p25–p75 */}
        <Area
          type="monotone"
          dataKey="p75"
          stroke="none"
          fill={ORANGE}
          fillOpacity={0.18}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="p25"
          stroke="none"
          fill={BG}
          fillOpacity={1}
          isAnimationActive={false}
        />

        {/* Median line */}
        <Line
          type="monotone"
          dataKey="p50"
          stroke={ORANGE}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
