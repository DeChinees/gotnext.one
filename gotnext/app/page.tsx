import { pickRandomIntro, pickRandomTagline } from '@/lib/taglines'
import SignInForm from './signin/SignInForm'

export default function Home() {
  const tagline = pickRandomTagline()
  const intro = pickRandomIntro()

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        padding: '24px 24px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 48,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: 48,
          width: '100%',
          maxWidth: 1100,
        }}
      >
        <section
          style={{
            flex: '1 1 320px',
            maxWidth: 480,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            textAlign: 'left',
            justifyContent: 'flex-start',
            paddingTop: 50,
          }}
        >
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 18, lineHeight: 1.6 }}>{intro}</p>
        </section>

        <section
          style={{
            flex: '1 1 320px',
            maxWidth: 400,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: 12,
          }}
        >
          <SignInForm heading="Sign in to lock your run" description="Drop your details to claim your spot." />
        </section>
      </div>

      <div style={{ textAlign: 'center', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h1 style={{ margin: 0, fontSize: 48, lineHeight: 1.15 }}>{tagline}</h1>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', paddingTop: 24 }}>
          <PlaceholderCard label="iOS app" sublabel="Coming soon · Add us to your home screen" />
          <PlaceholderCard label="Android app" sublabel="Coming soon · Install as a PWA" />
        </div>
      </div>
    </main>
  )
}

function PlaceholderCard({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div
      style={{
        minWidth: 220,
        padding: '14px 18px',
        borderRadius: 16,
        border: '1px dashed #1f2937',
        background: '#0b1120',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 16 }}>{label}</span>
      <span style={{ color: '#64748b', fontSize: 14 }}>{sublabel}</span>
    </div>
  )
}
