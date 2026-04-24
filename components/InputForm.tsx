'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import type { SimulationInputs, AssetDefinition, IncomeStream, IncomeType, LumpSumExpense, RiskProfile, ExpensePhase, AssetType } from '@/lib/types'
import { RISK_PROFILES } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface InputFormProps {
  inputs: SimulationInputs
  onChange: (inputs: SimulationInputs) => void
  view?: 'sidebar' | 'assets'
}

interface SectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  accent?: 'orange' | 'yellow' | 'none'
}

function Section({ title, children, defaultOpen = false, accent = 'none' }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const leftBorder =
    accent === 'orange' ? '3px solid var(--c-accent-orange)' :
    accent === 'yellow' ? '3px solid var(--c-accent-yellow)' :
    undefined

  return (
    <div className="border-2 border-[var(--c-border)]" style={leftBorder ? { borderLeft: leftBorder } : undefined}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--c-surface)] transition-colors cursor-pointer"
      >
        <span className="text-xs font-mono uppercase tracking-widest text-[var(--c-text-muted)]">
          {title}
        </span>
        <ChevronDown
          size={14}
          className="text-[var(--c-text-muted)]"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div className="px-4 pb-4 pt-2 flex flex-col gap-4 border-t border-[var(--c-border)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  format: (v: number) => string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function commitDraft() {
    const parsed = parseFloat(draft)
    if (!isNaN(parsed)) onChange(Math.min(max, Math.max(min, parsed)))
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitDraft()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="w-16 text-right text-xs font-mono bg-[var(--c-bg)] border border-[var(--c-accent-orange)] text-[var(--c-text)] px-1.5 py-0.5 outline-none"
            style={{ colorScheme: 'dark' }}
          />
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(String(value)); setEditing(true); setTimeout(() => inputRef.current?.select(), 0) }}
            title="Click to type a value"
          >
            <Badge variant="mono" className="cursor-text hover:border-[var(--c-accent-orange)] transition-colors">
              {format(value)}
            </Badge>
          </button>
        )}
      </div>
      <Slider value={value} onChange={onChange} min={min} max={max} step={step} />
    </div>
  )
}

/** Number input that allows clearing/retyping without snapping to 0 mid-edit */
function NumericInput({
  value,
  onValueChange,
  onBlur,
  isFloat,
  prefix,
  error,
  min,
  max,
}: {
  value: number
  onValueChange: (v: number) => void
  onBlur?: () => void
  isFloat?: boolean
  prefix?: string
  error?: string
  min?: number
  max?: number
}) {
  const [draft, setDraft] = useState<string | null>(null)

  function commit(str: string) {
    const parsed = isFloat ? parseFloat(str) : parseInt(str, 10)
    if (!isNaN(parsed)) {
      const lo = min ?? -Infinity
      const hi = max ?? Infinity
      onValueChange(Math.min(hi, Math.max(lo, parsed)))
    }
    setDraft(null)
  }

  return (
    <Input
      type="number"
      prefix={prefix}
      error={error}
      min={min}
      max={max}
      value={draft ?? String(value)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => { commit(e.target.value); onBlur?.() }}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
    />
  )
}

const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  employment: 'Employment',
  rental: 'Rental',
  nz_super: 'NZ Super',
  lump_sum: 'Lump Sum',
  ongoing: 'Ongoing',
}

type AssetTypeConfig = {
  label: string
  defaultReturn: number
  defaultVolatility: number
  defaultRiskProfile?: RiskProfile
  showReturn: boolean
  returnLabel: string
  showVolatility: boolean
  showFee: boolean
  showRiskProfile: boolean
  showTimeToMaturity: boolean
  maturityUnit?: 'years' | 'months'
  showTaxRate: boolean
}

// Return/volatility defaults for equity types are derived from OECD SPASTT01 total return
// index data (full history through 2026): NZX 4.9%/14.4%, ASX 6.3%/15.5%, S&P500 6.6%/12.5%.
// All figures are nominal, before fees and tax.
const ASSET_TYPE_CONFIG: Record<AssetType, AssetTypeConfig> = {
  cash:            { label: 'Cash',                   defaultReturn: 0,   defaultVolatility: 0,   showReturn: false, returnLabel: 'Expected return', showVolatility: false, showFee: false, showRiskProfile: false, showTimeToMaturity: false,                         showTaxRate: false },
  bonds:           { label: 'Bonds',                  defaultReturn: 4.5, defaultVolatility: 5.0, defaultRiskProfile: 'conservative', showReturn: true,  returnLabel: 'Coupon rate',     showVolatility: true,  showFee: false, showRiskProfile: false, showTimeToMaturity: true,  maturityUnit: 'years',  showTaxRate: true  },
  term_deposit:    { label: 'Term Deposit',            defaultReturn: 4.5, defaultVolatility: 0,   defaultRiskProfile: 'fixed',        showReturn: true,  returnLabel: 'Interest rate',   showVolatility: false, showFee: false, showRiskProfile: false, showTimeToMaturity: true,  maturityUnit: 'months', showTaxRate: true  },
  kiwisaver:       { label: 'KiwiSaver',              defaultReturn: 5.5, defaultVolatility: 10,  defaultRiskProfile: 'moderate',     showReturn: true,  returnLabel: 'Expected return', showVolatility: true,  showFee: true,  showRiskProfile: true,  showTimeToMaturity: false,                         showTaxRate: true  },
  nz_equities:     { label: 'NZ Equities',            defaultReturn: 4.9, defaultVolatility: 14.4, defaultRiskProfile: 'growth',      showReturn: true,  returnLabel: 'Expected return', showVolatility: true,  showFee: false, showRiskProfile: true,  showTimeToMaturity: false,                         showTaxRate: true  },
  au_equities:     { label: 'Australian Equities',    defaultReturn: 6.3, defaultVolatility: 15.5, defaultRiskProfile: 'growth',      showReturn: true,  returnLabel: 'Expected return', showVolatility: true,  showFee: false, showRiskProfile: true,  showTimeToMaturity: false,                         showTaxRate: true  },
  global_equities: { label: 'Global Equities',        defaultReturn: 6.6, defaultVolatility: 12.5, defaultRiskProfile: 'growth',      showReturn: true,  returnLabel: 'Expected return', showVolatility: true,  showFee: false, showRiskProfile: true,  showTimeToMaturity: false,                         showTaxRate: true  },
  property:        { label: 'Property',               defaultReturn: 5.0, defaultVolatility: 12,  showReturn: true,  returnLabel: 'Expected return', showVolatility: true,  showFee: false, showRiskProfile: false, showTimeToMaturity: false,                         showTaxRate: true  },
  managed_fund:    { label: 'Managed Fund',           defaultReturn: 5.5, defaultVolatility: 10,  defaultRiskProfile: 'moderate',     showReturn: true,  returnLabel: 'Expected return', showVolatility: true,  showFee: true,  showRiskProfile: true,  showTimeToMaturity: false,                         showTaxRate: true  },
  alternative:     { label: 'Alternative Investment', defaultReturn: 6.0, defaultVolatility: 15,  showReturn: true,  returnLabel: 'Expected return', showVolatility: true,  showFee: false, showRiskProfile: false, showTimeToMaturity: false,                         showTaxRate: true  },
  other:           { label: 'Other',                  defaultReturn: 5.0, defaultVolatility: 10,  defaultRiskProfile: 'moderate',     showReturn: true,  returnLabel: 'Expected return', showVolatility: true,  showFee: false, showRiskProfile: true,  showTimeToMaturity: false,                         showTaxRate: true  },
}

// ─── Asset Card ──────────────────────────────────────────────────────────────

function AssetCard({
  asset,
  canDelete,
  focusName,
  onChange,
  onDelete,
}: {
  asset: AssetDefinition
  canDelete: boolean
  focusName?: boolean
  onChange: (a: AssetDefinition) => void
  onDelete: () => void
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof AssetDefinition>(key: K, value: AssetDefinition[K]) =>
    onChange({ ...asset, [key]: value })

  useEffect(() => {
    if (focusName) {
      nameRef.current?.focus()
      nameRef.current?.select()
    }
  }, [focusName])

  const cfg: AssetTypeConfig | null = asset.assetType ? ASSET_TYPE_CONFIG[asset.assetType] : null

  function handleTypeChange(type: AssetType | '') {
    if (!type) {
      onChange({ ...asset, assetType: undefined })
      return
    }
    const c = ASSET_TYPE_CONFIG[type]
    onChange({
      ...asset,
      assetType: type,
      expectedReturn: c.defaultReturn,
      volatility: c.defaultVolatility,
      riskProfile: c.defaultRiskProfile,
      name: asset.name === 'New Asset' ? c.label : asset.name,
    })
  }

  const showReturn = !cfg || cfg.showReturn
  const returnLabel = cfg?.returnLabel ?? 'Expected return'
  const showRiskProfile = !showAdvanced && (!cfg || cfg.showRiskProfile)
  const showVolatilityAdv = showAdvanced && (!cfg || cfg.showVolatility)
  const showFeeAdv = showAdvanced && (!cfg || cfg.showFee)
  const showTaxAdv = showAdvanced && (!cfg || cfg.showTaxRate)
  const showTimeToMaturity = cfg?.showTimeToMaturity ?? false
  const hasAdvanced = !cfg || cfg.showReturn || cfg.showVolatility || cfg.showFee || cfg.showTaxRate

  return (
    <div className="border-2 border-[var(--c-border)] bg-[var(--c-surface)] flex flex-col gap-3 p-3" style={{ borderLeft: '3px solid var(--c-accent-orange)' }}>
      {/* Header row */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={asset.visible}
          onChange={(e) => set('visible', e.target.checked)}
          className="accent-[var(--c-accent-orange)] w-3.5 h-3.5 cursor-pointer"
          title="Show in chart/table"
        />
        <input
          ref={nameRef}
          type="text"
          value={asset.name}
          onChange={(e) => set('name', e.target.value)}
          className="flex-1 bg-transparent text-sm font-mono text-[var(--c-text)] outline-none border-b border-[var(--c-border)] focus:border-[var(--c-accent-orange)] pb-0.5 transition-colors"
          placeholder="Asset name"
          title="Click to rename"
        />
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-[var(--c-text-muted)] hover:text-[var(--c-accent-orange)] transition-colors cursor-pointer"
            title="Remove asset"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Asset type selector */}
      <select
        value={asset.assetType ?? ''}
        onChange={(e) => handleTypeChange(e.target.value as AssetType | '')}
        className="bg-[var(--c-bg)] border border-[var(--c-border)] text-xs font-mono text-[var(--c-text-muted)] px-1.5 py-1 outline-none cursor-pointer w-full"
      >
        <option value="">Select asset type…</option>
        {(Object.keys(ASSET_TYPE_CONFIG) as AssetType[]).map((t) => (
          <option key={t} value={t}>{ASSET_TYPE_CONFIG[t].label}</option>
        ))}
      </select>

      <Field label="Current balance">
        <NumericInput
          prefix="NZ$"
          value={asset.currentBalance}
          onValueChange={(v) => set('currentBalance', v)}
          isFloat
          min={0}
        />
      </Field>

      {/* Time to maturity — bonds and term deposits */}
      {showTimeToMaturity && (
        <Field label={cfg?.maturityUnit === 'months' ? 'Term (months)' : 'Time to maturity (years)'}>
          <NumericInput
            value={asset.timeToMaturity ?? 0}
            onValueChange={(v) => set('timeToMaturity', v)}
            min={0}
            max={cfg?.maturityUnit === 'months' ? 120 : 30}
          />
        </Field>
      )}

      {/* Risk profile buttons — only when config allows and not in advanced mode */}
      {showRiskProfile && (
        <div className="flex flex-col gap-1.5">
          <Label>Risk profile</Label>
          <div className="flex gap-0">
            {(Object.entries(RISK_PROFILES) as [RiskProfile, typeof RISK_PROFILES[RiskProfile]][]).map(([key, profile], i) => (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ ...asset, riskProfile: key, volatility: profile.volatility })}
                className={cn(
                  'flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wide border-2 transition-colors cursor-pointer',
                  i > 0 && 'border-l-0',
                  asset.riskProfile === key
                    ? 'border-[var(--c-accent-orange)] text-[var(--c-accent-orange)] bg-[var(--c-surface)]'
                    : 'border-[var(--c-border)] text-[var(--c-text-muted)] hover:border-[var(--c-border-light)]'
                )}
              >
                {profile.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expected return / coupon rate / interest rate */}
      {showReturn && (
        <SliderField
          label={returnLabel}
          value={asset.expectedReturn}
          onChange={(v) => set('expectedReturn', v)}
          min={0}
          max={15}
          step={0.5}
          format={(v) => `${v.toFixed(1)}%`}
        />
      )}

      {/* Advanced: volatility, fees, tax */}
      {showVolatilityAdv && (
        <SliderField
          label="Volatility (std dev)"
          value={asset.volatility}
          onChange={(v) => onChange({ ...asset, volatility: v, riskProfile: undefined })}
          min={0}
          max={40}
          step={0.5}
          format={(v) => `${v.toFixed(1)}%`}
        />
      )}
      {showFeeAdv && (
        <SliderField
          label="Management fee (display only)"
          value={asset.feeRate ?? 0}
          onChange={(v) => set('feeRate', v)}
          min={0}
          max={3}
          step={0.05}
          format={(v) => `${v.toFixed(2)}% p.a.`}
        />
      )}
      {showTaxAdv && (
        <SliderField
          label="Tax rate on returns"
          value={asset.taxRate ?? 0}
          onChange={(v) => set('taxRate', v)}
          min={0}
          max={39}
          step={1}
          format={(v) => `${v.toFixed(0)}%`}
        />
      )}

      {hasAdvanced && (
        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="text-[10px] font-mono text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors cursor-pointer text-left"
        >
          {showAdvanced ? '← Presets' : 'Advanced ▸'}
        </button>
      )}
    </div>
  )
}

// ─── Income Stream Card ───────────────────────────────────────────────────────

function IncomeCard({
  stream,
  canDelete,
  onChange,
  onDelete,
}: {
  stream: IncomeStream
  canDelete: boolean
  onChange: (s: IncomeStream) => void
  onDelete: () => void
}) {
  const set = <K extends keyof IncomeStream>(key: K, value: IncomeStream[K]) =>
    onChange({ ...stream, [key]: value })

  const isLumpSum = stream.type === 'lump_sum'

  return (
    <div className="border-2 border-[var(--c-border)] bg-[var(--c-surface)] flex flex-col gap-3 p-3" style={{ borderLeft: '3px solid var(--c-accent-yellow)' }}>
      {/* Header row */}
      <div className="flex items-center gap-2">
        <select
          value={stream.type}
          onChange={(e) => set('type', e.target.value as IncomeType)}
          className="bg-[var(--c-bg)] border border-[var(--c-border)] text-xs font-mono text-[var(--c-text-muted)] px-1.5 py-1 outline-none cursor-pointer"
        >
          {(Object.keys(INCOME_TYPE_LABELS) as IncomeType[]).map((t) => (
            <option key={t} value={t}>
              {INCOME_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={stream.label}
          onChange={(e) => set('label', e.target.value)}
          className="flex-1 bg-transparent text-sm font-mono text-[var(--c-text)] outline-none border-b border-transparent focus:border-[var(--c-border-light)] pb-0.5 transition-colors"
          placeholder="Label"
        />
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-[var(--c-text-muted)] hover:text-[var(--c-accent-orange)] transition-colors cursor-pointer"
            title="Remove income stream"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <Field label={isLumpSum ? 'Lump sum amount' : 'Annual amount'}>
        <NumericInput
          prefix="NZ$"
          value={stream.annualAmount}
          onValueChange={(v) => set('annualAmount', v)}
          isFloat
          min={0}
        />
      </Field>

      {!isLumpSum && (
        <SliderField
          label="Annual growth rate"
          value={stream.growthRate ?? 0}
          onChange={(v) => set('growthRate', v)}
          min={-3}
          max={5}
          step={0.1}
          format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%/yr`}
        />
      )}

      {!isLumpSum && (
        <SliderField
          label="Tax rate on income"
          value={stream.taxRate ?? 0}
          onChange={(v) => set('taxRate', v)}
          min={0}
          max={39}
          step={1}
          format={(v) => `${v.toFixed(0)}%`}
        />
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label={isLumpSum ? 'At age' : 'Start age'}>
          <NumericInput
            value={stream.startAge}
            onValueChange={(v) => {
              set('startAge', v)
              if (isLumpSum) set('endAge', v)
            }}
            min={18}
            max={100}
          />
        </Field>
        {!isLumpSum && (
          <Field label="End age">
            <NumericInput
              value={stream.endAge}
              onValueChange={(v) => set('endAge', v)}
              min={18}
              max={110}
            />
          </Field>
        )}
      </div>
    </div>
  )
}

// ─── Lump Sum Expense Card ────────────────────────────────────────────────────

function ExpenseCard({
  expense,
  currentAge,
  currentYear,
  onChange,
  onDelete,
}: {
  expense: LumpSumExpense
  currentAge: number
  currentYear: number
  onChange: (e: LumpSumExpense) => void
  onDelete: () => void
}) {
  const set = <K extends keyof LumpSumExpense>(key: K, value: LumpSumExpense[K]) =>
    onChange({ ...expense, [key]: value })

  const calYear = currentYear + (expense.atAge - currentAge)

  return (
    <div className="border-2 border-[var(--c-border)] bg-[var(--c-surface)] flex flex-col gap-3 p-3" style={{ borderLeft: '3px solid var(--c-accent-orange)' }}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={expense.label}
          onChange={(e) => set('label', e.target.value)}
          className="flex-1 bg-transparent text-sm font-mono text-[var(--c-text)] outline-none border-b border-transparent focus:border-[var(--c-border-light)] pb-0.5 transition-colors"
          placeholder="e.g. New car"
        />
        <button
          type="button"
          onClick={onDelete}
          className="text-[var(--c-text-muted)] hover:text-[var(--c-accent-orange)] transition-colors cursor-pointer"
          title="Remove expense"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <Field label="Amount">
        <NumericInput
          prefix="NZ$"
          value={expense.amount}
          onValueChange={(v) => set('amount', v)}
          isFloat
          min={0}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label={`At age (${calYear})`}>
          <NumericInput
            value={expense.atAge}
            onValueChange={(v) => set('atAge', v)}
            min={currentAge}
            max={110}
          />
        </Field>
      </div>
    </div>
  )
}

// ─── Main Form ───────────────────────────────────────────────────────────────

export function InputForm({ inputs, onChange, view = 'sidebar' }: InputFormProps) {
  const [ageErrors, setAgeErrors] = useState<{ retirementAge?: string; lifeExpectancy?: string }>({})
  const [newAssetId, setNewAssetId] = useState<string | null>(null)
  useEffect(() => {
    if (newAssetId) setNewAssetId(null)
  }, [inputs.assets.length])

  function validateAge() {
    const errs: typeof ageErrors = {}
    if (inputs.retirementAge <= inputs.currentAge) errs.retirementAge = 'Must be greater than current age'
    if (inputs.lifeExpectancy <= inputs.retirementAge) errs.lifeExpectancy = 'Must be greater than retirement age'
    setAgeErrors(errs)
  }

  // ── Asset helpers ──
  function updateAsset(id: string, updated: AssetDefinition) {
    onChange({ ...inputs, assets: inputs.assets.map((a) => (a.id === id ? updated : a)) })
  }

  function addAsset() {
    const id = crypto.randomUUID()
    const newAsset: AssetDefinition = {
      id,
      name: 'New Asset',
      currentBalance: 0,
      expectedReturn: 5.0,
      volatility: RISK_PROFILES.moderate.volatility,
      riskProfile: 'moderate',
      visible: true,
    }
    onChange({ ...inputs, assets: [...inputs.assets, newAsset] })
    setNewAssetId(id)
  }

  function deleteAsset(id: string) {
    onChange({ ...inputs, assets: inputs.assets.filter((a) => a.id !== id) })
  }

  // ── Income helpers ──
  function updateStream(id: string, updated: IncomeStream) {
    onChange({ ...inputs, incomeStreams: inputs.incomeStreams.map((s) => (s.id === id ? updated : s)) })
  }

  function addStream() {
    const newStream: IncomeStream = {
      id: crypto.randomUUID(),
      type: 'ongoing',
      label: 'New Income',
      annualAmount: 0,
      startAge: inputs.currentAge,
      endAge: inputs.retirementAge,
    }
    onChange({ ...inputs, incomeStreams: [...inputs.incomeStreams, newStream] })
  }

  function deleteStream(id: string) {
    onChange({ ...inputs, incomeStreams: inputs.incomeStreams.filter((s) => s.id !== id) })
  }

  // ── Expense phase helpers ──
  function updatePhase(id: string, updated: ExpensePhase) {
    onChange({ ...inputs, expensePhases: (inputs.expensePhases ?? []).map((p) => p.id === id ? updated : p) })
  }

  function addPhase() {
    const sorted = [...(inputs.expensePhases ?? [])].sort((a, b) => a.fromAge - b.fromAge)
    const last = sorted[sorted.length - 1]
    const newFromAge = last ? Math.min(last.fromAge + 10, inputs.lifeExpectancy - 1) : inputs.retirementAge
    const newPhase: ExpensePhase = {
      id: crypto.randomUUID(),
      label: 'New Phase',
      fromAge: newFromAge,
      toAge: inputs.lifeExpectancy,
      amount: last?.amount ?? 50000,
    }
    onChange({ ...inputs, expensePhases: [...(inputs.expensePhases ?? []), newPhase] })
  }

  function deletePhase(id: string) {
    onChange({ ...inputs, expensePhases: (inputs.expensePhases ?? []).filter((p) => p.id !== id) })
  }

  // ── Lump sum expense helpers ──
  const currentYear = new Date().getFullYear()

  function updateExpense(id: string, updated: LumpSumExpense) {
    onChange({ ...inputs, lumpSumExpenses: (inputs.lumpSumExpenses ?? []).map((e) => (e.id === id ? updated : e)) })
  }

  function addExpense() {
    const newExpense: LumpSumExpense = {
      id: crypto.randomUUID(),
      label: 'New Expense',
      amount: 0,
      atAge: inputs.currentAge + 2,
    }
    onChange({ ...inputs, lumpSumExpenses: [...(inputs.lumpSumExpenses ?? []), newExpense] })
  }

  function deleteExpense(id: string) {
    onChange({ ...inputs, lumpSumExpenses: (inputs.lumpSumExpenses ?? []).filter((e) => e.id !== id) })
  }

  if (view === 'assets') {
    return (
      <div className="flex flex-col gap-0">
        {/* ── Assets ── */}
        <Section title="Assets" defaultOpen accent="orange">
          <div className="flex flex-col gap-3">
            {inputs.assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                canDelete={true}
                focusName={asset.id === newAssetId}
                onChange={(updated) => updateAsset(asset.id, updated)}
                onDelete={() => deleteAsset(asset.id)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addAsset}
            className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-[var(--c-border)] text-xs font-mono uppercase tracking-widest text-[var(--c-text-muted)] hover:border-[var(--c-border-light)] hover:text-[var(--c-text)] transition-colors cursor-pointer w-full justify-center"
          >
            <Plus size={12} />
            Add Asset
          </button>
          <p className="text-xs text-[var(--c-text-muted)] font-mono leading-relaxed">
            Checkbox = visible in chart/table. All assets are always included in the simulation.
          </p>
        </Section>

        {/* ── Income ── */}
        <Section title="Income" defaultOpen accent="yellow">
          <p className="text-xs text-[var(--c-text-muted)] font-mono leading-relaxed">
            In retirement, income offsets your withdrawal — only the remainder is drawn from your portfolio.
          </p>
          <div className="flex flex-col gap-3">
            {inputs.incomeStreams.map((stream) => (
              <IncomeCard
                key={stream.id}
                stream={stream}
                canDelete={true}
                onChange={(updated) => updateStream(stream.id, updated)}
                onDelete={() => deleteStream(stream.id)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addStream}
            className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-[var(--c-border)] text-xs font-mono uppercase tracking-widest text-[var(--c-text-muted)] hover:border-[var(--c-border-light)] hover:text-[var(--c-text)] transition-colors cursor-pointer w-full justify-center"
          >
            <Plus size={12} />
            Add Income Stream
          </button>
        </Section>

        {/* ── Lump Sum Expenses ── */}
        <Section title="Lump Sum Expenses">
          <p className="text-xs text-[var(--c-text-muted)] font-mono leading-relaxed">
            One-off future expenses deducted from your portfolio in the year they occur (e.g. new car, home renovations).
          </p>
          {(inputs.lumpSumExpenses ?? []).length > 0 && (
            <div className="flex flex-col gap-3">
              {(inputs.lumpSumExpenses ?? []).map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  currentAge={inputs.currentAge}
                  currentYear={currentYear}
                  onChange={(updated) => updateExpense(expense.id, updated)}
                  onDelete={() => deleteExpense(expense.id)}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addExpense}
            className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-[var(--c-border)] text-xs font-mono uppercase tracking-widest text-[var(--c-text-muted)] hover:border-[var(--c-border-light)] hover:text-[var(--c-text)] transition-colors cursor-pointer w-full justify-center"
          >
            <Plus size={12} />
            Add Expense
          </button>
        </Section>
      </div>
    )
  }

  // view === 'sidebar'
  return (
    <div className="flex flex-col gap-0">
      {/* ── Personal ── */}
      <Section title="Personal" defaultOpen>
        <Field label="Current age">
          <NumericInput
            value={inputs.currentAge}
            onValueChange={(v) => onChange({ ...inputs, currentAge: v })}
            onBlur={validateAge}
            min={18}
            max={80}
          />
        </Field>
        <Field label="Retirement age">
          <NumericInput
            value={inputs.retirementAge}
            onValueChange={(v) => onChange({ ...inputs, retirementAge: v })}
            onBlur={validateAge}
            error={ageErrors.retirementAge}
            min={30}
            max={80}
          />
        </Field>
        <Field label="Life expectancy">
          <NumericInput
            value={inputs.lifeExpectancy}
            onValueChange={(v) => onChange({ ...inputs, lifeExpectancy: v })}
            onBlur={validateAge}
            error={ageErrors.lifeExpectancy}
            min={60}
            max={110}
          />
        </Field>
      </Section>

      {/* ── Annual Expenses ── */}
      <Section title="Annual Expenses" defaultOpen>
        <p className="text-xs text-[var(--c-text-muted)] font-mono leading-relaxed">
          Spending per life phase in today&apos;s dollars. Add phases to model how spending changes as you age — active retirement, slowing down, aged care.
        </p>
        <div className="flex flex-col gap-2">
          {[...(inputs.expensePhases ?? [])].sort((a, b) => a.fromAge - b.fromAge).map((phase, idx, sorted) => {
            const displayToAge = phase.toAge ?? inputs.lifeExpectancy
            const isFirst = idx === 0
            return (
              <div key={phase.id} className="border-2 border-[var(--c-border)] bg-[var(--c-surface)] p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--c-accent-yellow)]">
                    Age {phase.fromAge}–{displayToAge}
                  </span>
                  {(inputs.expensePhases ?? []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => deletePhase(phase.id)}
                      className="text-[var(--c-text-muted)] hover:text-[var(--c-accent-orange)] transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="From age">
                    <NumericInput
                      value={phase.fromAge}
                      onValueChange={(v) => updatePhase(phase.id, { ...phase, fromAge: v })}
                      min={isFirst ? inputs.currentAge : inputs.currentAge + 1}
                      max={inputs.lifeExpectancy - 1}
                    />
                  </Field>
                  <Field label="To age">
                    <NumericInput
                      value={phase.toAge ?? inputs.lifeExpectancy}
                      onValueChange={(v) => updatePhase(phase.id, { ...phase, toAge: v })}
                      min={phase.fromAge}
                      max={inputs.lifeExpectancy}
                    />
                  </Field>
                  <div className="col-span-2">
                    <Field label="NZ$/year">
                      <NumericInput
                        prefix="NZ$"
                        value={phase.amount}
                        onValueChange={(v) => updatePhase(phase.id, { ...phase, amount: v })}
                        isFloat
                        min={0}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={addPhase}
          className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-[var(--c-border)] text-xs font-mono uppercase tracking-widest text-[var(--c-text-muted)] hover:border-[var(--c-border-light)] hover:text-[var(--c-text)] transition-colors cursor-pointer w-full justify-center"
        >
          <Plus size={12} />
          Add Expense Phase
        </button>
      </Section>

      {/* ── Inflation & Tax ── */}
      <Section title="Inflation & Tax">
        <SliderField
          label="Inflation rate"
          value={inputs.inflationRate}
          onChange={(v) => onChange({ ...inputs, inflationRate: v })}
          min={0}
          max={10}
          step={0.1}
          format={(v) => `${v.toFixed(1)}%`}
        />
        <SliderField
          label="Income tax rate"
          value={inputs.globalTaxRate ?? 0}
          onChange={(v) => onChange({ ...inputs, globalTaxRate: v })}
          min={0}
          max={50}
          step={1}
          format={(v) => `${v.toFixed(0)}%`}
        />
        <p className="text-xs text-[var(--c-text-muted)] font-mono leading-relaxed">
          Income tax applies to all income streams. Override per stream in the Inputs tab. Expected return and risk profile are set per asset.
        </p>
      </Section>
    </div>
  )
}
