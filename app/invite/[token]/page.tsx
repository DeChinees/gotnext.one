import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import AcceptInviteForm from './AcceptInviteForm'

const inviteTimestampFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

function formatInviteExpiration(value: string) {
  return inviteTimestampFormatter.format(new Date(value))
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: inviteRows, error } = await supabase.rpc('get_team_invite', {
    invite_token: token,
  })

  if (error) {
    console.error(error)
  }

  const invite = Array.isArray(inviteRows) ? inviteRows[0] : inviteRows

  if (!invite) {
    return (
      <main>
        <div style={{ maxWidth: 520 }}>
          <h1>Invite not found</h1>
          <p style={{ marginTop: 12, color: '#94a3b8' }}>
            This invite link is invalid or has been revoked. Please contact the organiser for a new invite.
          </p>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
            Go back home
          </Link>
        </div>
      </main>
    )
  }

  const isExpired = invite.expires_at ? new Date(invite.expires_at).getTime() < Date.now() : false
  const alreadyAccepted = Boolean(invite.accepted_at)
  const inviteDescription = invite.email
    ? `You were invited as a ${invite.role} for this team. Only invited players can join.`
    : `Anyone with this link can join ${invite.team_name} as a ${invite.role}. Share it carefully.`

  return (
    <main>
      <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <header>
          <h1 style={{ marginBottom: 4 }}>Join {invite.team_name}</h1>
          <p style={{ margin: 0, color: '#94a3b8' }}>{inviteDescription}</p>
        </header>

        <section style={{ padding: 16, borderRadius: 12, border: '1px solid #1f2937', background: '#0b1120' }}>
          <dl style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: 8 }}>
            <dt style={{ color: '#64748b' }}>Team</dt>
            <dd style={{ margin: 0 }}>{invite.team_name}</dd>
            <dt style={{ color: '#64748b' }}>{invite.email ? 'Invite email' : 'Link type'}</dt>
            <dd style={{ margin: 0 }}>{invite.email ?? 'Shareable link'}</dd>
            <dt style={{ color: '#64748b' }}>Expires</dt>
            <dd style={{ margin: 0 }} suppressHydrationWarning>
              {formatInviteExpiration(invite.expires_at)}
            </dd>
          </dl>
        </section>

        {isExpired && (
          <p style={{ color: '#f87171' }}>This invite has expired. Ask the organiser for a new one.</p>
        )}
        {alreadyAccepted && (
          <p style={{ color: '#22c55e' }}>Invite already accepted. You can view the team on your dashboard.</p>
        )}

        {!user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: '#94a3b8' }}>
              Sign in or create an account to join this team. We will add you automatically once you accept the invite.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link
                href={`/signin?next=${encodeURIComponent(`/invite/${token}`)}`}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #38bdf8', color: '#38bdf8' }}
              >
                Sign in
              </Link>
              <Link
                href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #22c55e', color: '#22c55e' }}
              >
                Sign up
              </Link>
            </div>
          </div>
        ) : isExpired || alreadyAccepted ? (
          <Link href="/sessions" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
            View sessions
          </Link>
        ) : (
          <AcceptInviteForm token={token} />
        )}
      </div>
    </main>
  )
}
