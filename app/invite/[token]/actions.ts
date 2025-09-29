'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'

export interface InviteActionResult {
  error?: string
  success?: string
}

export async function acceptInviteAction(token: string): Promise<InviteActionResult> {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error(error)
  }

  if (!user) {
    return { error: 'Please sign in before accepting the invite.' }
  }

  const { error: acceptError } = await supabase.rpc('accept_team_invite', {
    invite_token: token,
  })

  if (acceptError) {
    console.error(acceptError)
    return { error: acceptError.message }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/invite/${token}`)
  return { success: 'Invite accepted. You can now see the team on your dashboard.' }
}
