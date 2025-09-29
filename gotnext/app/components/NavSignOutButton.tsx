'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NavSignOutButton() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      setError(null)
      try {
        const res = await fetch('/api/signout', { method: 'POST' })
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Failed to sign out.' }))
          setError(body.error ?? 'Failed to sign out.')
          return
        }
        router.replace('/')
        router.refresh()
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Unexpected sign-out error.')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        onClick={handleSignOut}
        disabled={isPending}
        style={{
          padding: '6px 12px',
          borderRadius: 16,
          border: '1px solid #ef4444',
          background: '#111827',
          color: '#fca5a5',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontSize: 13,
        }}
      >
        {isPending ? 'Signing out…' : 'Sign out'}
      </button>
      {error && <span style={{ color: '#f87171', fontSize: 12 }}>{error}</span>}
    </div>
  )
}
