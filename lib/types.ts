export type RiskProfile = 'fixed' | 'conservative' | 'moderate' | 'growth'

export type AssetType =
  | 'cash'
  | 'bonds'
  | 'term_deposit'
  | 'kiwisaver'
  | 'nz_equities'
  | 'au_equities'
  | 'global_equities'
  | 'property'
  | 'managed_fund'
  | 'alternative'
  | 'other'

export const RISK_PROFILES: Record<RiskProfile, {
  label: string
  description: string
  volatility: number
}> = {
  fixed:        { label: 'Fixed',        description: 'Term deposit / guaranteed return', volatility: 0 },
  conservative: { label: 'Conservative', description: 'Cash & bonds',                    volatility: 4 },
  moderate:     { label: 'Balanced',     description: 'Balanced fund / KiwiSaver',       volatility: 10 },
  growth:       { label: 'Growth',       description: 'NZ / global equities',            volatility: 14 },
}

export interface AssetDefinition {
  id: string
  name: string
  currentBalance: number    // NZ$ nominal (today's value)
  expectedReturn: number    // nominal % after fees, before tax e.g. 5.0
  volatility: number        // std dev % e.g. 12.0
  riskProfile?: RiskProfile // if set, volatility was chosen via preset
  visible: boolean          // UI toggle — does not affect simulation
  taxRate?: number          // % of returns paid as tax (e.g. 28 for PIE) — applied in simulation
  feeRate?: number          // % p.a. of balance as mgmt fees — display only, already embedded in expectedReturn
  assetType?: AssetType     // determines which fields are shown in the UI
  timeToMaturity?: number   // years (bonds) or months (term deposits)
}

export type IncomeType = 'employment' | 'rental' | 'nz_super' | 'lump_sum' | 'ongoing'

export interface IncomeStream {
  id: string
  type: IncomeType
  label: string
  annualAmount: number    // NZ$/year in today's dollars, pre-tax (inflated to nominal in simulation)
  startAge: number
  endAge: number          // for lump_sum: same as startAge (one year only)
  growthRate?: number     // real growth % above inflation (e.g. NZ Super indexing)
  taxRate?: number        // % of income paid as tax — applied in simulation
}

export interface ExpensePhase {
  id: string
  label: string
  fromAge: number    // inclusive start age
  toAge?: number     // inclusive end age; if unset, applies indefinitely (legacy)
  amount: number     // NZ$/year in today's dollars (inflated to nominal in simulation)
}

export interface LumpSumExpense {
  id: string
  label: string
  amount: number    // NZ$ nominal — entered as a fixed future amount, not inflation-adjusted
  atAge: number     // age at which the expense is deducted
}

export interface SimulationInputs {
  currentAge: number
  retirementAge: number
  lifeExpectancy: number
  assets: AssetDefinition[]
  incomeStreams: IncomeStream[]
  lumpSumExpenses: LumpSumExpense[]
  inflationRate: number         // % — only global return param
  globalTaxRate?: number        // % applied to income streams without their own taxRate
  annualExpenses?: number       // deprecated: kept for backward compat with saved state; prefer expensePhases
  expensePhases?: ExpensePhase[] // age-bucketed spending (replaces annualExpenses)
}

export interface AssetYearData {
  assetId: string
  medianValue: number           // closing balance
  medianOpeningBalance: number  // value at start of year (before growth)
  medianReturn: number          // investment return earned
  medianIncome: number          // proportional income stream allocation
  medianDraw: number            // proportional portfolio draw allocation (net expenses + lump sums)
}

export interface YearBand {
  age: number
  p5: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  p95: number
  assetMedians: AssetYearData[]
  totalIncome: number
  totalPortfolioDraw: number     // actual draw from portfolio (annualExpenses − income, floored at 0)
  totalLumpSum: number           // one-off expenses deducted this year
}

export interface SimulationResult {
  bands: YearBand[]
  successProbability: number   // 0–100
  medianAtRetirement: number
  medianAtEnd: number
  p10AtRetirement: number
  p90AtRetirement: number
}
