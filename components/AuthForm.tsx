'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Registration failed')
          setLoading(false)
          return
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
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

        {/* Mode toggle */}
        <div style={{ display: 'flex', marginBottom: 24 }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError('') }}
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
            <label
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--c-text-muted)',
              }}
            >
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--c-text-muted)',
              }}
            >
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'At least 8 characters' : ''}
              required
            />
          </div>

          {error && (
            <p
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--c-accent-orange)',
                margin: 0,
              }}
            >
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
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
