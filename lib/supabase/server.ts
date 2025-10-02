import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

let warnedAboutReadOnlyCookies = false

export async function supabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value }))
        },
        async setAll(cookies) {
          try {
            cookies.forEach((cookie) => {
              cookieStore.set(cookie)
            })
          } catch (error) {
            if (process.env.NODE_ENV !== 'production' && !warnedAboutReadOnlyCookies) {
              warnedAboutReadOnlyCookies = true
              console.warn('[supabaseServer] Unable to persist Supabase auth cookies in this render context. This can happen in React Server Components; the middleware or route handlers must handle writes.', error)
            }
          }
        },
      },
    }
  )
}
