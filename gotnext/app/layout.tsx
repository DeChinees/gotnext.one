import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GotNext Auth Demo',
  description: 'Magic link sign-in flow powered by Supabase',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
