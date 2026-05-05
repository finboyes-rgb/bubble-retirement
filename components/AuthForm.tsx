'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const labelStyle = {
  fontSize: 10,
  fontFamily: 'var(--font-mono)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'var(--c-text-muted)',
}

interface AuthFormProps {
  banner?: 'verified' | 'reset' | 'invalid-token'
}

export function AuthForm({ banner }: AuthFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'register') {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        let data: { error?: string; message?: string } = {}
        try { data = await res.json() } catch { /* non-JSON response */ }
        if (!res.ok) {
          setError(data.error ?? `Registration failed (${res.status})`)
          setLoading(false)
          return
        }
        setSuccess('Account created! Check your email to verify before signing in.')
        setLoading(false)
        return
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Check if the account exists but email isn't verified
        const statusRes = await fetch(`/api/auth/email-verified?email=${encodeURIComponent(email)}`)
        const { verified } = await statusRes.json()
        setError(
          verified === false
            ? 'Please verify your email before signing in. Check your inbox.'
            : 'Incorrect email or password.'
        )
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : null
      setError(msg ?? 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  function switchMode(m: 'login' | 'register') {
    setMode(m)
    setError('')
    setSuccess('')
    setConfirmPassword('')
  }

  const bannerText =
    banner === 'verified'
      ? 'Email verified — you can now sign in.'
      : banner === 'reset'
      ? 'Password updated — sign in with your new password.'
      : banner === 'invalid-token'
      ? 'That link is invalid or has already been used.'
      : null

  const bannerIsError = banner === 'invalid-token'

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
        {/* Logo */}
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

        {/* URL-driven banner */}
        {bannerText && (
          <div
            style={{
              marginBottom: 16,
              padding: '8px 12px',
              border: `2px solid ${bannerIsError ? 'var(--c-accent-orange)' : 'var(--c-accent-yellow)'}`,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: bannerIsError ? 'var(--c-accent-orange)' : 'var(--c-accent-yellow)',
            }}
          >
            {bannerText}
          </div>
        )}

        {/* Mode toggle */}
        <div style={{ display: 'flex', marginBottom: 24 }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                'flex-1 py-2 text-xs font-mono uppercase tracking-widest border-2 transition-colors cursor-pointer',
                mode === m
                  ? 'border-[var(--c-accent-orange)] text-[var(--c-accent-orange)] bg-[var(--c-bg)]'
                  : 'border-[var(--c-border)] text-[var(--c-text-muted)]',
                m === 'register' && 'border-l-0'
              )}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'At least 8 characters' : ''}
              required
            />
          </div>

          {mode === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retype your password"
                required
              />
            </div>
          )}

          {error && (
            <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--c-accent-orange)', margin: 0 }}>
              {error}
            </p>
          )}

          {success && (
            <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--c-accent-yellow)', margin: 0 }}>
              {success}
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
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {mode === 'login' && (
            <a
              href="/auth/forgot-password"
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
              Forgot password?
            </a>
          )}
        </form>
      </div>
    </div>
  )
}
