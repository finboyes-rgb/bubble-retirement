'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'

const labelStyle = {
  fontSize: 10,
  fontFamily: 'var(--font-mono)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'var(--c-text-muted)',
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        setLoading(false)
        return
      }
      router.push('/login?reset=true')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--c-accent-orange)' }}>
        Invalid reset link. Please request a new one.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={labelStyle}>New Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={labelStyle}>Confirm New Password</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Retype your password"
          required
        />
      </div>

      {error && (
        <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--c-accent-orange)', margin: 0 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '10px 16px',
          background: loading ? 'var(--c-border)' : 'var(--c-accent-orange)',
          color: loading ? 'var(--c-text-muted)' : '#17130E',
          border: 'none',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 700,
          boxShadow: loading ? 'none' : '3px 3px 0 #4A3828',
          transition: 'all 100ms ease',
        }}
      >
        {loading ? 'Please wait…' : 'Update Password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--c-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          padding: 32,
          border: '2px solid var(--c-border)',
          boxShadow: '5px 5px 0 var(--c-accent-orange)',
          background: 'var(--c-surface)',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--c-accent-orange)',
              fontWeight: 700,
            }}
          >
            Bubble
          </span>{' '}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--c-text)',
              fontWeight: 700,
            }}
          >
            Retirement
          </span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--c-text)',
            marginBottom: 8,
          }}
        >
          New Password
        </h1>

        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
