'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const hasNext = searchParams.has('next')
  const rawNext = hasNext ? searchParams.get('next') : null
  const nextPath = rawNext && rawNext.startsWith('/') ? rawNext : '/dashboard'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setInfo(null)

    if (!phone.startsWith('+')) {
      setError('Phone numbers must include the international code, e.g. +31 or +32.')
      return
    }

    try {
      setSubmitting(true)
      const supabase = supabaseBrowser()

      const {
        data: { user, session },
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (!user) {
        setInfo('Check your inbox to confirm the sign-up, then return to GotNext to continue.')
        return
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: fullName, phone })

      if (profileError) {
        setError(profileError.message)
        return
      }

      if (session) {
        router.replace(nextPath as Route)
        router.refresh()
        return
      }

      setInfo('Account created. Please verify your email and sign in to continue.')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unable to sign up right now. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <h1>Create your GotNext account</h1>
        <p style={{ marginTop: 8, color: '#888' }}>Fill in your details to manage or join teams.</p>
        <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
          />
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
            type="tel"
            required
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+31 612345678"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
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
              background: isSubmitting ? '#222' : '#22c55e',
              color: '#fff',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        {error && <p style={{ marginTop: 16, color: '#f87171' }}>{error}</p>}
        {info && <p style={{ marginTop: 16, color: '#22c55e' }}>{info}</p>}
        <p style={{ marginTop: 20, color: '#888' }}>
          Already have an account?{' '}
          <Link
            href={hasNext && rawNext ? `/signin?next=${encodeURIComponent(nextPath)}` : '/signin'}
            style={{ textDecoration: 'underline' }}
          >
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  )
}
