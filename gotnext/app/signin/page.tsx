'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const hasNext = searchParams.has('next')
  const rawNext = hasNext ? searchParams.get('next') : null
  const nextPath = rawNext && rawNext.startsWith('/') ? rawNext : '/dashboard'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      setSubmitting(true)
      const supabase = supabaseBrowser()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setError(signInError.message)
        return
      }

      router.replace(nextPath as Route)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <h1>Sign in</h1>
        <p style={{ marginTop: 8, color: '#888' }}>Use your email and password to access GotNext.</p>
        <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #333',
              background: isSubmitting ? '#222' : '#0ea5e9',
              color: '#fff',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {error && <p style={{ marginTop: 16, color: '#f87171' }}>{error}</p>}
        <p style={{ marginTop: 20, color: '#888' }}>
          Need an account?{' '}
          <Link
            href={hasNext && rawNext ? `/signup?next=${encodeURIComponent(nextPath)}` : '/signup'}
            style={{ textDecoration: 'underline' }}
          >
            Sign up here
          </Link>
        </p>
      </div>
    </main>
  )
}
