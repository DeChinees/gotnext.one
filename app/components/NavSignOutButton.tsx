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
    <div className="site-nav__signout-wrap">
      <button
        onClick={handleSignOut}
        disabled={isPending}
        className="site-nav__link site-nav__link--pill site-nav__link--danger"
      >
        {isPending ? 'Signing out…' : 'Sign out'}
      </button>
      {error && <span className="site-nav__signout-error">{error}</span>}
    </div>
  )
}
