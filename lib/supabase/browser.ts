import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export const supabaseBrowser = () => {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
      throw new Error('Missing Supabase browser env vars.')
    }

    client = createBrowserClient(url, anonKey)
  }

  return client
}
