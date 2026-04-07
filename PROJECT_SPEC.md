# Bubble Retirement — PROJECT_SPEC.md

---

## Session Log

**Last session:** 2026-04-07 (Session 1)
**Status:** Scaffolded — all files written, dev server not yet run
**Tests:** N/A (no test runner configured — pure client-side, verify via browser)
**Last decision:** No backend, no auth — fully client-side, all computation in browser
**Open:** None
**Next action:** `npm run dev` → verify fan chart renders and simulation runs

---

## What It Is

A standalone Monte Carlo retirement calculator with fan chart visualisation. Fully client-side — no backend, no auth, no database. Dual purpose: personal planning tool + portfolio piece.

Users input their financial situation (savings, contributions, expected returns, pension income, withdrawal plan) and get a probability-weighted forecast of their retirement portfolio across 1000 simulated futures.

---

## MVP Scope (hard boundary — 5 items)

1. **Input form** — 5 collapsible sections (Personal, Finances, Returns, Income, Withdrawals)
2. **Monte Carlo engine** — 1000 simulations, log-normal returns, all values in real (inflation-adjusted) terms
3. **Fan chart** — Recharts ComposedChart, p5–p95 bands, p50 orange median, dashed yellow retirement age line
4. **Results summary** — success probability (colour-coded), median at retirement + end, p10/p90 range, auto-suggestions if success < 80%
5. **Scenario comparison** — 3 scenarios (pessimistic/base/optimistic), overlay or tabbed modes

**Out of MVP:** save/load inputs, PDF export, currency switcher, multi-country tax rules, social sharing, user accounts

---

## Data Types

```typescript
interface SimulationInputs {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentSavings: number;           // £
  monthlyContribution: number;      // £/month
  taxAdvantagedPct: number;         // 0–100
  expectedAnnualReturn: number;     // % e.g. 7
  volatility: number;               // % std dev e.g. 12
  inflationRate: number;            // % e.g. 2.5
  pensionMonthlyIncome: number;     // £/month (private pension at retirement)
  statePensionStartAge: number;
  statePensionMonthly: number;      // £/month
  withdrawalMode: 'amount' | 'rate';
  annualWithdrawal: number;         // £/year (if withdrawalMode === 'amount')
  withdrawalRate: number;           // % of portfolio (if withdrawalMode === 'rate')
}

interface YearBand {
  age: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

interface SimulationResult {
  bands: YearBand[];
  successProbability: number;       // 0–100
  medianAtRetirement: number;
  medianAtEnd: number;
  p10AtRetirement: number;
  p90AtRetirement: number;
}
```

---

## Component Map

```
app/page.tsx
├── InputForm        — 5 collapsible sections, sliders, validation
├── FanChart         — Recharts ComposedChart with percentile bands
├── ResultsSummary   — 2×2 stat grid + auto-suggestions
└── ScenarioComparison — 3 scenarios overlay/tabbed
```

**`lib/`**
- `montecarlo.ts` — `runSimulation(inputs: SimulationInputs): SimulationResult`
- `utils.ts` — `cn()`, `formatCurrency(v, compact?)`, `formatPercent(v)`

**`components/ui/`** — button, card, input, label, slider, tabs, badge

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS v4 + custom design tokens (fin-tokens)
- **Charts:** Recharts
- **UI primitives:** @base-ui/react (Slider, Tabs)
- **Utilities:** clsx, tailwind-merge, class-variance-authority, lucide-react
- **Deploy:** Railway (no env vars — fully client-side)
- **Design:** Space Grotesk (body), Space Mono (mono), muddy browns + neon orange/yellow, brutalist shadows

---

## Default Inputs

| Field | Default |
|---|---|
| currentAge | 35 |
| retirementAge | 65 |
| lifeExpectancy | 90 |
| currentSavings | 50000 |
| monthlyContribution | 1000 |
| taxAdvantagedPct | 60 |
| expectedAnnualReturn | 7 |
| volatility | 12 |
| inflationRate | 2.5 |
| pensionMonthlyIncome | 0 |
| statePensionStartAge | 67 |
| statePensionMonthly | 900 |
| withdrawalMode | 'rate' |
| annualWithdrawal | 40000 |
| withdrawalRate | 4 |

---

## Verification Tests (run in browser)

1. `volatility = 0` → all percentile lines converge to a single line on the fan chart
2. `withdrawalRate = 100%` on modest savings → success % near 0, suggestion cards appear
3. `currentSavings = 1000000`, `withdrawalRate = 4`, 30yr decumulation → success 90–98%
4. State pension age 67 → visible slope change in fan chart at age 67
5. Scenario comparison overlay → 3 distinct p50 curves visible
6. Mobile 375px → form stacked above chart, no overflow
