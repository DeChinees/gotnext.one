import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <h1>GotNext Auth Demo</h1>
        <p style={{ marginTop: 12 }}>
          This minimal project focuses on Supabase magic-link sign in.
        </p>
        <p style={{ marginTop: 20 }}>
          <Link href="/signin" style={{ textDecoration: 'underline' }}>
            Go to sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
