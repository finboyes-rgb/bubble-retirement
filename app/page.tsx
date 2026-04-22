'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { InputForm } from '@/components/InputForm'
import { FanChart } from '@/components/FanChart'
import { ResultsSummary } from '@/components/ResultsSummary'
import { YearlyTable } from '@/components/YearlyTable'
import { AnnualReview } from '@/components/AnnualReview'
import { BalanceSheet } from '@/components/BalanceSheet'
import { ModelExplainer } from '@/components/ModelExplainer'
import { runSimulation } from '@/lib/montecarlo'
import type { SimulationInputs, SimulationResult } from '@/lib/types'

type ForecastScenario = 'pessimistic' | 'base' | 'optimistic'

const FORECAST_SCENARIOS: Array<{
  key: ForecastScenario
  label: string
  color: string
  description: string
  delta: { returnDelta: number; volatilityDelta: number; inflationDelta: number }
}> = [
  {
    key: 'pessimistic',
    label: 'Pessimistic',
    color: '#A89880',
    description: '−2% returns, +5% vol, +1% inflation',
    delta: { returnDelta: -2, volatilityDelta: 5, inflationDelta: 1 },
  },
  {
    key: 'base',
    label: 'Base',
    color: '#FF4800',
    description: 'Your inputs as entered',
    delta: { returnDelta: 0, volatilityDelta: 0, inflationDelta: 0 },
  },
  {
    key: 'optimistic',
    label: 'Optimistic',
    color: '#F5DF00',
    description: '+2% returns, −2% vol, −0.5% inflation',
    delta: { returnDelta: 2, volatilityDelta: -2, inflationDelta: -0.5 },
  },
]

function applyScenarioDelta(
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

const DEFAULT_INPUTS: SimulationInputs = {
  currentAge: 35,
  retirementAge: 65,
  lifeExpectancy: 90,
  assets: [],
  incomeStreams: [],
  lumpSumExpenses: [],
  inflationRate: 2.5,
  expensePhases: [],
}

type ResultsTab = 'forecast' | 'inputs' | 'table' | 'balance' | 'review' | 'explainer'

export default function Home() {
  const { data: session, status } = useSession()
  const [inputs, setInputs] = useState<SimulationInputs>(DEFAULT_INPUTS)
  const [activeTab, setActiveTab] = useState<ResultsTab>('forecast')
  const [stateLoaded, setStateLoaded] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [committedInputs, setCommittedInputs] = useState<SimulationInputs>(DEFAULT_INPUTS)
  const [isDirty, setIsDirty] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [forecastScenario, setForecastScenario] = useState<ForecastScenario>('base')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeScenarioDef = FORECAST_SCENARIOS.find((s) => s.key === forecastScenario)!
  const scenarioInputs = useMemo(
    () => applyScenarioDelta(committedInputs, activeScenarioDef.delta),
    [committedInputs, activeScenarioDef]
  )
  const scenarioResult = useMemo(() => runSimulation(scenarioInputs), [scenarioInputs])

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Run simulation on committed inputs only
  useEffect(() => {
    setResult(runSimulation(committedInputs))
  }, [committedInputs])

  // Load state from DB on session auth
  useEffect(() => {
    if (status !== 'authenticated' || stateLoaded) return
    fetch('/api/state')
      .then((r) => {
        if (r.status === 404) return null
        return r.ok ? r.json() : null
      })
      .then((data) => {
        if (data?.inputs) {
          let merged = { ...DEFAULT_INPUTS, ...data.inputs } as SimulationInputs
          // Migrate legacy annualExpenses → expensePhases
          if ((!merged.expensePhases || merged.expensePhases.length === 0) && merged.annualExpenses != null) {
            merged = {
              ...merged,
              expensePhases: [{ id: 'phase-default', label: 'Annual expenses', fromAge: merged.currentAge, amount: merged.annualExpenses }],
            }
          }
          setInputs(merged)
          setCommittedInputs(merged)
        }
        setStateLoaded(true)
      })
      .catch(() => setStateLoaded(true))
  }, [status, stateLoaded])

  // Auto-save on input changes (debounced 1s), only when authenticated
  useEffect(() => {
    if (status !== 'authenticated' || !stateLoaded) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs }),
      }).catch(() => {})
    }, 1000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [inputs, status, stateLoaded])

  function handleInputChange(next: SimulationInputs) {
    // Auto-sync NZ Super endAge with lifeExpectancy
    if (next.lifeExpectancy !== inputs.lifeExpectancy) {
      next = {
        ...next,
        incomeStreams: next.incomeStreams.map((s) =>
          s.type === 'nz_super' ? { ...s, endAge: next.lifeExpectancy } : s
        ),
      }
    }
    setInputs(next)
    setIsDirty(true)
  }

  function handleRunSimulation() {
    setCommittedInputs(inputs)
    setIsDirty(false)
  }

  const TABS: Array<{ value: ResultsTab; label: string }> = [
    { value: 'forecast', label: 'Forecasts' },
    { value: 'inputs', label: 'Inputs' },
    { value: 'table', label: 'Yearly Table' },
    { value: 'balance', label: 'Balance Sheet' },
    { value: 'review', label: 'Review' },
    { value: 'explainer', label: 'How It Works' },
  ]

  const chartBg = theme === 'dark' ? '#17130E' : '#E2D5C0'

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--c-bg)',
        color: 'var(--c-text)',
        fontFamily: 'var(--font-body)',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: '2px solid var(--c-border)',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(24px, 3vw, 36px)',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            <span style={{ color: 'var(--c-accent-orange)' }}>BUBBLE</span>
            {' '}
            <span style={{ color: 'var(--c-text)' }}>RETIREMENT</span>
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--c-text-muted)',
              marginTop: 4,
            }}
          >
            1000-SIM MONTE CARLO
          </span>
        </div>

        {/* Auth strip */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              fontSize: 14,
              background: 'transparent',
              border: 'none',
              color: 'var(--c-text-muted)',
              padding: '2px 4px',
              cursor: 'pointer',
              opacity: 0.45,
              transition: 'opacity 150ms ease',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.45' }}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          {status === 'authenticated' && session?.user?.email ? (
            <>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--c-text-muted)',
                }}
              >
                {session.user.email}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--c-text-muted)',
                  background: 'transparent',
                  border: '1px solid var(--c-border)',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  transition: 'color 100ms ease',
                }}
              >
                Sign out
              </button>
            </>
          ) : status === 'unauthenticated' ? (
            <a
              href="/login"
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--c-accent-orange)',
                border: '1px solid var(--c-accent-orange)',
                padding: '3px 8px',
                textDecoration: 'none',
              }}
            >
              Sign in
            </a>
          ) : null}
        </div>
      </header>

      {/* Main layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          flex: 1,
          minHeight: 0,
        }}
        className="max-[768px]:!block"
      >
        {/* Left: Input form */}
        <div
          style={{
            borderRight: '2px solid var(--c-border)',
            overflowY: 'auto',
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
          className="max-[768px]:border-r-0 max-[768px]:border-b-[2px] max-[768px]:max-h-none"
        >
          <div style={{ flex: 1 }}>
            <InputForm inputs={inputs} onChange={handleInputChange} view="sidebar" />
          </div>
          <div
            style={{
              padding: '12px 16px',
              borderTop: '2px solid var(--c-border)',
              position: 'sticky',
              bottom: 0,
              background: 'var(--c-bg)',
            }}
          >
            <button
              type="button"
              onClick={handleRunSimulation}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                cursor: 'pointer',
                border: '2px solid var(--c-accent-orange)',
                background: isDirty ? 'var(--c-accent-orange)' : 'transparent',
                color: isDirty ? '#17130E' : 'var(--c-accent-orange)',
                boxShadow: isDirty ? '4px 4px 0 #4A3828' : 'none',
                transition: 'background 150ms ease, color 150ms ease, box-shadow 150ms ease',
              }}
            >
              {isDirty ? '▶ Run Simulation' : '✓ Up to date'}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            overflowY: 'auto',
            maxHeight: '100%',
          }}
        >
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--c-border)', gap: 0 }}>
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                style={{
                  padding: '8px 16px',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  borderBottom:
                    activeTab === tab.value
                      ? '2px solid var(--c-accent-orange)'
                      : '2px solid transparent',
                  marginBottom: -2,
                  color:
                    activeTab === tab.value
                      ? 'var(--c-accent-orange)'
                      : 'var(--c-text-muted)',
                  transition: 'color 180ms ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'inputs' && (
            <div className="anim-fade-in">
              <InputForm inputs={inputs} onChange={handleInputChange} view="assets" />
            </div>
          )}

          {activeTab === 'forecast' && (
            <>
              {/* Scenario switcher */}
              <div className="anim-fade-up anim-fade-up-1" style={{ display: 'flex', gap: 0, alignSelf: 'flex-start' }}>
                {FORECAST_SCENARIOS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setForecastScenario(s.key)}
                    style={{
                      padding: '6px 14px',
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      background: forecastScenario === s.key ? 'var(--c-surface)' : 'transparent',
                      border: '2px solid',
                      borderColor: forecastScenario === s.key ? s.color : 'var(--c-border)',
                      color: forecastScenario === s.key ? s.color : 'var(--c-text-muted)',
                      marginRight: -2,
                      transition: 'color 150ms ease, border-color 150ms ease',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
                {forecastScenario !== 'base' && (
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--c-text-muted)',
                    alignSelf: 'center',
                    marginLeft: 12,
                    letterSpacing: '0.05em',
                  }}>
                    {activeScenarioDef.description}
                  </span>
                )}
              </div>
              <div className="anim-fade-up anim-fade-up-2">
                <FanChart
                  result={scenarioResult}
                  retirementAge={scenarioInputs.retirementAge}
                  currentAge={scenarioInputs.currentAge}
                  bgColor={chartBg}
                />
              </div>
              <div className="anim-fade-up anim-fade-up-3">
                <ResultsSummary result={scenarioResult} inputs={scenarioInputs} />
              </div>
            </>
          )}

          {activeTab === 'table' && result && (
            <div className="anim-fade-in">
              <YearlyTable result={result} inputs={inputs} />
            </div>
          )}

          {activeTab === 'balance' && result && (
            <div className="anim-fade-in">
              <BalanceSheet result={result} inputs={inputs} />
            </div>
          )}

          {activeTab === 'review' && result && (
            <div className="anim-fade-in">
              <AnnualReview result={result} inputs={inputs} />
            </div>
          )}

          {activeTab === 'explainer' && (
            <div className="anim-fade-in">
              <ModelExplainer />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
