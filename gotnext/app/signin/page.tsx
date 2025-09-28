'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const incomingError = searchParams.get('error')
    if (incomingError) {
      setError(incomingError === 'missing_code' ? 'Auth code missing from callback URL.' : incomingError)
    }
  }, [searchParams])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL
    if (!baseUrl) {
      setError('Missing NEXT_PUBLIC_APP_URL (or NEXT_PUBLIC_SITE_URL) environment variable.')
      return
    }

    try {
      setSubmitting(true)
      const supabase = supabaseBrowser()
      await supabase.auth.signOut().catch(() => {})
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${baseUrl}/auth/callback`,
        },
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      setMessage(`Magic link sent to ${email}. Check your inbox and open the link in this browser.`)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unknown error sending magic link.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <h1>Sign in</h1>
        <p style={{ marginTop: 8, color: '#888' }}>Enter your email to receive a magic link.</p>
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
            {isSubmitting ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
        {message && <p style={{ marginTop: 16, color: '#22c55e' }}>{message}</p>}
        {error && <p style={{ marginTop: 16, color: '#f87171' }}>{error}</p>}
      </div>
    </main>
  )
}
