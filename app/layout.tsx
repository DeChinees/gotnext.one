import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import './globals.css'
import { supabaseServer } from '@/lib/supabase/server'
import NavSignOutButton from './components/NavSignOutButton'

export const metadata: Metadata = {
  title: 'GotNext — Invite-only pickup manager',
  description: 'Organise private teams, schedule sessions, and keep RSVPs tight without ads.',
  icons: {
    icon: [
      { url: '/gotnext.icon.png' },
      { url: '/gotnext.icon.png', rel: 'shortcut icon' },
      { url: '/gotnext.icon.bw.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: [
      { url: '/gotnext.icon.png' },
      { url: '/gotnext.icon.bw.png', media: '(prefers-color-scheme: dark)' },
    ],
  },
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
              padding: '10px 20px',
              borderBottom: '1px solid #1f2937',
              background: '#020617',
            }}
          >
            <Link
              href="/"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
            >
              <picture>
                <source srcSet="/gotnext.logo.black.png" media="(prefers-color-scheme: light)" />
                <Image
                  src="/gotnext.logo.white.png"
                  alt="GotNext"
                  width={110}
                  height={28}
                  priority
                  style={{ display: 'block', height: 'auto', width: 'auto' }}
                />
              </picture>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
