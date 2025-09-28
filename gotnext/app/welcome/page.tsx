import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

export default async function WelcomePage() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  return (
    <main>
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ textAlign: 'center' }}>Welcome!</h1>
        <p style={{ marginTop: 12, textAlign: 'center' }}>
          Signed in as <strong>{user.email}</strong>.
        </p>

        <section style={{ marginTop: 24, padding: 16, border: '1px solid #333', borderRadius: 12, background: '#0f172a' }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Profile details</h2>
          <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 8 }}>
            <dt style={{ color: '#94a3b8' }}>User ID</dt>
            <dd style={{ margin: 0, fontFamily: 'monospace' }}>{user.id}</dd>
            <dt style={{ color: '#94a3b8' }}>Email</dt>
            <dd style={{ margin: 0 }}>{user.email}</dd>
            <dt style={{ color: '#94a3b8' }}>Created</dt>
            <dd style={{ margin: 0 }}>{new Date(user.created_at).toLocaleString()}</dd>
            <dt style={{ color: '#94a3b8' }}>Last sign-in</dt>
            <dd style={{ margin: 0 }}>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—'}</dd>
          </dl>
        </section>

        <SignOutButton />
      </div>
    </main>
  )
}
