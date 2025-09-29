'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignOutButton() {
  const router = useRouter()
  const [isSigningOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignOut() {
    setSigningOut(true)
    setError(null)
    try {
      const res = await fetch('/api/signout', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Failed to sign out.' }))
        setError(body.error ?? 'Failed to sign out.')
        setSigningOut(false)
        return
      }

      router.replace('/signin')
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unexpected sign-out error.')
      setSigningOut(false)
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        style={{
          padding: '10px 16px',
          borderRadius: 8,
          border: '1px solid #333',
          background: isSigningOut ? '#222' : '#ef4444',
          color: '#fff',
          cursor: isSigningOut ? 'not-allowed' : 'pointer',
        }}
      >
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </button>
      {error && <p style={{ marginTop: 8, color: '#fca5a5' }}>{error}</p>}
    </div>
  )
}
