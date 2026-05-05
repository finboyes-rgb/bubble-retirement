'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'

const labelStyle = {
  fontSize: 10,
  fontFamily: 'var(--font-mono)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'var(--c-text-muted)',
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
          Reset Password
        </h1>

        {submitted ? (
          <p
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--c-accent-yellow)',
              lineHeight: 1.6,
            }}
          >
            If that email is registered, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
              {loading ? 'Please wait…' : 'Send Reset Link'}
            </button>

            <a
              href="/login"
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--c-text-muted)',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              Back to sign in
            </a>
          </form>
        )}
      </div>
    </div>
  )
}
