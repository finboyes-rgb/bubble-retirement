'use client'

import { useState, useRef } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import type { SimulationInputs, AssetDefinition, IncomeStream, IncomeType, LumpSumExpense, RiskProfile } from '@/lib/types'
import { RISK_PROFILES } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface InputFormProps {
  inputs: SimulationInputs
  onChange: (inputs: SimulationInputs) => void
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

const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  employment: 'Employment',
  rental: 'Rental',
  nz_super: 'NZ Super',
  lump_sum: 'Lump Sum',
  ongoing: 'Ongoing',
}

// ─── Asset Card ──────────────────────────────────────────────────────────────

function AssetCard({
  asset,
  canDelete,
  onChange,
  onDelete,
}: {
  asset: AssetDefinition
  canDelete: boolean
  onChange: (a: AssetDefinition) => void
  onDelete: () => void
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const set = <K extends keyof AssetDefinition>(key: K, value: AssetDefinition[K]) =>
    onChange({ ...asset, [key]: value })

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
          type="text"
          value={asset.name}
          onChange={(e) => set('name', e.target.value)}
          className="flex-1 bg-transparent text-sm font-mono text-[var(--c-text)] outline-none border-b border-transparent focus:border-[var(--c-border-light)] pb-0.5 transition-colors"
          placeholder="Asset name"
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

      <Field label="Current balance">
        <Input
          type="number"
          prefix="NZ$"
          value={asset.currentBalance}
          onChange={(e) => set('currentBalance', parseFloat(e.target.value) || 0)}
          min={0}
        />
      </Field>

      {/* Risk profile buttons (hidden in advanced mode) */}
      {!showAdvanced && (
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

      {/* Expected return — always visible */}
      <SliderField
        label="Expected return (real)"
        value={asset.expectedReturn}
        onChange={(v) => set('expectedReturn', v)}
        min={0}
        max={15}
        step={0.5}
        format={(v) => `${v.toFixed(1)}%`}
      />

      {/* Advanced: raw volatility slider */}
      {showAdvanced && (
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

      <button
        type="button"
        onClick={() => setShowAdvanced((s) => !s)}
        className="text-[10px] font-mono text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors cursor-pointer text-left"
      >
        {showAdvanced ? '← Presets' : 'Advanced ▸'}
      </button>
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
        <Input
          type="number"
          prefix="NZ$"
          value={stream.annualAmount}
          onChange={(e) => set('annualAmount', parseFloat(e.target.value) || 0)}
          min={0}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label={isLumpSum ? 'At age' : 'Start age'}>
          <Input
            type="number"
            value={stream.startAge}
            onChange={(e) => {
              const v = parseInt(e.target.value) || 0
              set('startAge', v)
              if (isLumpSum) set('endAge', v)
            }}
            min={18}
            max={100}
          />
        </Field>
        {!isLumpSum && (
          <Field label="End age">
            <Input
              type="number"
              value={stream.endAge}
              onChange={(e) => set('endAge', parseInt(e.target.value) || 0)}
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
        <Input
          type="number"
          prefix="NZ$"
          value={expense.amount}
          onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
          min={0}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label={`At age (${calYear})`}>
          <Input
            type="number"
            value={expense.atAge}
            onChange={(e) => set('atAge', parseInt(e.target.value) || currentAge)}
            min={currentAge}
            max={110}
          />
        </Field>
      </div>
    </div>
  )
}

// ─── Main Form ───────────────────────────────────────────────────────────────

export function InputForm({ inputs, onChange }: InputFormProps) {
  const [ageErrors, setAgeErrors] = useState<{ retirementAge?: string; lifeExpectancy?: string }>({})

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
    const newAsset: AssetDefinition = {
      id: crypto.randomUUID(),
      name: 'New Asset',
      currentBalance: 0,
      expectedReturn: 5.0,
      volatility: RISK_PROFILES.moderate.volatility,
      riskProfile: 'moderate',
      visible: true,
    }
    onChange({ ...inputs, assets: [...inputs.assets, newAsset] })
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

  return (
    <div className="flex flex-col gap-0">
      {/* ── Personal ── */}
      <Section title="Personal" defaultOpen>
        <Field label="Current age">
          <Input
            type="number"
            value={inputs.currentAge}
            onChange={(e) => onChange({ ...inputs, currentAge: parseInt(e.target.value) || 0 })}
            onBlur={validateAge}
            min={18}
            max={80}
          />
        </Field>
        <Field label="Retirement age">
          <Input
            type="number"
            value={inputs.retirementAge}
            onChange={(e) => onChange({ ...inputs, retirementAge: parseInt(e.target.value) || 0 })}
            onBlur={validateAge}
            error={ageErrors.retirementAge}
            min={30}
            max={80}
          />
        </Field>
        <Field label="Life expectancy">
          <Input
            type="number"
            value={inputs.lifeExpectancy}
            onChange={(e) => onChange({ ...inputs, lifeExpectancy: parseInt(e.target.value) || 0 })}
            onBlur={validateAge}
            error={ageErrors.lifeExpectancy}
            min={60}
            max={110}
          />
        </Field>
      </Section>

      {/* ── Assets ── */}
      <Section title="Assets" defaultOpen accent="orange">
        <div className="flex flex-col gap-3">
          {inputs.assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              canDelete={inputs.assets.length > 1}
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
      <Section title="Income" accent="yellow">
        <p className="text-xs text-[var(--c-text-muted)] font-mono leading-relaxed">
          In retirement, income offsets your withdrawal — only the remainder is drawn from your portfolio.
        </p>
        <div className="flex flex-col gap-3">
          {inputs.incomeStreams.map((stream) => (
            <IncomeCard
              key={stream.id}
              stream={stream}
              canDelete={inputs.incomeStreams.length > 1}
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

      {/* ── Annual Expenses ── */}
      <Section title="Annual Expenses">
        <p className="text-xs text-[var(--c-text-muted)] font-mono leading-relaxed">
          Your expected yearly spending in today&apos;s dollars. In retirement, your portfolio covers any gap between expenses and income.
        </p>
        <Field label="Annual expenses (today's dollars)">
          <Input
            type="number"
            prefix="NZ$"
            value={inputs.annualExpenses}
            onChange={(e) => onChange({ ...inputs, annualExpenses: parseFloat(e.target.value) || 0 })}
            min={0}
          />
        </Field>
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

      {/* ── Returns ── */}
      <Section title="Returns (real, inflation-adjusted)">
        <SliderField
          label="Inflation rate"
          value={inputs.inflationRate}
          onChange={(v) => onChange({ ...inputs, inflationRate: v })}
          min={0}
          max={10}
          step={0.1}
          format={(v) => `${v.toFixed(1)}%`}
        />
        <p className="text-xs text-[var(--c-text-muted)] font-mono leading-relaxed">
          Expected return and risk profile are set per asset above.
        </p>
      </Section>
    </div>
  )
}
