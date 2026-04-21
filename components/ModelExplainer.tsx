'use client'

import { RISK_PROFILES } from '@/lib/types'

function ExplainerCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '2px solid var(--c-border)',
        background: 'var(--c-surface)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--c-accent-orange)',
          margin: 0,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        lineHeight: 1.7,
        color: 'var(--c-text)',
        margin: 0,
      }}
    >
      {children}
    </p>
  )
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: 'var(--c-accent-orange)', fontFamily: 'var(--font-mono)' }}>
      {children}
    </span>
  )
}

export function ModelExplainer() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Disclaimer */}
      <div
        style={{
          border: '2px solid var(--c-accent-yellow)',
          background: 'var(--c-surface)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--c-accent-yellow)' }}>
          Not financial advice
        </span>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.65, color: 'var(--c-text)', margin: 0 }}>
          Bubble Retirement is a modelling tool, not a financial advice service. All projections are
          generated solely from the inputs you provide and are illustrative only — they are not a
          guarantee or prediction of future investment returns. Real markets are unpredictable and
          outcomes may differ materially from the scenarios shown.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.65, color: 'var(--c-text-muted)', margin: 0 }}>
          Under the New Zealand{' '}
          <em>Financial Markets Conduct Act 2013</em>, personalised financial advice must be provided
          by a licensed Financial Advice Provider. If you are making significant retirement or
          investment decisions, please consult a licensed adviser who can take into account your
          full personal circumstances.
        </p>
      </div>

      {/* What is Monte Carlo */}
      <ExplainerCard title="What is Monte Carlo simulation?">
        <P>
          Each time you run a simulation, Bubble runs <Highlight>1,000 independent futures</Highlight> for
          your portfolio. In each future, annual returns are drawn randomly — good years, bad years, crashes,
          booms — all consistent with the expected return and volatility you set for each asset.
        </P>
        <P>
          The fan chart shows the spread of those 1,000 outcomes. The wide outer band covers the 5th–95th
          percentile range. The narrower inner band is the 25th–75th. The orange line is the median — half
          of all simulated futures ended up above it, half below.
        </P>
        <P>
          The <Highlight>success probability</Highlight> shown in the Summary tab is simply the percentage
          of those 1,000 futures where your portfolio never hit zero before your life expectancy.
        </P>
        <P>
          Results are <Highlight>deterministic</Highlight> — the simulation uses a seeded PCG32 random
          number generator, so the same inputs always produce identical output. Your numbers won&apos;t
          jump around between runs.
        </P>
      </ExplainerCard>

      {/* Risk profiles */}
      <ExplainerCard title="Risk profiles">
        <P>
          Each asset&apos;s risk profile controls its <em>volatility</em> — how much its annual return
          varies around the expected value. A higher profile means wilder swings, both up and down.
        </P>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid var(--c-border)' }}>
                {['Profile', 'Volatility (σ)', 'What it represents', 'NZ examples'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '6px 12px 6px 0',
                      textAlign: 'left',
                      color: 'var(--c-text-muted)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'fixed',        sigma: '0%',  what: 'No variance — locked return',    examples: 'Term deposits, guaranteed annuities' },
                { key: 'conservative', sigma: '4%',  what: 'Low variance, slow and steady',  examples: 'NZ bonds, cash funds, PIE savings' },
                { key: 'moderate',     sigma: '10%', what: 'Moderate ups and downs',         examples: 'KiwiSaver balanced, diversified funds' },
                { key: 'growth',       sigma: '17%', what: 'High variance, high long-run upside', examples: 'KiwiSaver growth, NZ/global equities' },
              ].map((row, i) => (
                <tr
                  key={row.key}
                  style={{
                    borderBottom: '1px solid var(--c-border)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <td style={{ padding: '8px 12px 8px 0', color: 'var(--c-accent-orange)', fontWeight: 600 }}>
                    {RISK_PROFILES[row.key as keyof typeof RISK_PROFILES].label}
                  </td>
                  <td style={{ padding: '8px 12px 8px 0', color: 'var(--c-text)' }}>{row.sigma}</td>
                  <td style={{ padding: '8px 12px 8px 0', color: 'var(--c-text-muted)' }}>{row.what}</td>
                  <td style={{ padding: '8px 12px 8px 0', color: 'var(--c-text-muted)' }}>{row.examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>
          The volatility figure is the <em>standard deviation</em> of annual returns. A Growth asset
          with σ = 17% means roughly two-thirds of years will land within ±17% of the expected return,
          and about one-in-twenty years will be more than ±34% away.
        </P>
      </ExplainerCard>

      {/* Why volatility matters */}
      <ExplainerCard title="Why does volatility matter?">
        <P>
          Even if two assets have the same expected return, the one with higher volatility will almost
          always produce a <em>lower</em> long-run outcome. This is because losses hurt more than
          equivalent gains help — a 50% loss requires a 100% gain just to break even.
        </P>
        <P>
          In the fan chart, you can see this directly: higher volatility widens the fan. The upside tail
          goes higher, but the downside tail drops further, and the median outcome is pulled down slightly
          compared to a low-volatility asset with the same expected return.
        </P>
        <P>
          In retirement this effect is amplified by <Highlight>sequence-of-returns risk</Highlight>: a
          run of bad years early in retirement forces you to sell more units to meet withdrawals, leaving
          fewer units to recover when markets bounce. A fixed-return asset has no sequence risk at all —
          which is why term deposits are valuable in the early retirement years even if their long-run
          return is lower.
        </P>
      </ExplainerCard>

      {/* Model assumptions */}
      <ExplainerCard title="Model assumptions">
        <ul
          style={{
            margin: 0,
            padding: '0 0 0 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            lineHeight: 1.65,
            color: 'var(--c-text)',
          }}
        >
          <li>
            <strong style={{ color: 'var(--c-text)' }}>Real (inflation-adjusted) terms.</strong>{' '}
            All values are expressed in today&apos;s dollars. The expected return you enter should be
            your return <em>above</em> inflation. A term deposit earning 5% nominal with 2.5% inflation
            has a real return of roughly 2.5%.
          </li>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>Log-normal annual returns.</strong>{' '}
            Returns are generated using a log-normal distribution (Box-Muller transform), which correctly
            models the fact that returns can&apos;t fall below −100% and tend to have a right-skewed
            distribution. Each asset is sampled independently each year.
          </li>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>Accumulation phase: income as contributions.</strong>{' '}
            Before retirement, employment and other income streams are treated as annual contributions —
            added to the portfolio at the end of each year. After retirement, income instead offsets your
            withdrawal: only the gap between your annual expenses and income is drawn from the portfolio.
          </li>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>Lump sum expenses.</strong>{' '}
            One-off expenses (e.g. a new car or renovation) are deducted from the portfolio in the year
            they occur. This can happen at any age, before or after retirement, and is applied after
            investment growth in that year.
          </li>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>Independent assets.</strong>{' '}
            The model does not model correlation between assets — a crash year for equities does not
            automatically drag down your term deposit. This means diversification benefits may be
            slightly understated.
          </li>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>NZ Super eligibility.</strong>{' '}
            NZ Super is modelled as an income stream starting at your nominated age. The current
            (2025) rate is roughly $25,000/year for a single person. Adjust the amount in the Income
            section to reflect your situation.
          </li>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>No tax modelling.</strong>{' '}
            Returns are pre-tax. In practice, PIE funds (KiwiSaver) are taxed at your Prescribed
            Investor Rate, and investment property returns are subject to income tax. Consider
            reducing your expected return to account for your effective tax rate.
          </li>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>Portfolio floor at zero.</strong>{' '}
            If your portfolio is depleted, withdrawals stop. The simulation does not model debt or
            reverse mortgages.
          </li>
        </ul>
      </ExplainerCard>

    </div>
  )
}
