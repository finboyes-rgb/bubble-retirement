'use client'

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
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.7, color: 'var(--c-text)', margin: 0 }}>
      {children}
    </p>
  )
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span style={{ color: 'var(--c-accent-orange)', fontFamily: 'var(--font-mono)' }}>{children}</span>
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr style={{ borderBottom: '2px solid var(--c-border)' }}>
        {cols.map((h) => (
          <th key={h} style={{ padding: '6px 16px 6px 0', textAlign: 'left', color: 'var(--c-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
            {h}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function Td({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <td style={{ padding: '8px 16px 8px 0', color: accent ? 'var(--c-accent-orange)' : 'var(--c-text)', fontFamily: 'var(--font-mono)', fontSize: 12, verticalAlign: 'top' }}>
      {children}
    </td>
  )
}

function TdMuted({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: '8px 16px 8px 0', color: 'var(--c-text-muted)', fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.5, verticalAlign: 'top' }}>
      {children}
    </td>
  )
}

export function ModelExplainer() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Disclaimer */}
      <div style={{ border: '2px solid var(--c-accent-yellow)', background: 'var(--c-surface)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--c-accent-yellow)' }}>
          Not financial advice
        </span>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.65, color: 'var(--c-text)', margin: 0 }}>
          Bubble Retirement is a modelling tool, not a financial advice service. All projections are
          generated from the inputs you provide and are illustrative only — they are not a guarantee
          or prediction of future returns. Real markets are unpredictable and outcomes may differ
          materially from the scenarios shown.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.65, color: 'var(--c-text-muted)', margin: 0 }}>
          Under the New Zealand <em>Financial Markets Conduct Act 2013</em>, personalised financial
          advice must be provided by a licensed Financial Advice Provider. If you are making
          significant retirement or investment decisions, please consult a licensed adviser.
        </p>
      </div>

      {/* How the simulation works */}
      <ExplainerCard title="How the simulation works">
        <P>
          Bubble runs <Mono>1,000 independent futures</Mono> for your portfolio. In each future,
          annual returns for every asset are drawn randomly from a log-normal distribution — good
          years, bad years, crashes, booms — consistent with the expected return and volatility
          you set. The result is a cloud of 1,000 possible portfolio paths.
        </P>
        <P>
          The fan chart shows the spread of those paths. The wide outer band is the 5th–95th
          percentile range. The inner band is the 25th–75th. The orange line is the median — half
          of all futures ended above it, half below. The <Mono>success probability</Mono> in the
          Summary tab is the share of futures where your portfolio never hit zero before your life
          expectancy.
        </P>
        <P>
          The simulation uses a seeded random number generator, so the same inputs always produce
          the same output — your numbers won&apos;t change between visits.
        </P>
      </ExplainerCard>

      {/* Default return assumptions */}
      <ExplainerCard title="Where the default figures come from">
        <P>
          The default return and volatility figures for equity asset types are not guesses —
          they are calculated from long-run historical total return index data published by the
          OECD (series SPASTT01). The table below shows what was used.
        </P>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <TableHead cols={['Asset type', 'Default return', 'Default volatility (σ)', 'Data source', 'Period']} />
            <tbody>
              {[
                { type: 'NZ Equities',       ret: '4.9%', vol: '14.4%', src: 'OECD SPASTT01 NZX total return', period: '1967 – 2026' },
                { type: 'Australian Equities', ret: '6.3%', vol: '15.5%', src: 'OECD SPASTT01 ASX total return', period: '1958 – 2026' },
                { type: 'Global Equities',    ret: '6.6%', vol: '12.5%', src: 'OECD SPASTT01 S&P 500 total return', period: '1957 – 2026' },
              ].map((row, i) => (
                <tr key={row.type} style={{ borderBottom: '1px solid var(--c-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <Td accent>{row.type}</Td>
                  <Td>{row.ret}</Td>
                  <Td>{row.vol}</Td>
                  <TdMuted>{row.src}</TdMuted>
                  <TdMuted>{row.period}</TdMuted>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>
          These are annualised nominal figures — they include the effect of inflation and reflect
          total return (price appreciation plus dividends reinvested). They represent full
          available history, which includes the 1987 crash, the dot-com bust, the GFC, and
          COVID. All figures are before fees and tax.
        </P>
        <P>
          You should reduce the default return to account for your fund&apos;s management fees
          and, if relevant, your tax rate on investment returns. A KiwiSaver growth fund charging
          1% p.a. in fees, for example, would warrant reducing the NZ equities default from
          4.9% to roughly 3.9%.
        </P>
      </ExplainerCard>

      {/* Volatility and risk profiles */}
      <ExplainerCard title="Volatility and risk profiles">
        <P>
          Volatility (σ) is the standard deviation of annual returns. An asset with a 14% volatility
          and a 5% expected return will, in roughly two-thirds of years, land somewhere between
          −9% and +19%. About one year in twenty will be more than two standard deviations away —
          i.e. below −23% or above +33%.
        </P>
        <P>
          When you select a risk profile for an asset, it sets a preset volatility. You can
          override it manually in the advanced settings for any asset.
        </P>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <TableHead cols={['Profile', 'Preset σ', 'Typical asset types']} />
            <tbody>
              {[
                { profile: 'Fixed',        sigma: '0%',  desc: 'Term deposits, guaranteed annuities. No variance — the return you enter is exactly what you get every year.' },
                { profile: 'Conservative', sigma: '4%',  desc: 'NZ government bonds, cash funds, short-duration bond funds.' },
                { profile: 'Balanced',     sigma: '10%', desc: 'KiwiSaver balanced funds, diversified multi-asset portfolios.' },
                { profile: 'Growth',       sigma: '14%', desc: 'KiwiSaver growth funds, NZ or global equity funds. Calibrated to NZX long-run historical volatility.' },
              ].map((row, i) => (
                <tr key={row.profile} style={{ borderBottom: '1px solid var(--c-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <Td accent>{row.profile}</Td>
                  <Td>{row.sigma}</Td>
                  <TdMuted>{row.desc}</TdMuted>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>
          Higher volatility does not just mean more uncertainty — it also reduces the expected
          median outcome. A 50% loss requires a 100% gain to recover. This drag compounds over
          time, so a high-volatility asset with the same expected return as a low-volatility one
          will almost always end up with a lower median portfolio value over long periods.
        </P>
      </ExplainerCard>

      {/* Sequence of returns */}
      <ExplainerCard title="Sequence-of-returns risk">
        <P>
          The <em>order</em> of returns matters enormously in retirement — not just the average.
          If markets fall sharply in the first few years after you retire, you are forced to sell
          more units to meet living costs, leaving fewer units to recover when markets bounce.
          The same sequence of returns in reverse (crash at the end, not the beginning) produces
          a much better outcome.
        </P>
        <P>
          This is why the fan chart widens dramatically in the decumulation phase. The median
          outcome may look fine, but the 10th-percentile path — visible in the chart — shows
          what bad luck early in retirement looks like. Holding some fixed-return assets in early
          retirement (term deposits, bonds) reduces this risk because they don&apos;t require
          selling at depressed prices.
        </P>
      </ExplainerCard>

      {/* Model assumptions */}
      <ExplainerCard title="Model assumptions and limitations">
        <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.65, color: 'var(--c-text)' }}>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>Fully nominal.</strong>{' '}
            All values run in nominal dollars. Asset returns are entered as nominal figures.
            Expenses and income streams (salary, NZ Super, rental) are entered in today&apos;s
            dollars and inflated each year at the inflation rate you set. A real growth rate on
            an income stream (e.g. NZ Super CPI indexing) applies on top of base inflation.
            Lump sum expenses are fixed nominal amounts and are not inflated.
          </li>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>Income before vs. after retirement.</strong>{' '}
            Before retirement, income streams are treated as annual contributions added to the
            portfolio. After retirement, income offsets withdrawals — only the gap between
            annual expenses and income is drawn from the portfolio.
          </li>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>Assets are independent.</strong>{' '}
            The model does not simulate correlation between assets. A crash year for equities
            does not drag down your term deposit. In reality, equities tend to fall together,
            so diversification benefits within the equity portion may be slightly overstated.
          </li>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>Tax on returns and income.</strong>{' '}
            Each asset has an optional tax rate on investment returns (e.g. 28% for a PIE
            fund at the 28% PIR). Each income stream has an optional tax rate on gross income.
            If not set, returns and income are treated as pre-tax — make sure your expected
            return already reflects fees and tax if you leave these blank.
          </li>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>NZ Super.</strong>{' '}
            Modelled as an income stream starting at your nominated age. The 2025 rate is
            approximately NZ$27,000/year for a single person living alone (after tax).
            Adjust the amount in the Income section to match your entitlement and living
            situation.
          </li>
          <li>
            <strong style={{ color: 'var(--c-text)' }}>Portfolio floor at zero.</strong>{' '}
            The model does not allow negative portfolio values. Once depleted, withdrawals
            stop. Debt, reverse mortgages, and asset sales (e.g. selling the family home)
            are not modelled.
          </li>
        </ul>
      </ExplainerCard>

    </div>
  )
}
