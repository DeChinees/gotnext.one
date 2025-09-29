'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'

export interface SessionActionResult {
  error?: string
  success?: string
}

export async function joinGameSessionAction(
  _prev: SessionActionResult,
  formData: FormData
): Promise<SessionActionResult> {
  const sessionId = (formData.get('sessionId') as string | null) ?? ''

  if (!sessionId) {
    return { error: 'Missing session identifier.' }
  }

  const supabase = await supabaseServer()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error(userError)
  }

  if (!user) {
    return { error: 'You must be signed in to join a game.' }
  }

  const { error } = await supabase.rpc('join_game_session', {
    _session_id: sessionId,
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/sessions')
  revalidatePath('/dashboard')
  return { success: 'Saved your spot for this game.' }
}

export async function leaveGameSessionAction(
  _prev: SessionActionResult,
  formData: FormData
): Promise<SessionActionResult> {
  const sessionId = (formData.get('sessionId') as string | null) ?? ''

  if (!sessionId) {
    return { error: 'Missing session identifier.' }
  }

  const supabase = await supabaseServer()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error(userError)
  }

  if (!user) {
    return { error: 'You must be signed in to update your RSVP.' }
  }

  const { error } = await supabase.rpc('leave_game_session', {
    _session_id: sessionId,
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/sessions')
  revalidatePath('/dashboard')
  return { success: 'You have left this game.' }
}
