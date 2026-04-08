'use client'

import { useState, useMemo } from 'react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { runSimulation } from '@/lib/montecarlo'
import type { SimulationInputs } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface ScenarioComparisonProps {
  baseInputs: SimulationInputs
  bgColor?: string
}

const SCENARIOS = [
  {
    key: 'pessimistic',
    label: 'Pessimistic',
    color: '#A89880',
    delta: { returnDelta: -2, volatilityDelta: 5, inflationDelta: 1 },
  },
  {
    key: 'base',
    label: 'Base',
    color: '#FF4800',
    delta: { returnDelta: 0, volatilityDelta: 0, inflationDelta: 0 },
  },
  {
    key: 'optimistic',
    label: 'Optimistic',
    color: '#F5DF00',
    delta: { returnDelta: 2, volatilityDelta: -2, inflationDelta: -0.5 },
  },
] as const

function applyDelta(
  inputs: SimulationInputs,
  delta: { returnDelta: number; volatilityDelta: number; inflationDelta: number }
): SimulationInputs {
  return {
    ...inputs,
    inflationRate: Math.max(0, inputs.inflationRate + delta.inflationDelta),
    assets: inputs.assets.map((a) => ({
      ...a,
      expectedReturn: Math.max(0, a.expectedReturn + delta.returnDelta),
      volatility: Math.max(0, a.volatility + delta.volatilityDelta),
    })),
  }
}

type ViewMode = 'overlay' | 'tabbed'

export function ScenarioComparison({ baseInputs, bgColor = '#17130E' }: ScenarioComparisonProps) {
  const [mode, setMode] = useState<ViewMode>('overlay')
  const [activeTab, setActiveTab] = useState<'pessimistic' | 'base' | 'optimistic'>('base')

  const results = useMemo(() => {
    return SCENARIOS.map((s) => ({
      ...s,
      inputs: applyDelta(baseInputs, s.delta),
      result: runSimulation(applyDelta(baseInputs, s.delta)),
    }))
  }, [baseInputs])

  const BG = bgColor
  const BORDER = '#4A3828'
  const YELLOW = '#F5DF00'
  const tickFormatter = (age: number) => (age % 5 === 0 ? String(age) : '')

  if (mode === 'tabbed') {
    const activeScenario = results.find((r) => r.key === activeTab)!
    return (
      <div className="flex flex-col gap-4">
        <ModeToggle mode={mode} onModeChange={setMode} />
        <div className="flex gap-0 border-b-2 border-[var(--c-border)]">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveTab(s.key)}
              style={{
                color: activeTab === s.key ? s.color : 'var(--c-text-muted)',
                borderBottom: activeTab === s.key ? `2px solid ${s.color}` : '2px solid transparent',
              }}
              className="flex-1 py-2 text-xs font-mono uppercase tracking-widest cursor-pointer bg-transparent border-0 mb-[-2px] transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
        <ScenarioStats scenario={activeScenario} />
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={activeScenario.result.bands}
            margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
          >
            <XAxis
              dataKey="age"
              tickFormatter={tickFormatter}
              tick={{ fill: '#A89880', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: BORDER }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v, true)}
              tick={{ fill: '#A89880', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <ReferenceLine
              x={baseInputs.retirementAge}
              stroke={YELLOW}
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="p95"
              stroke="none"
              fill={activeScenario.color}
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
            <Area
              type="monotone"
              dataKey="p75"
              stroke="none"
              fill={activeScenario.color}
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
            <Line
              type="monotone"
              dataKey="p50"
              stroke={activeScenario.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Overlay mode: merge bands from all 3 scenarios into one dataset by age
  const mergedData = results[0].result.bands.map((band, i) => ({
    age: band.age,
    pessimistic_p50: results[0].result.bands[i].p50,
    base_p50: results[1].result.bands[i].p50,
    optimistic_p50: results[2].result.bands[i].p50,
  }))

  return (
    <div className="flex flex-col gap-4">
      <ModeToggle mode={mode} onModeChange={setMode} />
      <div className="flex gap-6 flex-wrap">
        {results.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className="inline-block w-6 h-0.5"
              style={{ background: s.color, display: 'inline-block' }}
            />
            <span className="text-xs font-mono text-[var(--c-text-muted)]">
              {s.label} — {s.result.successProbability.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={mergedData}
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <XAxis
            dataKey="age"
            tickFormatter={tickFormatter}
            tick={{ fill: '#A89880', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            axisLine={{ stroke: BORDER }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v, true)}
            tick={{ fill: '#A89880', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <ReferenceLine
            x={baseInputs.retirementAge}
            stroke={YELLOW}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          {SCENARIOS.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={`${s.key}_p50`}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name={s.label}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: ViewMode
  onModeChange: (m: ViewMode) => void
}) {
  return (
    <div className="flex gap-0 self-end">
      {(['overlay', 'tabbed'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onModeChange(m)}
          className="px-3 py-1.5 text-xs font-mono uppercase tracking-widest border-2 cursor-pointer transition-colors"
          style={{
            background: mode === m ? 'var(--c-surface)' : 'transparent',
            color: mode === m ? 'var(--c-accent-orange)' : 'var(--c-text-muted)',
            borderColor: mode === m ? 'var(--c-accent-orange)' : 'var(--c-border)',
            borderRight: m === 'overlay' ? '1px solid var(--c-border)' : undefined,
          }}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

function ScenarioStats({ scenario }: { scenario: (typeof SCENARIOS)[number] & { result: ReturnType<typeof runSimulation> } }) {
  return (
    <div className="grid grid-cols-3 gap-0 border border-[var(--c-border)]">
      {[
        { label: 'Success', value: `${scenario.result.successProbability.toFixed(0)}%` },
        { label: 'Median at retire', value: formatCurrency(scenario.result.medianAtRetirement, true) },
        { label: 'Median at end', value: formatCurrency(scenario.result.medianAtEnd, true) },
      ].map((stat, i) => (
        <div
          key={stat.label}
          className="p-3 flex flex-col gap-0.5"
          style={{ borderRight: i < 2 ? '1px solid var(--c-border)' : undefined }}
        >
          <span className="text-xs font-mono text-[var(--c-text-muted)]">{stat.label}</span>
          <span className="text-base font-bold" style={{ color: scenario.color }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  )
}
