import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import TeamsDashboard from './TeamsDashboard'

export type TeamRole = 'owner' | 'admin' | 'player'

export interface TeamMemberSummary {
  teamId: string
  userId: string
  role: TeamRole
  fullName: string | null
  phone: string | null
}

export interface TeamInviteSummary {
  id: string
  teamId: string
  email: string | null
  phone: string | null
  role: TeamRole
  token: string
  expiresAt: string
  invitedBy: string
  createdAt: string
}

export interface GameSignupSummary {
  sessionId: string
  userId: string
  status: 'active' | 'reserve'
  fullName: string | null
  phone: string | null
  createdAt: string
}

export interface GameSessionSummary {
  id: string
  teamId: string
  title: string
  location: string | null
  notes: string | null
  startsAt: string
  endsAt: string
  maxPlayers: number
  activeSignups: GameSignupSummary[]
  reserveSignups: GameSignupSummary[]
}

export interface TeamSummary {
  id: string
  name: string
  ownerId: string
  viewerRole: TeamRole
  members: TeamMemberSummary[]
  invites: TeamInviteSummary[]
  sessions: GameSessionSummary[]
}

type MembershipRow = {
  team_id: string
  role: TeamRole
  teams: { id: string; name: string; owner_id: string; created_at: string } | null
}

type MemberRow = {
  team_id: string
  user_id: string
  role: TeamRole
  profiles: { full_name: string | null; phone: string | null } | null
}

type InviteRow = {
  id: string
  team_id: string
  email: string | null
  phone: string | null
  role: TeamRole
  token: string
  invited_by: string
  expires_at: string
  created_at: string
  accepted_at: string | null
}

type GameSessionRow = {
  id: string
  team_id: string
  title: string
  location: string | null
  description: string | null
  starts_at: string
  ends_at: string
  max_players: number
}

type GameSignupRow = {
  session_id: string
  user_id: string
  status: 'active' | 'reserve'
  created_at: string
  promoted_at: string | null
  profiles: { full_name: string | null; phone: string | null } | null
}

export default async function DashboardPage() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin?next=/dashboard')
  }

  const { data: membershipRowsRaw, error: membershipError } = await supabase
    .from('team_members')
    .select('team_id, role, teams(id, name, owner_id, created_at)')
    .eq('user_id', user.id)

  if (membershipError) {
    console.error(membershipError)
  }

  const membershipRows = (membershipRowsRaw ?? []) as unknown as MembershipRow[]

  const teamSummaries = new Map<string, TeamSummary>()

  for (const row of membershipRows) {
    if (!row.teams) continue
    teamSummaries.set(row.teams.id, {
      id: row.teams.id,
      name: row.teams.name,
      ownerId: row.teams.owner_id,
      viewerRole: row.role,
      members: [],
      invites: [],
      sessions: [],
    })
  }

  const teamIds = Array.from(teamSummaries.keys())

  if (teamIds.length > 0) {
    const { data: memberRowsRaw, error: membersError } = await supabase
      .from('team_members')
      .select('team_id, user_id, role, profiles(full_name, phone)')
      .in('team_id', teamIds)

    if (membersError) {
      console.error(membersError)
    }

    const memberRows = (memberRowsRaw ?? []) as unknown as MemberRow[]

    for (const row of memberRows) {
      const team = teamSummaries.get(row.team_id)
      if (!team) continue

      team.members.push({
        teamId: row.team_id,
        userId: row.user_id,
        role: row.role,
        fullName: row.profiles?.full_name ?? null,
        phone: row.profiles?.phone ?? null,
      })
    }

    const roleOrder: Record<TeamRole, number> = {
      owner: 0,
      admin: 1,
      player: 2,
    }

    for (const team of Array.from(teamSummaries.values())) {
      team.members.sort((a, b) => {
        const roleCompare = roleOrder[a.role] - roleOrder[b.role]
        if (roleCompare !== 0) return roleCompare
        return (a.fullName ?? '').localeCompare(b.fullName ?? '')
      })
    }

    const { data: inviteRowsRaw, error: invitesError } = await supabase
      .from('team_invites')
      .select('id, team_id, email, phone, role, token, invited_by, expires_at, created_at, accepted_at')
      .in('team_id', teamIds)
      .order('created_at', { ascending: false })

    if (invitesError) {
      console.error(invitesError)
    }

    const inviteRows = (inviteRowsRaw ?? []) as unknown as InviteRow[]

    for (const row of inviteRows) {
      if (row.accepted_at) continue
      const team = teamSummaries.get(row.team_id)
      if (!team) continue

      team.invites.push({
        id: row.id,
        teamId: row.team_id,
        email: row.email,
        phone: row.phone,
        role: row.role,
        token: row.token,
        invitedBy: row.invited_by,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      })
    }

    for (const team of Array.from(teamSummaries.values())) {
      team.invites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    const { data: sessionRowsRaw, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('id, team_id, title, location, description, starts_at, ends_at, max_players')
      .in('team_id', teamIds)
      .order('starts_at', { ascending: true })

    if (sessionsError) {
      console.error(sessionsError)
    }

    const sessionRows = (sessionRowsRaw ?? []) as GameSessionRow[]
    const sessionMap = new Map<string, GameSessionSummary>()
    const sessionIds: string[] = []

    for (const row of sessionRows) {
      const team = teamSummaries.get(row.team_id)
      if (!team) continue

      const sessionSummary: GameSessionSummary = {
        id: row.id,
        teamId: row.team_id,
        title: row.title,
        location: row.location,
        notes: row.description,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        maxPlayers: row.max_players,
        activeSignups: [],
        reserveSignups: [],
      }

      team.sessions.push(sessionSummary)
      sessionMap.set(row.id, sessionSummary)
      sessionIds.push(row.id)
    }

    if (sessionIds.length > 0) {
      const { data: signupRowsRaw, error: signupsError } = await supabase
        .from('game_signups')
        .select('session_id, user_id, status, created_at, promoted_at, profiles(full_name, phone)')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true })

      if (signupsError) {
        console.error(signupsError)
      }

      const signupRows = (signupRowsRaw ?? []) as unknown as GameSignupRow[]

      for (const row of signupRows) {
        const session = sessionMap.get(row.session_id)
        if (!session) continue

        const signup: GameSignupSummary = {
          sessionId: row.session_id,
          userId: row.user_id,
          status: row.status,
          fullName: row.profiles?.full_name ?? null,
          phone: row.profiles?.phone ?? null,
          createdAt: row.created_at,
        }

        if (row.status === 'active') {
          session.activeSignups.push(signup)
        } else {
          session.reserveSignups.push(signup)
        }
      }
    }

    for (const session of Array.from(sessionMap.values())) {
      session.activeSignups.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      session.reserveSignups.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }

    for (const team of Array.from(teamSummaries.values())) {
      team.sessions.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    }
  }

  return (
    <main>
      <TeamsDashboard
        userId={user.id}
        viewerEmail={user.email ?? ''}
        teams={Array.from(teamSummaries.values())}
      />
    </main>
  )
}
