import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { supabaseServer } from '@/lib/supabase/server'
import NavSignOutButton from './components/NavSignOutButton'

export const metadata: Metadata = {
  title: 'GotNext — Invite-only pickup manager',
  description: 'Organise private teams, schedule sessions, and keep RSVPs tight without ads.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let canAccessDashboard = false

  if (user) {
    const { data: adminMemberships, error: adminCheckError } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .limit(1)

    if (adminCheckError) {
      console.error(adminCheckError)
    }

    canAccessDashboard = (adminMemberships?.length ?? 0) > 0
  }

  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', background: '#030712', color: '#f8fafc' }}>
          <nav
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: '1px solid #1f2937',
              background: '#020617',
            }}
          >
            <Link href="/" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.02em' }}>
              GotNext
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {user ? (
                <>
                  {canAccessDashboard && (
                    <Link href="/dashboard" style={{ color: '#e2e8f0', fontSize: 14 }}>
                      Dashboard
                    </Link>
                  )}
                  <Link href="/sessions" style={{ color: '#e2e8f0', fontSize: 14 }}>
                    Sessions
                  </Link>
                  <Link href="/profile" style={{ color: '#e2e8f0', fontSize: 14 }}>
                    Profile
                  </Link>
                  <NavSignOutButton />
                </>
              ) : (
                <>
                  <Link href="/signin" style={{ color: '#38bdf8', fontSize: 14 }}>
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    style={{
                      padding: '8px 14px',
                      borderRadius: 20,
                      border: '1px solid #22c55e',
                      color: '#22c55e',
                      fontSize: 14,
                    }}
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </nav>
          {children}
        </div>
      </body>
    </html>
  )
}
