'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabaseBrowser } from '@/lib/supabase/browser'

interface ProfileFormProps {
  user: User
  profile: { full_name: string; phone: string } | null
}

export default function ProfileForm({ user, profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [email, setEmail] = useState(user.email ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!fullName.trim()) {
      setError('Please enter your name.')
      return
    }

    if (!phone.trim().startsWith('+')) {
      setError('Phone numbers must include the international code, e.g. +31 or +32.')
      return
    }

    try {
      setSubmitting(true)
      const supabase = supabaseBrowser()

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
      })

      if (profileError) {
        setError(profileError.message)
        return
      }

      const authUpdates: { email?: string; password?: string } = {}
      if (email.trim() && email.trim() !== (user.email ?? '')) {
        authUpdates.email = email.trim()
      }

      if (newPassword.trim()) {
        authUpdates.password = newPassword.trim()
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates)
        if (authError) {
          setError(authError.message)
          return
        }
      }

      setSuccess('Profile updated.')
      setNewPassword('')
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unable to update profile right now. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ color: '#94a3b8' }}>Full name</span>
        <input
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ color: '#94a3b8' }}>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ color: '#94a3b8' }}>Phone (+country code)</span>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
          style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ color: '#94a3b8' }}>New password</span>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="Leave blank to keep current password"
          minLength={6}
          style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
        />
      </label>
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
        {isSubmitting ? 'Saving…' : 'Save changes'}
      </button>
      {error && <p style={{ marginTop: 4, color: '#f87171' }}>{error}</p>}
      {success && <p style={{ marginTop: 4, color: '#22c55e' }}>{success}</p>}
    </form>
  )
}
