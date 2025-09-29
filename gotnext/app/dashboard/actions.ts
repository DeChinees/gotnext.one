'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'
import type { TeamRole } from './page'

export interface ActionResult {
  error?: string
  success?: string
}

async function ensureUser() {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error(error)
  }

  return { supabase, user }
}

export async function createTeamAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = (formData.get('name') as string | null)?.trim() ?? ''

  if (!name) {
    return { error: 'Team name is required.' }
  }

  const { supabase, user } = await ensureUser()
  if (!user) {
    return { error: 'You must be signed in to create a team.' }
  }

  const { error } = await supabase.from('teams').insert({ name, owner_id: user.id })

  if (error) {
    console.error(error)
    if (error.code === '23505') {
      return { error: `You already have a team named "${name}".` }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: 'Team created.' }
}

export async function updateMemberRoleAction(teamId: string, userId: string, role: TeamRole): Promise<ActionResult> {
  if (!['owner', 'admin', 'player'].includes(role)) {
    return { error: 'Invalid role selection.' }
  }

  const { supabase, user } = await ensureUser()
  if (!user) {
    return { error: 'You must be signed in to manage members.' }
  }

  const { data: targetMember, error: fetchError } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    console.error(fetchError)
    return { error: fetchError.message }
  }

  if (!targetMember) {
    return { error: 'Member not found.' }
  }

  if (targetMember.role === 'owner' && role !== 'owner') {
    const { count } = await supabase
      .from('team_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('role', 'owner')

    if ((count ?? 0) <= 1) {
      return { error: 'Each team must keep at least one owner.' }
    }
  }

  const { error } = await supabase
    .from('team_members')
    .update({ role })
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: 'Role updated.' }
}

export async function removeMemberAction(teamId: string, userId: string): Promise<ActionResult> {
  const { supabase, user } = await ensureUser()
  if (!user) {
    return { error: 'You must be signed in to manage members.' }
  }

  const { data: targetMember, error: fetchError } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    console.error(fetchError)
    return { error: fetchError.message }
  }

  if (!targetMember) {
    return { error: 'Member not found.' }
  }

  if (targetMember.role === 'owner') {
    const { count } = await supabase
      .from('team_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('role', 'owner')

    if ((count ?? 0) <= 1) {
      return { error: 'Promote another member to owner before removing this teammate.' }
    }
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: 'Member removed.' }
}

export async function createInviteAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const teamId = (formData.get('teamId') as string | null) ?? ''
  const email = ((formData.get('email') as string | null) ?? '').trim()
  const phone = ((formData.get('phone') as string | null) ?? '').trim()
  const role = (formData.get('role') as TeamRole | null) ?? 'player'

  if (!teamId) {
    return { error: 'Missing team id.' }
  }

  if (!email) {
    return { error: 'Email is required for invites.' }
  }

  if (phone && !phone.startsWith('+')) {
    return { error: 'Phone numbers must include the international code, e.g. +31.' }
  }

  const { supabase, user } = await ensureUser()
  if (!user) {
    return { error: 'You must be signed in to invite players.' }
  }

  const { error } = await supabase.from('team_invites').insert({
    team_id: teamId,
    email,
    phone: phone || null,
    role,
    invited_by: user.id,
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: 'Invite sent.' }
}

export async function cancelInviteAction(inviteId: string): Promise<ActionResult> {
  const { supabase, user } = await ensureUser()
  if (!user) {
    return { error: 'You must be signed in to cancel invites.' }
  }

  const { error } = await supabase.from('team_invites').delete().eq('id', inviteId)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: 'Invite cancelled.' }
}

export async function createShareableInviteAction(teamId: string, role: TeamRole): Promise<ActionResult> {
  if (!teamId) {
    return { error: 'Missing team id.' }
  }

  if (!['owner', 'admin', 'player'].includes(role)) {
    return { error: 'Invalid role selection.' }
  }

  const { supabase, user } = await ensureUser()
  if (!user) {
    return { error: 'You must be signed in to invite players.' }
  }

  const { error } = await supabase.from('team_invites').insert({
    team_id: teamId,
    email: null,
    phone: null,
    role,
    invited_by: user.id,
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: 'Shareable invite link created.' }
}

export async function createSessionsAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const teamId = (formData.get('teamId') as string | null) ?? ''
  const title = ((formData.get('title') as string | null) ?? '').trim()
  const location = ((formData.get('location') as string | null) ?? '').trim()
  const notes = ((formData.get('notes') as string | null) ?? '').trim()
  const startsAtRaw = formData.get('startsAt') as string | null
  const endsAtRaw = formData.get('endsAt') as string | null
  const maxPlayers = Number(formData.get('maxPlayers'))
  const repeatMode = ((formData.get('repeatMode') as string | null) ?? 'none') as 'none' | 'weekly'
  let repeatCountRaw = Number(formData.get('repeatCount') ?? 1)

  if (!teamId) {
    return { error: 'Missing team id.' }
  }

  if (!title) {
    return { error: 'Title is required.' }
  }

  if (!startsAtRaw || !endsAtRaw) {
    return { error: 'Start and end times are required.' }
  }

  const startDate = new Date(startsAtRaw)
  const endDate = new Date(endsAtRaw)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: 'Invalid start or end date.' }
  }

  if (endDate <= startDate) {
    return { error: 'End time must be after start time.' }
  }

  if (!Number.isFinite(maxPlayers) || maxPlayers < 1) {
    return { error: 'Max players must be a positive number.' }
  }

  if (!Number.isFinite(repeatCountRaw) || repeatCountRaw < 1) {
    repeatCountRaw = 1
  }

  const repeatCount = Math.min(repeatMode === 'weekly' ? Math.round(repeatCountRaw) : 1, 12)
  const durationMs = endDate.getTime() - startDate.getTime()
  const intervalMs = repeatMode === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 0

  const { supabase, user } = await ensureUser()
  if (!user) {
    return { error: 'You must be signed in to schedule games.' }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError) {
    console.error(membershipError)
    return { error: membershipError.message }
  }

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Only team admins can schedule games.' }
  }

  const sessionsToInsert = Array.from({ length: repeatCount }, (_, index) => {
    const start = new Date(startDate.getTime() + intervalMs * index)
    const end = new Date(start.getTime() + durationMs)

    return {
      team_id: teamId,
      title,
      location: location ? location : null,
      description: notes ? notes : null,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      max_players: Math.round(maxPlayers),
      created_by: user.id,
    }
  })

  const { error } = await supabase.from('game_sessions').insert(sessionsToInsert)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  const createdCount = sessionsToInsert.length
  return { success: createdCount > 1 ? `${createdCount} games scheduled.` : 'Game scheduled.' }
}

export async function updateSignupStatusAction(
  sessionId: string,
  userId: string,
  targetStatus: 'active' | 'reserve'
): Promise<ActionResult> {
  if (!sessionId || !userId) {
    return { error: 'Missing session or user id.' }
  }

  const { supabase, user } = await ensureUser()
  if (!user) {
    return { error: 'You must be signed in to manage rosters.' }
  }

  const { data: sessionRow, error: sessionError } = await supabase
    .from('game_sessions')
    .select('team_id, max_players')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionError) {
    console.error(sessionError)
    return { error: sessionError.message }
  }

  if (!sessionRow) {
    return { error: 'Game session not found.' }
  }

  const { data: signupRow, error: signupError } = await supabase
    .from('game_signups')
    .select('status')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (signupError) {
    console.error(signupError)
    return { error: signupError.message }
  }

  if (!signupRow) {
    return { error: 'Signup not found.' }
  }

  if (signupRow.status === targetStatus) {
    return { success: 'Roster already up to date.' }
  }

  const nowIso = new Date().toISOString()

  if (targetStatus === 'active') {
    const { count: activeCount, error: countError } = await supabase
      .from('game_signups')
      .select('user_id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('status', 'active')

    if (countError) {
      console.error(countError)
      return { error: countError.message }
    }

    if ((activeCount ?? 0) >= sessionRow.max_players) {
      return { error: 'Active roster is full. Remove a player before promoting.' }
    }

    const { error: promoteError } = await supabase
      .from('game_signups')
      .update({ status: 'active', promoted_at: nowIso })
      .eq('session_id', sessionId)
      .eq('user_id', userId)

    if (promoteError) {
      console.error(promoteError)
      return { error: promoteError.message }
    }

    revalidatePath('/dashboard')
    return { success: 'Player moved to the active roster.' }
  }

  const { error: demoteError } = await supabase
    .from('game_signups')
    .update({ status: 'reserve' })
    .eq('session_id', sessionId)
    .eq('user_id', userId)

  if (demoteError) {
    console.error(demoteError)
    return { error: demoteError.message }
  }

  let promotionMessage: string | null = null

  const { count: activeCountAfter, error: recountError } = await supabase
    .from('game_signups')
    .select('user_id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('status', 'active')

  if (recountError) {
    console.error(recountError)
  } else if ((activeCountAfter ?? 0) < sessionRow.max_players) {
    const { data: nextReserve, error: nextReserveError } = await supabase
      .from('game_signups')
      .select('user_id')
      .eq('session_id', sessionId)
      .eq('status', 'reserve')
      .neq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextReserveError) {
      console.error(nextReserveError)
    } else if (nextReserve) {
      const { error: autoPromoteError } = await supabase
        .from('game_signups')
        .update({ status: 'active', promoted_at: nowIso })
        .eq('session_id', sessionId)
        .eq('user_id', nextReserve.user_id)

      if (autoPromoteError) {
        console.error(autoPromoteError)
      } else {
        promotionMessage = 'Promoted the next player from the reserve list.'
      }
    }
  }

  revalidatePath('/dashboard')
  const baseMessage = 'Player moved to reserve.'
  const successMessage = promotionMessage ? `${baseMessage} ${promotionMessage}` : baseMessage
  return { success: successMessage }
}
