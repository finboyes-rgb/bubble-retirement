'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { InputForm } from '@/components/InputForm'
import { FanChart } from '@/components/FanChart'
import { ResultsSummary } from '@/components/ResultsSummary'
import { ScenarioComparison } from '@/components/ScenarioComparison'
import { YearlyTable } from '@/components/YearlyTable'
import { AnnualReview } from '@/components/AnnualReview'
import { runSimulation } from '@/lib/montecarlo'
import type { SimulationInputs, SimulationResult } from '@/lib/types'

const DEFAULT_INPUTS: SimulationInputs = {
  currentAge: 35,
  retirementAge: 65,
  lifeExpectancy: 90,
  assets: [
    {
      id: 'kiwisaver',
      name: 'KiwiSaver',
      currentBalance: 50000,
      expectedReturn: 5.0,
      volatility: 9.0,
      visible: true,
    },
    {
      id: 'nz-equities',
      name: 'NZ Equities',
      currentBalance: 20000,
      expectedReturn: 7.0,
      volatility: 16.0,
      visible: true,
    },
    {
      id: 'term-deposit',
      name: 'Term Deposit',
      currentBalance: 10000,
      expectedReturn: 1.5,
      volatility: 1.0,
      visible: true,
    },
  ],
  incomeStreams: [
    {
      id: 'employment',
      type: 'employment',
      label: 'Employment',
      annualAmount: 80000,
      startAge: 35,
      endAge: 65,
    },
    {
      id: 'nz-super',
      type: 'nz_super',
      label: 'NZ Super',
      annualAmount: 25000,
      startAge: 65,
      endAge: 90,
    },
  ],
  inflationRate: 2.5,
  withdrawalMode: 'rate',
  annualWithdrawal: 60000,
  withdrawalRate: 4,
}

type ResultsTab = 'forecast' | 'table' | 'scenarios' | 'review'

export default function Home() {
  const { data: session, status } = useSession()
  const [inputs, setInputs] = useState<SimulationInputs>(DEFAULT_INPUTS)
  const [activeTab, setActiveTab] = useState<ResultsTab>('forecast')
  const [stateLoaded, setStateLoaded] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const simTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Debounced simulation — client-side only (Math.random() causes hydration mismatch if run on server)
  useEffect(() => {
    if (simTimerRef.current) clearTimeout(simTimerRef.current)
    simTimerRef.current = setTimeout(() => {
      setResult(runSimulation(inputs))
    }, 200)
    return () => {
      if (simTimerRef.current) clearTimeout(simTimerRef.current)
    }
  }, [inputs])

  // Load state from DB on session auth
  useEffect(() => {
    if (status !== 'authenticated' || stateLoaded) return
    fetch('/api/state')
      .then((r) => {
        if (r.status === 404) return null
        return r.ok ? r.json() : null
      })
      .then((data) => {
        if (data?.inputs) setInputs(data.inputs as SimulationInputs)
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
  }

  const TABS: Array<{ value: ResultsTab; label: string }> = [
    { value: 'forecast', label: 'Forecast' },
    { value: 'table', label: 'Yearly Table' },
    { value: 'scenarios', label: 'Scenarios' },
    { value: 'review', label: 'Review' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--c-bg)',
        color: 'var(--c-text)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: '2px solid var(--c-border)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--c-accent-orange)',
            fontWeight: 700,
          }}
        >
          Bubble
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--c-text)',
            fontWeight: 700,
          }}
        >
          Retirement
        </span>
        <span
          style={{
            fontSize: 12,
            color: 'var(--c-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          — 1000-simulation Monte Carlo
        </span>

        {/* Auth strip */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'transparent',
              border: '1px solid var(--c-border)',
              color: 'var(--c-text-muted)',
              padding: '3px 8px',
              cursor: 'pointer',
              transition: 'color 100ms ease, border-color 100ms ease',
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
            {theme === 'dark' ? '☀ light' : '☾ dark'}
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
          minHeight: 'calc(100vh - 57px)',
        }}
        className="max-[768px]:!block"
      >
        {/* Left: Input form */}
        <div
          style={{
            borderRight: '2px solid var(--c-border)',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 57px)',
          }}
          className="max-[768px]:border-r-0 max-[768px]:border-b-[2px] max-[768px]:max-h-none"
        >
          <InputForm inputs={inputs} onChange={handleInputChange} />
        </div>

        {/* Right: Results */}
        <div
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 57px)',
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

          {activeTab === 'forecast' && result && (
            <>
              <FanChart
                result={result}
                retirementAge={inputs.retirementAge}
                currentAge={inputs.currentAge}
              />
              <ResultsSummary result={result} inputs={inputs} />
            </>
          )}

          {activeTab === 'table' && result && (
            <YearlyTable result={result} inputs={inputs} />
          )}

          {activeTab === 'scenarios' && (
            <ScenarioComparison baseInputs={inputs} />
          )}

          {activeTab === 'review' && result && (
            <AnnualReview result={result} inputs={inputs} />
          )}
        </div>
      </div>
    </div>
  )
}
