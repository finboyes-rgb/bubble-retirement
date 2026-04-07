import type {
  SimulationInputs,
  SimulationResult,
  YearBand,
  AssetYearData,
} from './types'

export type { SimulationInputs, SimulationResult, YearBand }

const N_SIMS = 5000

/** PCG32 seeded PRNG — returns a factory producing uniform [0, 1) samples */
function pcg32(seed: bigint): () => number {
  const M = 6364136223846793005n
  const INC = 1442695040888963407n | 1n
  const MASK64 = 0xFFFFFFFFFFFFFFFFn
  let state = (seed ^ M) & MASK64
  return function (): number {
    const old = state
    state = (old * M + INC) & MASK64
    const xsh = Number((((old >> 18n) ^ old) >> 27n) & 0xFFFFFFFFn)
    const rot = Number(old >> 59n)
    return (((xsh >>> rot) | (xsh << ((32 - rot) & 31))) >>> 0) / 0x100000000
  }
}

/** Box-Muller transform — standard normal sample via provided RNG */
function boxMuller(rand: () => number): number {
  let u = 0
  let v = 0
  while (u === 0) u = rand()
  while (v === 0) v = rand()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/** Total annual income from active streams at a given age */
function getAnnualIncome(age: number, inputs: SimulationInputs): number {
  return inputs.incomeStreams
    .filter((s) => age >= s.startAge && age <= s.endAge)
    .reduce((sum, s) => sum + s.annualAmount, 0)
}

export function runSimulation(inputs: SimulationInputs): SimulationResult {
  const rand = pcg32(0xDEADBEEFn)
  const { currentAge, retirementAge, lifeExpectancy, assets, withdrawalMode, annualWithdrawal, withdrawalRate } = inputs

  const totalYears = lifeExpectancy - currentAge
  const accumYears = retirementAge - currentAge
  const nAssets = assets.length

  // Pre-compute per-asset log-normal params (real returns)
  const assetParams = assets.map((a) => ({
    id: a.id,
    mu_ln: Math.log(1 + a.expectedReturn / 100) - 0.5 * Math.pow(a.volatility / 100, 2),
    sigma: a.volatility / 100,
  }))

  // assetValues[simIndex][assetIndex] = current balance
  const assetValues: number[][] = Array.from({ length: N_SIMS }, () =>
    assets.map((a) => a.currentBalance)
  )

  // portfoliosByYear[year][sim] — year 0 = currentAge
  const portfoliosByYear: number[][] = Array.from({ length: totalYears + 1 }, () =>
    new Array(N_SIMS).fill(0)
  )

  // assetsByYear[year][assetIndex][sim]
  const assetsByYear: number[][][] = Array.from({ length: totalYears + 1 }, () =>
    Array.from({ length: nAssets }, () => new Array(N_SIMS).fill(0))
  )

  // Year 0 = starting balances
  for (let s = 0; s < N_SIMS; s++) {
    let total = 0
    for (let i = 0; i < nAssets; i++) {
      assetsByYear[0][i][s] = assets[i].currentBalance
      total += assets[i].currentBalance
    }
    portfoliosByYear[0][s] = total
  }

  // Track fixed withdrawals per sim (set once at retirement)
  const fixedWithdrawals = new Array(N_SIMS).fill(0)

  for (let s = 0; s < N_SIMS; s++) {
    for (let y = 1; y <= totalYears; y++) {
      const age = currentAge + y

      // Grow each asset independently
      for (let i = 0; i < nAssets; i++) {
        const z = boxMuller(rand)
        const gf = Math.exp(assetParams[i].mu_ln + assetParams[i].sigma * z)
        assetValues[s][i] = assetValues[s][i] * gf
      }

      let totalPortfolio = assetValues[s].reduce((sum, v) => sum + v, 0)

      // Add income
      totalPortfolio += getAnnualIncome(age, inputs)

      // Decumulation: subtract withdrawal
      if (age > retirementAge) {
        if (y === accumYears + 1) {
          fixedWithdrawals[s] =
            withdrawalMode === 'rate'
              ? totalPortfolio * (withdrawalRate / 100)
              : annualWithdrawal
        }
        totalPortfolio -= fixedWithdrawals[s]
      }

      // Ruin floor — zero all assets proportionally
      if (totalPortfolio <= 0) {
        for (let i = 0; i < nAssets; i++) {
          assetValues[s][i] = 0
        }
        totalPortfolio = 0
      } else if (totalPortfolio !== assetValues[s].reduce((sum, v) => sum + v, 0)) {
        // Redistribute income/withdrawal delta proportionally across assets
        const rawTotal = assetValues[s].reduce((sum, v) => sum + v, 0)
        if (rawTotal > 0) {
          const scale = totalPortfolio / rawTotal
          for (let i = 0; i < nAssets; i++) {
            assetValues[s][i] = assetValues[s][i] * scale
          }
        }
      }

      for (let i = 0; i < nAssets; i++) {
        assetsByYear[y][i][s] = assetValues[s][i]
      }
      portfoliosByYear[y][s] = totalPortfolio
    }
  }

  // Compute percentile bands
  const bands: YearBand[] = []
  for (let y = 0; y <= totalYears; y++) {
    const age = currentAge + y
    const sorted = [...portfoliosByYear[y]].sort((a, b) => a - b)

    const assetMedians: AssetYearData[] = assets.map((a, i) => {
      const assetSorted = [...assetsByYear[y][i]].sort((a, b) => a - b)
      return { assetId: a.id, medianValue: percentile(assetSorted, 50) }
    })

    const totalIncome = getAnnualIncome(age, inputs)
    // For withdrawal, use median fixed withdrawal (approximation: use first sim's value post-retirement)
    const totalWithdrawal = age > retirementAge ? percentile([...fixedWithdrawals].sort((a, b) => a - b), 50) : 0

    bands.push({
      age,
      p5: percentile(sorted, 5),
      p10: percentile(sorted, 10),
      p25: percentile(sorted, 25),
      p50: percentile(sorted, 50),
      p75: percentile(sorted, 75),
      p90: percentile(sorted, 90),
      p95: percentile(sorted, 95),
      assetMedians,
      totalIncome,
      totalWithdrawal,
    })
  }

  const finalValues = portfoliosByYear[totalYears]
  const successes = finalValues.filter((v) => v > 0).length
  const successProbability = (successes / N_SIMS) * 100

  const retirementYearIdx = accumYears
  const retirementSorted = [...portfoliosByYear[retirementYearIdx]].sort((a, b) => a - b)
  const medianAtRetirement = percentile(retirementSorted, 50)
  const p10AtRetirement = percentile(retirementSorted, 10)
  const p90AtRetirement = percentile(retirementSorted, 90)

  const finalSorted = [...portfoliosByYear[totalYears]].sort((a, b) => a - b)
  const medianAtEnd = percentile(finalSorted, 50)

  return {
    bands,
    successProbability,
    medianAtRetirement,
    medianAtEnd,
    p10AtRetirement,
    p90AtRetirement,
  }
}

/**
 * Find the minimum annual employment income increase needed to reach targetSuccessPct.
 * Binary searches over the first employment income stream's annualAmount.
 */
export function findIncomeSuggestion(
  inputs: SimulationInputs,
  targetSuccessPct = 90
): number | null {
  const empIdx = inputs.incomeStreams.findIndex((s) => s.type === 'employment')
  if (empIdx === -1) return null

  let lo = 0
  let hi = 100_000
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    const newStreams = inputs.incomeStreams.map((s, idx) =>
      idx === empIdx ? { ...s, annualAmount: s.annualAmount + mid } : s
    )
    const result = runSimulation({ ...inputs, incomeStreams: newStreams })
    if (result.successProbability >= targetSuccessPct) {
      hi = mid
    } else {
      lo = mid
    }
  }
  const delta = Math.round((lo + hi) / 2 / 1000) * 1000  // round to nearest NZ$1000
  return delta > 0 ? delta : null
}

/**
 * Find the minimum retirement age delay needed to reach targetSuccessPct.
 * Returns null if not achievable within 15 extra years.
 */
export function findRetirementAgeSuggestion(
  inputs: SimulationInputs,
  targetSuccessPct = 90
): number | null {
  for (let delay = 1; delay <= 15; delay++) {
    const newRetirementAge = inputs.retirementAge + delay
    if (newRetirementAge >= inputs.lifeExpectancy) break
    const result = runSimulation({ ...inputs, retirementAge: newRetirementAge })
    if (result.successProbability >= targetSuccessPct) {
      return delay
    }
  }
  return null
}
