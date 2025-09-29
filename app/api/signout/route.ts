import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await supabaseServer()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
