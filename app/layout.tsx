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
        <nav className="site-nav">
          <div className="site-nav__inner">
            <Link href="/" className="site-nav__brand">
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
            <div className={`site-nav__links${user ? ' site-nav__links--auth' : ''}`}>
              {user ? (
                <>
                  {canAccessDashboard && (
                    <Link href="/dashboard" className="site-nav__link site-nav__link--pill">
                      Dashboard
                    </Link>
                  )}
                  <Link href="/sessions" className="site-nav__link site-nav__link--pill">
                    Sessions
                  </Link>
                  <Link href="/profile" className="site-nav__link site-nav__link--pill">
                    Profile
                  </Link>
                  <NavSignOutButton />
                </>
              ) : (
                <>
                  <Link
                    href="/signin"
                    className="site-nav__link site-nav__link--accent site-nav__link--pill"
                  >
                    Sign in
                  </Link>
                  <Link href="/signup" className="site-nav__cta site-nav__link--pill">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
