import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Offline — GotNext',
  description: "You're offline. We'll reconnect you to GotNext as soon as the network is back.",
}

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <h1>Offline mode</h1>
      <p>
        You&apos;re currently offline. Any changes will sync once your connection is restored.
      </p>
      <Link href="/" className="offline-page__retry site-nav__link site-nav__link--pill">
        Retry connection
      </Link>
    </main>
  )
}
