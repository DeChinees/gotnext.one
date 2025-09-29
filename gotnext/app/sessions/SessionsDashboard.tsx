'use client'

import { useActionState, useMemo } from 'react'
import type { TeamSessionsView } from './page'
import {
  joinGameSessionAction,
  leaveGameSessionAction,
  SessionActionResult,
} from './actions'
import { createTeamAction, type ActionResult } from '../dashboard/actions'

const initialResult: SessionActionResult = {}
const initialTeamResult: ActionResult = {}

const sessionDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

const sessionTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

function formatSessionDateLabel(value: string) {
  const date = new Date(value)
  return `${sessionDateFormatter.format(date)} · ${sessionTimeFormatter.format(date)}`
}

interface SessionsDashboardProps {
  teams: TeamSessionsView[]
  userHasTeams: boolean
}

export default function SessionsDashboard({ teams, userHasTeams }: SessionsDashboardProps) {
  const [createTeamState, createTeam] = useActionState(createTeamAction, initialTeamResult)
  const flattenedSessions = useMemo(() => teams.flatMap((team) => team.sessions), [teams])

  if (!userHasTeams) {
    return (
      <section
        style={{
          width: '100%',
          padding: 32,
          border: '1px solid #1f2937',
          borderRadius: 16,
          background: '#0b1120',
          maxWidth: 720,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0 }}>No sessions yet</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            It looks like you haven’t joined a team. Want to start one and invite your crew?
          </p>
        </header>
        <form action={createTeam} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
            <span style={{ color: '#cbd5f5', fontSize: 13 }}>Team name</span>
            <input
              type="text"
              name="name"
              placeholder="Downtown Hoopers"
              required
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #333',
                background: '#000',
                color: '#fff',
              }}
            />
          </label>
          <button
            type="submit"
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #22c55e',
              background: '#22c55e',
              color: '#000',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Create my team
          </button>
        </form>
        {createTeamState.error && <p style={{ margin: 0, color: '#f87171' }}>{createTeamState.error}</p>}
        {createTeamState.success && (
          <p style={{ margin: 0, color: '#22c55e' }}>
            Team created. Open the dashboard to invite players and schedule sessions.
          </p>
        )}
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
          Waiting on an invite instead? Ask your organiser to add you so new games show up here automatically.
        </p>
      </section>
    )
  }

  if (flattenedSessions.length === 0) {
    return (
      <section
        style={{
          width: '100%',
          padding: 32,
          border: '1px solid #1f2937',
          borderRadius: 16,
          background: '#0b1120',
          maxWidth: 720,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h1 style={{ marginBottom: 12 }}>No scheduled games</h1>
        <p style={{ color: '#94a3b8' }}>
          Your teams don’t have any upcoming runs yet. Ask an organiser to schedule a session.
        </p>
      </section>
    )
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>
      {teams.map((team) => (
        <section
          key={team.teamId}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: 24,
            border: '1px solid #1f2937',
            borderRadius: 16,
            background: '#0b1120',
          }}
        >
          <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0 }}>{team.teamName}</h2>
            <span style={{ color: '#64748b', fontSize: 14 }}>{team.sessions.length} upcoming games</span>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {team.sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

interface SessionCardProps {
  session: TeamSessionsView['sessions'][number]
}

function SessionCard({ session }: SessionCardProps) {
  const [joinState, joinAction] = useActionState(joinGameSessionAction, initialResult)
  const [leaveState, leaveAction] = useActionState(leaveGameSessionAction, initialResult)

  const spotsRemaining = Math.max(session.maxPlayers - session.activeCount, 0)
  const isActive = session.userStatus === 'active'
  const isReserve = session.userStatus === 'reserve'

  function renderStatus() {
    if (isActive) {
      return (
        <p style={{ margin: 0, color: '#22c55e', fontWeight: 500 }}>
          You’re confirmed for this game{session.userActivePosition ? ` (#${session.userActivePosition})` : ''}.
        </p>
      )
    }

    if (isReserve) {
      return (
        <p style={{ margin: 0, color: '#fbbf24', fontWeight: 500 }}>
          You’re #{session.userReservePosition ?? '?'} on the standby list. We’ll promote you automatically when a spot
          opens up.
        </p>
      )
    }

    if (spotsRemaining > 0) {
      return (
        <p style={{ margin: 0, color: '#94a3b8' }}>
          {spotsRemaining} open {spotsRemaining === 1 ? 'spot' : 'spots'} · active roster at {session.activeCount}/
          {session.maxPlayers}.
        </p>
      )
    }

    return (
      <p style={{ margin: 0, color: '#94a3b8' }}>
        Active roster is full. Join the standby list to be promoted automatically when a slot frees up.
      </p>
    )
  }

  function renderRoster(label: string, players: { userId: string; fullName: string | null }[], emptyMessage: string) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <strong style={{ fontSize: 13, color: '#cbd5f5' }}>{label}</strong>
        {players.length === 0 ? (
          <span style={{ color: '#475569', fontSize: 13 }}>{emptyMessage}</span>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: 13 }}>
            {players
              .map((player) => player.fullName ?? 'Unnamed player')
              .slice(0, 6)
              .join(', ')}
            {players.length > 6 ? '…' : ''}
          </span>
        )}
      </div>
    )
  }

  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '18px 20px',
        borderRadius: 12,
        border: '1px solid #1f2937',
        background: '#111827',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h3 style={{ margin: 0 }}>{session.title}</h3>
        <span style={{ color: '#cbd5f5', fontSize: 14 }} suppressHydrationWarning>
          {formatSessionDateLabel(session.startsAt)}
        </span>
        {session.location && (
          <span style={{ color: '#94a3b8', fontSize: 13 }}>📍 {session.location}</span>
        )}
        {session.notes && <span style={{ color: '#64748b', fontSize: 13 }}>{session.notes}</span>}
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>
          Active roster: {session.activeCount}/{session.maxPlayers} · Standby list: {session.reserveCount}
        </span>
        {renderStatus()}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {renderRoster('Active roster preview', session.activePlayers, 'No confirmed players yet.')}
        {renderRoster('Standby list preview', session.reservePlayers, 'No standby players yet.')}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <form
          action={joinAction}
          style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}
        >
          <input type="hidden" name="sessionId" value={session.id} />
          <button
            type="submit"
            disabled={session.userStatus !== 'none'}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #22c55e',
              background: isActive ? '#022c22' : '#22c55e',
              color: isActive ? '#bbf7d0' : '#022c22',
              cursor: isActive ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {session.userStatus === 'none' ? 'Join this game' : session.userStatus === 'active' ? 'You’re in' : 'On standby'}
          </button>
        </form>

        {session.userStatus !== 'none' && (
          <form
            action={leaveAction}
            style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}
          >
            <input type="hidden" name="sessionId" value={session.id} />
            <button
              type="submit"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #ef4444',
                background: '#1c1917',
                color: '#fca5a5',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Leave game
            </button>
          </form>
        )}
      </div>

      {(joinState.error || joinState.success || leaveState.error || leaveState.success) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {joinState.error && <span style={{ color: '#f87171', fontSize: 13 }}>{joinState.error}</span>}
          {joinState.success && <span style={{ color: '#22c55e', fontSize: 13 }}>{joinState.success}</span>}
          {leaveState.error && <span style={{ color: '#f87171', fontSize: 13 }}>{leaveState.error}</span>}
          {leaveState.success && <span style={{ color: '#22c55e', fontSize: 13 }}>{leaveState.success}</span>}
        </div>
      )}
    </article>
  )
}
