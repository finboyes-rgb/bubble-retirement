'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import type { SimulationResult } from '@/lib/montecarlo'
import type { SimulationInputs, AssetDefinition } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'

interface SnapshotProjectionData {
  result: SimulationResult
  inputs: SimulationInputs
  snapshotAge: number
}

interface AssetActual {
  assetId: string
  assetName: string
  actualBalance: number
}

interface Snapshot {
  id: string
  snapshotYear: number
  projectionData: SnapshotProjectionData
  actualData: AssetActual[] | null
  label: string | null
  createdAt: string
}

interface AnnualReviewProps {
  result: SimulationResult
  inputs: SimulationInputs
}

export function AnnualReview({ result, inputs }: AnnualReviewProps) {
  const { status } = useSession()

  if (status === 'unauthenticated') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          gap: 16,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--c-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Sign in to use annual review
        </p>
        <a
          href="/login"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--c-accent-orange)',
            border: '2px solid var(--c-accent-orange)',
            padding: '8px 16px',
            textDecoration: 'none',
            boxShadow: '3px 3px 0 var(--c-accent-orange)',
          }}
        >
          Sign In
        </a>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-text-muted)' }}>
        Loading…
      </p>
    )
  }

  return <ReviewContent result={result} inputs={inputs} />
}

function ReviewContent({ result, inputs }: AnnualReviewProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actualInputs, setActualInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/snapshots')
      .then((r) => r.json())
      .then((data) => {
        setSnapshots(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function saveSnapshot() {
    setSaving(true)
    const body = {
      snapshotYear: new Date().getFullYear(),
      projectionData: {
        result,
        inputs,
        snapshotAge: inputs.currentAge,
      },
      label: `End of ${new Date().getFullYear()}`,
    }
    const res = await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const created = await res.json()
      setSnapshots((prev) => [created, ...prev])
    }
    setSaving(false)
  }

  async function saveActuals(snapshotId: string) {
    const snapshot = snapshots.find((s) => s.id === snapshotId)
    if (!snapshot) return

    const actualData: AssetActual[] = snapshot.projectionData.inputs.assets.map((a: AssetDefinition) => ({
      assetId: a.id,
      assetName: a.name,
      actualBalance: parseFloat(actualInputs[a.id] ?? '0') || 0,
    }))

    const res = await fetch(`/api/snapshots/${snapshotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actualData }),
    })

    if (res.ok) {
      const updated = await res.json()
      setSnapshots((prev) => prev.map((s) => (s.id === snapshotId ? updated : s)))
      setExpandedId(null)
      setActualInputs({})
    }
  }

  async function deleteSnapshot(id: string) {
    await fetch(`/api/snapshots/${id}`, { method: 'DELETE' })
    setSnapshots((prev) => prev.filter((s) => s.id !== id))
  }

  if (loading) {
    return (
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-text-muted)' }}>
        Loading snapshots…
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header + Save button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--c-text-muted)',
          }}
        >
          Annual Projection Snapshots
        </span>
        <button
          type="button"
          onClick={saveSnapshot}
          disabled={saving}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '6px 14px',
            background: saving ? 'var(--c-border)' : 'var(--c-accent-orange)',
            color: saving ? 'var(--c-text-muted)' : '#17130E',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            boxShadow: saving ? 'none' : '3px 3px 0 #4A3828',
          }}
        >
          {saving ? 'Saving…' : `Save ${new Date().getFullYear()} Snapshot`}
        </button>
      </div>

      {snapshots.length === 0 ? (
        <div
          style={{
            border: '2px dashed var(--c-border)',
            padding: 32,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--c-text-muted)',
              margin: 0,
            }}
          >
            No snapshots yet. Save this year's projection above to start tracking actuals vs
            projected.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {snapshots.map((snapshot) => (
            <SnapshotRow
              key={snapshot.id}
              snapshot={snapshot}
              currentYear={new Date().getFullYear()}
              expanded={expandedId === snapshot.id}
              onToggleExpand={() =>
                setExpandedId((prev) => {
                  if (prev === snapshot.id) return null
                  // Pre-fill actual inputs from existing data
                  if (snapshot.actualData) {
                    const filled: Record<string, string> = {}
                    snapshot.actualData.forEach((a) => {
                      filled[a.assetId] = String(a.actualBalance)
                    })
                    setActualInputs(filled)
                  } else {
                    setActualInputs({})
                  }
                  return snapshot.id
                })
              }
              actualInputs={actualInputs}
              onActualChange={(assetId, val) =>
                setActualInputs((prev) => ({ ...prev, [assetId]: val }))
              }
              onSaveActuals={() => saveActuals(snapshot.id)}
              onDelete={() => deleteSnapshot(snapshot.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SnapshotRow({
  snapshot,
  currentYear,
  expanded,
  onToggleExpand,
  actualInputs,
  onActualChange,
  onSaveActuals,
  onDelete,
}: {
  snapshot: Snapshot
  currentYear: number
  expanded: boolean
  onToggleExpand: () => void
  actualInputs: Record<string, string>
  onActualChange: (assetId: string, val: string) => void
  onSaveActuals: () => void
  onDelete: () => void
}) {
  const yearsElapsed = currentYear - snapshot.snapshotYear
  const bandIndex = Math.max(0, Math.min(yearsElapsed, snapshot.projectionData.result.bands.length - 1))
  const projectedTotal = snapshot.projectionData.result.bands[bandIndex]?.p50 ?? 0

  const actualTotal = snapshot.actualData
    ? snapshot.actualData.reduce((sum, a) => sum + a.actualBalance, 0)
    : null

  const variance = actualTotal !== null ? actualTotal - projectedTotal : null
  const variancePct = variance !== null && projectedTotal > 0 ? (variance / projectedTotal) * 100 : null

  return (
    <div
      style={{
        border: '2px solid var(--c-border)',
        background: 'var(--c-surface)',
      }}
    >
      {/* Summary row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr 1fr 1fr auto',
          alignItems: 'center',
          padding: '12px 16px',
          gap: 16,
        }}
      >
        {/* Year */}
        <div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--c-accent-orange)',
            }}
          >
            {snapshot.snapshotYear}
          </span>
          {snapshot.label && (
            <div
              style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                color: 'var(--c-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {snapshot.label}
            </div>
          )}
        </div>

        {/* Projected */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--c-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Projected {yearsElapsed > 0 ? `(age ${snapshot.projectionData.snapshotAge + yearsElapsed})` : '(at snapshot)'}
          </span>
          <span
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--c-text)' }}
          >
            {formatCurrency(projectedTotal, true)}
          </span>
        </div>

        {/* Actual */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--c-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Actual
          </span>
          <span
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--c-text)' }}
          >
            {actualTotal !== null ? formatCurrency(actualTotal, true) : '—'}
          </span>
        </div>

        {/* Variance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--c-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Variance
          </span>
          {variance !== null && variancePct !== null ? (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: variance >= 0 ? 'var(--c-accent-orange)' : 'var(--c-text-muted)',
                fontWeight: 700,
              }}
            >
              {variance >= 0 ? '+' : ''}
              {formatCurrency(variance, true)} ({variance >= 0 ? '+' : ''}
              {formatPercent(variancePct, 1)})
            </span>
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--c-text-muted)' }}>
              —
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={onToggleExpand}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '4px 10px',
              border: '1px solid var(--c-border)',
              background: expanded ? 'var(--c-surface)' : 'transparent',
              color: expanded ? 'var(--c-accent-orange)' : 'var(--c-text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {expanded ? 'Cancel' : 'Enter Actuals'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--c-text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
            title="Delete snapshot"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded: enter actuals */}
      {expanded && (
        <div
          style={{
            borderTop: '1px solid var(--c-border)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--c-text-muted)',
            }}
          >
            Enter actual balances as of today
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {snapshot.projectionData.inputs.assets.map((asset: AssetDefinition) => (
              <div key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--c-text)',
                    minWidth: 120,
                  }}
                >
                  {asset.name}
                </span>
                <div style={{ flex: 1, maxWidth: 200 }}>
                  <Input
                    type="number"
                    prefix="NZ$"
                    value={actualInputs[asset.id] ?? ''}
                    onChange={(e) => onActualChange(asset.id, e.target.value)}
                    placeholder="0"
                    min={0}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onSaveActuals}
            style={{
              alignSelf: 'flex-start',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '8px 16px',
              background: 'var(--c-accent-orange)',
              color: '#17130E',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '3px 3px 0 #4A3828',
            }}
          >
            Save Actuals
          </button>
        </div>
      )}
    </div>
  )
}
