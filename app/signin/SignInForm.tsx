'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'

interface SignInFormProps {
  heading?: string
  description?: string
  className?: string
}

export default function SignInForm({
  heading = 'Sign in',
  description = 'Use your email and password to access GotNext.',
  className,
}: SignInFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const hasNext = searchParams.has('next')
  const rawNext = hasNext ? searchParams.get('next') : null
  const nextPath = rawNext && rawNext.startsWith('/') ? rawNext : '/sessions'

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

  const containerClass = ['auth-card', className].filter(Boolean).join(' ')

  return (
    <div className={containerClass}>
      <h1>{heading}</h1>
      {description && <p style={{ color: '#94a3b8' }}>{description}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ background: isSubmitting ? '#1e293b' : '#0ea5e9' }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
      <p className="auth-card__meta">
        Need an account?{' '}
        <Link
          href={hasNext && rawNext ? `/signup?next=${encodeURIComponent(nextPath)}` : '/signup'}
          style={{ textDecoration: 'underline' }}
        >
          Sign up here
        </Link>
      </p>
    </div>
  )
}
