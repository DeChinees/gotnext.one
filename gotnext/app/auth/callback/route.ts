import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    url.pathname = '/signin'
    url.searchParams.set('error', 'missing_code')
    return NextResponse.redirect(url)
  }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    url.pathname = '/signin'
    url.searchParams.set('error', error.message)
    return NextResponse.redirect(url)
  }

  url.pathname = '/welcome'
  url.searchParams.delete('error')
  return NextResponse.redirect(url)
}
