'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { acceptInviteAction } from './actions'

interface AcceptInviteFormProps {
  token: string
}

export default function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const [feedback, setFeedback] = useState<{ error?: string; success?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptInviteAction(token)
      setFeedback(result)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button
        onClick={handleAccept}
        disabled={isPending}
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          border: '1px solid #22c55e',
          background: '#0f172a',
          color: '#22c55e',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontWeight: 600,
        }}
      >
        {isPending ? 'Joining…' : 'Accept invite'}
      </button>
      {feedback?.error && <p style={{ margin: 0, color: '#f87171' }}>{feedback.error}</p>}
      {feedback?.success && (
        <p style={{ margin: 0, color: '#22c55e' }}>
          {feedback.success}{' '}
          <Link href="/dashboard" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
            Open dashboard
          </Link>
        </p>
      )}
    </div>
  )
}
