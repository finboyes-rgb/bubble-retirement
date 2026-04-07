export interface AssetDefinition {
  id: string
  name: string
  currentBalance: number    // NZ$ real
  expectedReturn: number    // real % e.g. 5.0
  volatility: number        // std dev % e.g. 12.0
  visible: boolean          // UI toggle — does not affect simulation
}

export type IncomeType = 'employment' | 'rental' | 'nz_super' | 'lump_sum' | 'ongoing'

export interface IncomeStream {
  id: string
  type: IncomeType
  label: string
  annualAmount: number    // NZ$/year real
  startAge: number
  endAge: number          // for lump_sum: same as startAge (one year only)
}

export interface SimulationInputs {
  currentAge: number
  retirementAge: number
  lifeExpectancy: number
  assets: AssetDefinition[]
  incomeStreams: IncomeStream[]
  inflationRate: number         // % — only global return param
  withdrawalMode: 'amount' | 'rate'
  annualWithdrawal: number      // NZ$/year real (if withdrawalMode === 'amount')
  withdrawalRate: number        // % of portfolio at retirement (if withdrawalMode === 'rate')
}

export interface AssetYearData {
  assetId: string
  medianValue: number
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
  totalWithdrawal: number
}

export interface SimulationResult {
  bands: YearBand[]
  successProbability: number   // 0–100
  medianAtRetirement: number
  medianAtEnd: number
  p10AtRetirement: number
  p90AtRetirement: number
}
