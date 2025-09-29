import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import ProfileForm from './ProfileForm'
import SignOutButton from '../welcome/SignOutButton'

export default async function ProfilePage() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin?next=/profile')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <main>
      <div style={{ maxWidth: 520, width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <header>
          <h1>Profile</h1>
          <p style={{ marginTop: 8, color: '#94a3b8' }}>
            Keep your contact details up to date so team organisers can reach you.
          </p>
        </header>
        <ProfileForm user={user} profile={profile} />
        <div>
          <SignOutButton />
        </div>
      </div>
    </main>
  )
}
