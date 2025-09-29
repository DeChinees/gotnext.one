import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={{ fontSize: 40, margin: 0 }}>Run your pickup crew without the noise.</h1>
        <p style={{ color: '#94a3b8', fontSize: 18, margin: 0 }}>
          GotNext keeps your private runs invite-only, handles RSVPs with caps and waitlists, and notifies hoopers over
          email or WhatsApp. No ads, no randos—just your squad.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link
            href="/signup"
            style={{
              padding: '12px 20px',
              borderRadius: 999,
              background: '#22c55e',
              color: '#0b1120',
              fontWeight: 600,
            }}
          >
            Create an account
          </Link>
          <Link
            href="/sessions"
            style={{
              padding: '12px 20px',
              borderRadius: 999,
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              fontWeight: 600,
            }}
          >
            View sessions
          </Link>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <FeatureCard
          title="Manage teams"
          description="Create teams, promote admins, and keep ownership with your core organisers. Players can only join with a private invite."
        />
        <FeatureCard
          title="Bulletproof RSVPs"
          description="Set capacity limits, enforce RSVP deadlines, and auto-promote waitlisted hoopers when someone drops."
        />
        <FeatureCard
          title="Invite-only onboarding"
          description="Send invites by email or phone. Recipients sign in or sign up, then get dropped directly into the roster."
        />
        <FeatureCard
          title="Player control"
          description="Every hooper keeps their profile current—name, email, phone with country code, and password—all editable anytime."
        />
      </section>
    </main>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <article
      style={{
        padding: 20,
        borderRadius: 16,
        border: '1px solid #1f2937',
        background: '#0b1120',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
      <p style={{ margin: 0, color: '#94a3b8' }}>{description}</p>
    </article>
  )
}
