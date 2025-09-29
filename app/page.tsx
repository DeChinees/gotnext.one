import { pickRandomIntro, pickRandomTagline } from '@/lib/taglines'
import SignInForm from './signin/SignInForm'

export default function Home() {
  const intro = pickRandomIntro()
  const tagline = pickRandomTagline()

  return (
    <main className="landing">
      <section className="landing__panel landing__panel--intro">
        <p className="landing__intro">{intro}</p>
      </section>

      <section className="landing__panel landing__panel--signin">
        <SignInForm
          heading="Sign in to lock your run"
          description="Drop your details to claim your spot."
          className="landing__signin-card"
        />
      </section>

      <section className="landing__tagline">
        <h1 className="landing__tagline-text">{tagline}</h1>
        <div className="landing__cta">
          <PlaceholderCard label="iOS app" sublabel="Coming soon · Add us to your home screen" />
          <PlaceholderCard label="Android app" sublabel="Coming soon · Install as a PWA" />
        </div>
      </section>
    </main>
  )
}

function PlaceholderCard({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div className="landing__cta-card">
      <span className="landing__cta-card-title">{label}</span>
      <span className="landing__cta-card-copy">{sublabel}</span>
    </div>
  )
}
