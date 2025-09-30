import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import SessionsDashboard from './SessionsDashboard'

export interface PlayerSummary {
  userId: string
  fullName: string | null
  phone?: string | null
}

export interface SessionView {
  id: string
  teamId: string
  teamName: string
  title: string
  location: string | null
  notes: string | null
  startsAt: string
  endsAt: string
  maxPlayers: number
  activeCount: number
  reserveCount: number
  userStatus: 'none' | 'active' | 'reserve'
  userActivePosition: number | null
  userReservePosition: number | null
  activePlayers: PlayerSummary[]
  reservePlayers: PlayerSummary[]
}

export interface TeamSessionsView {
  teamId: string
  teamName: string
  sessions: SessionView[]
}

interface GameSessionRow {
  id: string
  team_id: string
  title: string
  location: string | null
  description: string | null
  starts_at: string
  ends_at: string
  max_players: number
}

interface GameSignupRow {
  session_id: string
  user_id: string
  status: 'active' | 'reserve'
  created_at: string
  promoted_at: string | null
}

interface GameSignupSummary {
  sessionId: string
  userId: string
  status: 'active' | 'reserve'
  fullName: string | null
  phone: string | null
  createdAt: string
}

type MembershipRow = {
  team_id: string
  teams: { id: string; name: string } | null
}

export default async function SessionsPage() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin?next=/sessions')
  }

  const { data: membershipRows, error: membershipError } = await supabase
    .from('team_members')
    .select('team_id, teams(id, name)')
    .eq('user_id', user.id)

  if (membershipError) {
    console.error(membershipError)
  }

  const memberships = (membershipRows ?? []) as unknown as MembershipRow[]
  const teamMap = new Map<string, string>()
  for (const row of memberships) {
    if (row.teams) {
      teamMap.set(row.team_id, row.teams.name)
    }
  }

  const teamIds = Array.from(teamMap.keys())

  if (teamIds.length === 0) {
    return (
      <main className="sessions">
        <SessionsDashboard
          teams={[]}
          userHasTeams={false}
        />
      </main>
    )
  }

  const nowIso = new Date().toISOString()

  const { data: sessionRows, error: sessionsError } = await supabase
    .from('game_sessions')
    .select('id, team_id, title, location, description, starts_at, ends_at, max_players')
    .in('team_id', teamIds)
    .gte('ends_at', nowIso)
    .order('starts_at', { ascending: true })

  if (sessionsError) {
    console.error(sessionsError)
  }

  const sessions = (sessionRows ?? []) as GameSessionRow[]
  const sessionMap = new Map<string, SessionView>()
  const sessionsByTeam = new Map<string, SessionView[]>()
  const sessionIds: string[] = []

  for (const session of sessions) {
    const teamName = teamMap.get(session.team_id)
    if (!teamName) continue

    const sessionView: SessionView = {
      id: session.id,
      teamId: session.team_id,
      teamName,
      title: session.title,
      location: session.location,
      notes: session.description,
      startsAt: session.starts_at,
      endsAt: session.ends_at,
      maxPlayers: session.max_players,
      activeCount: 0,
      reserveCount: 0,
      userStatus: 'none',
      userActivePosition: null,
      userReservePosition: null,
      activePlayers: [],
      reservePlayers: [],
    }

    sessionMap.set(session.id, sessionView)
    sessionIds.push(session.id)
    const list = sessionsByTeam.get(session.team_id)
    if (list) {
      list.push(sessionView)
    } else {
      sessionsByTeam.set(session.team_id, [sessionView])
    }
  }

  let signupRows: GameSignupRow[] = []
  const profileIdSet = new Set<string>([...sessionIds.map(() => '' )])
  profileIdSet.clear()

  if (sessionIds.length > 0) {
    const { data: signupsData, error: signupsError } = await supabase
      .from('game_signups')
      .select('session_id, user_id, status, created_at, promoted_at')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true })

    if (signupsError) {
      console.error(signupsError)
    }

    signupRows = (signupsData ?? []) as unknown as GameSignupRow[]
    for (const row of signupRows) {
      profileIdSet.add(row.user_id)
    }
  }

  let profiles: { id: string; full_name: string | null; phone: string | null }[] = []
  if (profileIdSet.size > 0) {
    const { data: profileRows, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', Array.from(profileIdSet))

    if (profilesError) {
      console.error(profilesError)
    } else {
      profiles = profileRows ?? []
    }
  }

  const profileMap = new Map<string, { fullName: string | null; phone: string | null }>()
  for (const profile of profiles) {
    profileMap.set(profile.id, { fullName: profile.full_name, phone: profile.phone })
  }

  const activeBySession = new Map<string, GameSignupSummary[]>()
  const reserveBySession = new Map<string, GameSignupSummary[]>()

  const pushSignup = (target: Map<string, GameSignupSummary[]>, sessionId: string, signup: GameSignupSummary) => {
    const list = target.get(sessionId)
    if (list) {
      list.push(signup)
    } else {
      target.set(sessionId, [signup])
    }
  }

  for (const row of signupRows) {
    const session = sessionMap.get(row.session_id)
    if (!session) continue

    const profile = profileMap.get(row.user_id)
    const summary: GameSignupSummary = {
      sessionId: row.session_id,
      userId: row.user_id,
      status: row.status,
      fullName: profile?.fullName ?? null,
      phone: profile?.phone ?? null,
      createdAt: row.created_at,
    }

    if (row.status === 'active') {
      pushSignup(activeBySession, row.session_id, summary)
    } else {
      pushSignup(reserveBySession, row.session_id, summary)
    }
  }

  for (const session of Array.from(sessionMap.values())) {
    const active = activeBySession.get(session.id) ?? []
    const reserve = reserveBySession.get(session.id) ?? []

    active.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    reserve.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    session.activePlayers = active.map((entry) => ({ userId: entry.userId, fullName: entry.fullName, phone: entry.phone }))
    session.reservePlayers = reserve.map((entry) => ({ userId: entry.userId, fullName: entry.fullName, phone: entry.phone }))
    session.activeCount = active.length
    session.reserveCount = reserve.length

    const activeIndex = active.findIndex((entry) => entry.userId === user.id)
    if (activeIndex >= 0) {
      session.userStatus = 'active'
      session.userActivePosition = activeIndex + 1
    } else {
      const reserveIndex = reserve.findIndex((entry) => entry.userId === user.id)
      if (reserveIndex >= 0) {
        session.userStatus = 'reserve'
        session.userReservePosition = reserveIndex + 1
      } else {
        session.userStatus = 'none'
      }
    }
  }

  const teams: TeamSessionsView[] = []
  for (const teamId of teamIds) {
    const sessionsForTeam = sessionsByTeam.get(teamId) ?? []
    sessionsForTeam.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    teams.push({ teamId, teamName: teamMap.get(teamId) ?? 'Unknown team', sessions: Array.from(sessionsForTeam) })
  }

  teams.sort((a, b) => a.teamName.localeCompare(b.teamName))

  return (
    <main className="sessions">
      <SessionsDashboard teams={teams} userHasTeams />
    </main>
  )
}
