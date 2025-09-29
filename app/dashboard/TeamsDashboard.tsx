'use client'

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react'
import type {
  TeamSummary,
  TeamMemberSummary,
  TeamRole,
  TeamInviteSummary,
  GameSessionSummary,
  GameSignupSummary,
} from './page'
import {
  ActionResult,
  cancelInviteAction,
  createShareableInviteAction,
  createInviteAction,
  createSessionsAction,
  createTeamAction,
  removeMemberAction,
  removePlayerFromSessionAction,
  updateMemberRoleAction,
  addPlayerToSessionAction,
  updateSignupStatusAction,
  renameTeamAction,
} from './actions'

const initialState: ActionResult = {}

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

const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

function formatSessionDateLabel(value: string) {
  const date = new Date(value)
  return `${sessionDateFormatter.format(date)} · ${sessionTimeFormatter.format(date)}`
}

function formatSessionRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const dateLabel = sessionDateFormatter.format(start)
  const startLabel = sessionTimeFormatter.format(start)
  const endLabel = sessionTimeFormatter.format(end)
  return `${dateLabel} · ${startLabel} – ${endLabel}`
}

function formatTimestamp(value: string) {
  return timestampFormatter.format(new Date(value))
}

type ToastTone = 'success' | 'error'

interface ToastState {
  id: number
  message: string
  tone: ToastTone
}

const DASHBOARD_TABS = [
  { id: 'create', label: 'Create team' },
  { id: 'overview', label: 'Team overview' },
  { id: 'invites', label: 'Send invites' },
  { id: 'sessions', label: 'Game sessions' },
] as const

type TabId = (typeof DASHBOARD_TABS)[number]['id']

interface TeamsDashboardProps {
  userId: string
  viewerEmail: string
  teams: TeamSummary[]
}

export default function TeamsDashboard({ userId, viewerEmail, teams }: TeamsDashboardProps) {
  const [createState, createAction] = useActionState(createTeamAction, initialState)
  const [activeTab, setActiveTab] = useState<TabId>(teams.length > 0 ? 'overview' : 'create')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teams[0]?.id ?? null)

  useEffect(() => {
    if (teams.length === 0) {
      setSelectedTeamId(null)
      setActiveTab('create')
      return
    }

    setSelectedTeamId((prev) => {
      if (!prev) return teams[0]?.id ?? null
      return teams.some((team) => team.id === prev) ? prev : teams[0]?.id ?? null
    })
  }, [teams])

  const selectedTeam = useMemo(
    () => (selectedTeamId ? teams.find((team) => team.id === selectedTeamId) ?? null : null),
    [teams, selectedTeamId]
  )

  const canManageSelectedTeam = Boolean(
    selectedTeam && (selectedTeam.viewerRole === 'owner' || selectedTeam.viewerRole === 'admin')
  )

  const baseInviteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')

  function renderTabButton(tab: (typeof DASHBOARD_TABS)[number]) {
    const isDisabled = tab.id !== 'create' && teams.length === 0
    const isActive = activeTab === tab.id

    return (
      <button
        key={tab.id}
        onClick={() => !isDisabled && setActiveTab(tab.id)}
        disabled={isDisabled}
        style={{
          padding: '10px 16px',
          borderRadius: 20,
          border: '1px solid ' + (isActive ? '#38bdf8' : '#1f2937'),
          background: isActive ? '#0f172a' : '#020617',
          color: isActive ? '#bae6fd' : isDisabled ? '#475569' : '#cbd5f5',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          fontWeight: isActive ? 600 : 500,
        }}
      >
        {tab.label}
      </button>
    )
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Team dashboard</h1>
          <p style={{ margin: 0, color: '#94a3b8' }}>Signed in as {viewerEmail}</p>
        </div>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>{DASHBOARD_TABS.map(renderTabButton)}</nav>
      </header>

      {activeTab === 'create' ? (
        <section style={{ padding: 24, border: '1px solid #333', borderRadius: 12, background: '#0f172a' }}>
          <h2 style={{ marginTop: 0 }}>Create a new team</h2>
          <p style={{ marginTop: 8, color: '#94a3b8' }}>
            Start a fresh group for a new run or split your existing crew into separate invite-only teams.
          </p>
          <form action={createAction} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ color: '#cbd5f5' }}>Team name</span>
              <input
                type="text"
                name="name"
                required
                placeholder="Downtown Hoopers"
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
              Create team
            </button>
            {createState.error && <p style={{ margin: 0, color: '#f87171' }}>{createState.error}</p>}
            {createState.success && <p style={{ margin: 0, color: '#22c55e' }}>{createState.success}</p>}
          </form>
        </section>
      ) : teams.length === 0 ? (
        <section style={{ padding: 24, border: '1px solid #333', borderRadius: 12, background: '#020617' }}>
          <h2 style={{ marginTop: 0 }}>No teams yet</h2>
          <p style={{ marginTop: 8, color: '#94a3b8' }}>
            Use the “Create team” tab to spin up your first invite-only crew. Once created, you’ll unlock the rest of the
            dashboard.
          </p>
        </section>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              padding: 16,
              borderRadius: 12,
              border: '1px solid #1f2937',
              background: '#0b1120',
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ color: '#cbd5f5', fontSize: 13 }}>Active team</span>
              <select
                value={selectedTeamId ?? ''}
                onChange={(event) => setSelectedTeamId(event.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #333',
                  background: '#000',
                  color: '#fff',
                  minWidth: 220,
                }}
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            {selectedTeam && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Badge label={`Your role: ${selectedTeam.viewerRole}`} tone="info" />
                <Badge label={`${selectedTeam.members.length} players`} tone="neutral" />
                <Badge label={`${selectedTeam.invites.length} pending invites`} tone="warning" />
              </div>
            )}
          </div>

          {selectedTeam ? (
            <TabContent
              tab={activeTab}
              team={selectedTeam}
              currentUserId={userId}
              canManage={canManageSelectedTeam}
              baseInviteUrl={baseInviteUrl ?? ''}
            />
          ) : (
            <section style={{ padding: 24, border: '1px solid #333', borderRadius: 12, background: '#020617' }}>
              <p style={{ margin: 0, color: '#94a3b8' }}>Select a team to view its details.</p>
            </section>
          )}
        </section>
      )}
    </div>
  )
}

interface TabContentProps {
  tab: TabId
  team: TeamSummary
  currentUserId: string
  canManage: boolean
  baseInviteUrl: string
}

function TabContent({ tab, team, currentUserId, canManage, baseInviteUrl }: TabContentProps) {
  switch (tab) {
    case 'overview':
      return <TeamOverviewSection team={team} currentUserId={currentUserId} />
    case 'invites':
      return canManage ? (
        <InviteForm team={team} baseInviteUrl={baseInviteUrl} canManage={canManage} />
      ) : (
        <ReadOnlyNotice
          title="Invites are managed by owners or admins"
          message="Ask a team admin to add players or promote you if you need roster control."
        />
      )
    case 'sessions':
      return (
        <GameSessionsPanel
          teamId={team.id}
          teamName={team.name}
          sessions={team.sessions}
          canManage={canManage}
        />
      )
    default:
      return null
  }
}

interface TeamOverviewProps {
  team: TeamSummary
  currentUserId: string
}

function TeamOverviewSection({ team, currentUserId }: TeamOverviewProps) {
  const [teamDisplayName, setTeamDisplayName] = useState(team.name)
  const [teamNameDraft, setTeamNameDraft] = useState(team.name)
  const [isEditingName, setEditingName] = useState(false)
  const [renameFeedback, setRenameFeedback] = useState<ActionResult | null>(null)
  const [isRenaming, startRenameTransition] = useTransition()

  useEffect(() => {
    setTeamDisplayName(team.name)
    if (!isEditingName) {
      setTeamNameDraft(team.name)
    }
  }, [team.name, isEditingName])

  const canManage = team.viewerRole === 'owner' || team.viewerRole === 'admin'
  const upcomingSessions = team.sessions.filter((session) => new Date(session.endsAt).getTime() >= Date.now())
  const nextSessions = upcomingSessions.slice(0, 3)

  function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const draft = (formData.get('teamName') as string | null)?.trim() ?? ''

    if (!draft) {
      setRenameFeedback({ error: 'Team name is required.' })
      return
    }

    if (draft === teamDisplayName) {
      setEditingName(false)
      setRenameFeedback(null)
      return
    }

    startRenameTransition(async () => {
      const result = await renameTeamAction(team.id, draft)
      setRenameFeedback(result)
      if (!result.error) {
        setTeamDisplayName(draft)
        setTeamNameDraft(draft)
        setEditingName(false)
      }
    })
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          padding: 24,
          border: '1px solid #333',
          borderRadius: 12,
          background: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isEditingName ? (
                <form onSubmit={handleRename} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ color: '#cbd5f5', fontSize: 13 }}>Team name</span>
                    <input
                      name="teamName"
                      defaultValue={teamNameDraft}
                      autoFocus
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #333',
                        background: '#000',
                        color: '#fff',
                      }}
                    />
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="submit"
                      disabled={isRenaming}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #22c55e',
                        background: '#22c55e',
                        color: '#0b1120',
                        cursor: isRenaming ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {isRenaming ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingName(false)
                        setTeamNameDraft(teamDisplayName)
                        setRenameFeedback(null)
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #475569',
                        background: '#111827',
                        color: '#cbd5f5',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <h2 style={{ margin: 0 }}>{teamDisplayName}</h2>
              )}
              <p style={{ margin: 0, color: '#94a3b8' }}>
                You’re viewing the roster and upcoming runs for this invite-only crew.
              </p>
            </div>
            {canManage && !isEditingName && (
              <button
                onClick={() => {
                  setEditingName(true)
                  setTeamNameDraft(teamDisplayName)
                  setRenameFeedback(null)
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #38bdf8',
                  background: '#0f172a',
                  color: '#bae6fd',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Rename team
              </button>
            )}
          </div>
          {renameFeedback?.error && <span style={{ color: '#f87171', fontSize: 13 }}>{renameFeedback.error}</span>}
          {renameFeedback?.success && <span style={{ color: '#22c55e', fontSize: 13 }}>{renameFeedback.success}</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Badge label={`${team.members.length} players`} tone="neutral" />
          <Badge label={`${team.invites.length} pending invites`} tone={team.invites.length ? 'warning' : 'success'} />
          <Badge label={`${upcomingSessions.length} upcoming games`} tone={upcomingSessions.length ? 'info' : 'neutral'} />
          {canManage && <Badge label="You can manage this team" tone="success" />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Next games</h3>
          {nextSessions.length === 0 ? (
            <p style={{ margin: 0, color: '#64748b' }}>No games scheduled yet. Head to the “Game sessions” tab to plan one.</p>
          ) : (
            nextSessions.map((session) => (
              <div
                key={session.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #1f2937',
                  background: '#111827',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <strong>{session.title}</strong>
                <span style={{ color: '#cbd5f5', fontSize: 13 }} suppressHydrationWarning>
                  {formatSessionDateLabel(session.startsAt)}
                </span>
                {session.location && <span style={{ color: '#94a3b8', fontSize: 13 }}>📍 {session.location}</span>}
              </div>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          padding: 24,
          border: '1px solid #333',
          borderRadius: 12,
          background: '#0b1120',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Players</h3>
          {canManage && <span style={{ color: '#64748b', fontSize: 13 }}>Tip: promote trusted organisers to admin.</span>}
        </div>
        {team.members.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b' }}>Nobody has joined yet. Send a private invite to get started.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {team.members.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                team={team}
                currentUserId={currentUserId}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

interface BadgeProps {
  label: string
  tone: 'neutral' | 'info' | 'warning' | 'success'
}

function Badge({ label, tone }: BadgeProps) {
  const palette: Record<BadgeProps['tone'], { border: string; background: string; color: string }> = {
    neutral: { border: '#1f2937', background: '#111827', color: '#cbd5f5' },
    info: { border: '#38bdf8', background: '#0f172a', color: '#bae6fd' },
    warning: { border: '#fbbf24', background: '#1c1917', color: '#facc15' },
    success: { border: '#22c55e', background: '#022c22', color: '#bbf7d0' },
  }
  const { border, background, color } = palette[tone]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 999,
        border: `1px solid ${border}`,
        background,
        color,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  )
}

interface ReadOnlyNoticeProps {
  title: string
  message: string
}

function ReadOnlyNotice({ title, message }: ReadOnlyNoticeProps) {
  return (
    <section style={{ padding: 24, border: '1px solid #333', borderRadius: 12, background: '#020617' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ marginTop: 8, color: '#94a3b8' }}>{message}</p>
    </section>
  )
}

interface MemberRowProps {
  member: TeamMemberSummary
  team: TeamSummary
  currentUserId: string
  canManage: boolean
}

function MemberRow({ member, team, currentUserId, canManage }: MemberRowProps) {
  const [feedback, setFeedback] = useState<ActionResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [currentRole, setCurrentRole] = useState<TeamRole>(member.role)
  const isSelf = member.userId === currentUserId
  const canEditMember = canManage && (!isSelf || team.viewerRole === 'owner')

  useEffect(() => {
    setCurrentRole(member.role)
  }, [member.role])

  function handleRoleChange(role: TeamRole) {
    const previousRole = currentRole
    setCurrentRole(role)
    startTransition(async () => {
      const result = await updateMemberRoleAction(team.id, member.userId, role)
      if (result.error) {
        setCurrentRole(previousRole)
      }
      setFeedback(result)
    })
  }

  function handleRemoval() {
    startTransition(async () => {
      const result = await removeMemberAction(team.id, member.userId)
      setFeedback(result)
    })
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) auto',
        gap: 12,
        alignItems: 'center',
        padding: '12px 16px',
        borderRadius: 10,
        border: '1px solid #1f2937',
        background: '#111827',
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>{member.fullName ?? 'Unnamed player'}</div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>{member.phone ?? 'No phone on file'}</div>
      </div>
      <div>
        {canEditMember ? (
          <select
            value={currentRole}
            disabled={isPending}
            onChange={(event) => handleRoleChange(event.target.value as TeamRole)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="player">Player</option>
          </select>
        ) : (
          <span style={{ color: '#94a3b8' }}>{member.role}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {canEditMember && (
          <button
            onClick={handleRemoval}
            disabled={isPending}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #ef4444',
              background: '#1c1917',
              color: '#fca5a5',
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isSelf ? 'Leave team' : 'Remove'}
          </button>
        )}
      </div>
      {feedback?.error && <p style={{ gridColumn: '1 / -1', margin: 0, color: '#f87171' }}>{feedback.error}</p>}
      {feedback?.success && <p style={{ gridColumn: '1 / -1', margin: 0, color: '#22c55e' }}>{feedback.success}</p>}
    </div>
  )
}

interface InviteFormProps {
  team: TeamSummary
  baseInviteUrl: string
  canManage: boolean
}

function InviteForm({ team, baseInviteUrl, canManage }: InviteFormProps) {
  const [state, action] = useActionState(createInviteAction, initialState)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [isCancelling, startTransition] = useTransition()
  const [shareRole, setShareRole] = useState<TeamRole>('player')
  const [shareFeedback, setShareFeedback] = useState<ActionResult | null>(null)
  const [isGeneratingShare, startShareTransition] = useTransition()

  async function handleCopy(token: string) {
    const link = `${baseInviteUrl || window.location.origin}/invite/${token}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2500)
    } catch (error) {
      console.error('Unable to copy invite link', error)
    }
  }

  function handleCancel(invite: TeamInviteSummary) {
    if (!canManage) return
    startTransition(async () => {
      await cancelInviteAction(invite.id)
    })
  }

  function handleGenerateShareable() {
    if (!canManage) return
    startShareTransition(async () => {
      const result = await createShareableInviteAction(team.id, shareRole)
      setShareFeedback(result)
      if (!result.error) {
        setCopiedToken(null)
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h3 style={{ margin: 0 }}>Invite players</h3>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>
          Send a private link or generate a shareable URL. Players must sign in before they can join.
        </p>
      </div>

      {canManage ? (
        <form action={action} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <input type="hidden" name="teamId" value={team.id} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: '#cbd5f5' }}>Email</span>
            <input
              type="email"
              name="email"
              required
              placeholder="player@example.com"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: '#cbd5f5' }}>Phone (+code)</span>
            <input
              type="tel"
              name="phone"
              placeholder="+31 612345678"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: '#cbd5f5' }}>Role</span>
            <select
              name="role"
              defaultValue="player"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
            >
              <option value="player">Player</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #333',
                background: '#38bdf8',
                color: '#000',
                cursor: 'pointer',
                fontWeight: 600,
                width: '100%',
              }}
            >
              Send invite
            </button>
          </div>
        </form>
      ) : (
        <ReadOnlyNotice
          title="You don’t have invite permissions"
          message="Only owners and admins can send or revoke invites."
        />
      )}

      {canManage && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '14px 16px',
            borderRadius: 10,
            border: '1px solid #1f2937',
            background: '#0f172a',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 600 }}>Generate shareable link</div>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
              Perfect for WhatsApp blasts or email threads. Links stop working once accepted or cancelled.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ color: '#cbd5f5' }}>Role for new joiners</span>
              <select
                value={shareRole}
                onChange={(event) => setShareRole(event.target.value as TeamRole)}
                disabled={isGeneratingShare}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #333',
                  background: '#000',
                  color: '#fff',
                  minWidth: 140,
                }}
              >
                <option value="player">Player</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button
              onClick={handleGenerateShareable}
              disabled={isGeneratingShare}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #38bdf8',
                background: '#0f172a',
                color: '#bae6fd',
                cursor: isGeneratingShare ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {isGeneratingShare ? 'Generating…' : 'Create shareable link'}
            </button>
          </div>
          {shareFeedback?.error && <p style={{ margin: 0, color: '#f87171' }}>{shareFeedback.error}</p>}
          {shareFeedback?.success && <p style={{ margin: 0, color: '#22c55e' }}>{shareFeedback.success}</p>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h4 style={{ margin: 0 }}>Pending invites</h4>
        {team.invites.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b' }}>No outstanding invites.</p>
        ) : (
          team.invites.map((invite) => (
            <div
              key={invite.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #1f2937',
                background: '#111827',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{invite.email ?? 'Shareable link'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>
                    {invite.email
                      ? `Role: ${invite.role} · ${invite.phone ?? 'No phone provided'}`
                      : `Anyone with this link joins as ${invite.role}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleCopy(invite.token)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid #38bdf8',
                      background: '#0f172a',
                      color: '#bae6fd',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedToken === invite.token ? 'Copied!' : 'Copy link'}
                  </button>
                  {canManage && (
                    <button
                      onClick={() => handleCancel(invite)}
                      disabled={isCancelling}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #ef4444',
                        background: '#1c1917',
                        color: '#fca5a5',
                        cursor: isCancelling ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Expires{' '}
                <span suppressHydrationWarning>{formatTimestamp(invite.expiresAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

interface GameSessionsPanelProps {
  teamId: string
  teamName: string
  sessions: GameSessionSummary[]
  canManage: boolean
}

function GameSessionsPanel({ teamId, teamName, sessions, canManage }: GameSessionsPanelProps) {
  const [sessionState, sessionAction] = useActionState(createSessionsAction, initialState)
  const [repeatMode, setRepeatMode] = useState<'none' | 'weekly'>('none')
  const [sessionFeedback, setSessionFeedback] = useState<Record<string, ActionResult | null>>({})
  const [isMoving, startMoveTransition] = useTransition()
  const [isAdding, startAddTransition] = useTransition()
  const [isRemoving, startRemoveTransition] = useTransition()
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  function showToast(message: string, tone: ToastTone) {
    setToast({ id: Date.now(), message, tone })
  }

  const now = Date.now()
  const upcomingSessions = sessions.filter((session) => new Date(session.endsAt).getTime() >= now)

  function formatRange(startsAt: string, endsAt: string) {
    return formatSessionRange(startsAt, endsAt)
  }

  function handleMove(
    sessionId: string,
    userId: string,
    targetStatus: 'active' | 'reserve',
    targetDisplayName: string
  ) {
    startMoveTransition(async () => {
      const result = await updateSignupStatusAction(sessionId, userId, targetStatus)

      if (result.error) {
        setSessionFeedback((prev) => ({ ...prev, [sessionId]: result }))
        showToast(result.error, 'error')
        return
      }

      setSessionFeedback((prev) => {
        const next = { ...prev }
        delete next[sessionId]
        return next
      })

      if (result.success === 'Roster already up to date.') {
        showToast(result.success, 'success')
        return
      }

      const meta = (result.meta ?? {}) as Record<string, unknown>
      const targetNameFromMeta = typeof meta.targetName === 'string' ? meta.targetName.trim() : ''
      const fallbackName = targetDisplayName.trim() || 'This player'
      const targetName = targetNameFromMeta || fallbackName
      const promotedNameRaw = typeof meta.promotedName === 'string' ? meta.promotedName.trim() : ''
      const promotedName = promotedNameRaw || undefined

      let message =
        targetStatus === 'active'
          ? `${targetName} promoted to the active roster.`
          : `${targetName} moved to the standby list.`

      if (promotedName) {
        message += ` Promoted ${promotedName} from the standby list to the active roster.`
      } else if (result.success && result.success.includes('Promoted the next player')) {
        message += ' Promoted the next player from the standby list.'
      }

      showToast(message, 'success')
    })
  }

  function handleAdd(
    sessionId: string,
    userId: string,
    targetStatus: 'active' | 'reserve',
    targetDisplayName: string
  ) {
    startAddTransition(async () => {
      const result = await addPlayerToSessionAction(sessionId, userId, targetStatus)

      if (result.error) {
        setSessionFeedback((prev) => ({ ...prev, [sessionId]: result }))
        showToast(result.error, 'error')
        return
      }

      setSessionFeedback((prev) => {
        const next = { ...prev }
        delete next[sessionId]
        return next
      })

      if (result.success === 'Roster already up to date.') {
        showToast(result.success, 'success')
        return
      }

      const meta = (result.meta ?? {}) as Record<string, unknown>
      const targetNameFromMeta = typeof meta.targetName === 'string' ? meta.targetName.trim() : ''
      const fallbackName = targetDisplayName.trim() || 'This player'
      const targetName = targetNameFromMeta || fallbackName

      const message =
        targetStatus === 'active'
          ? `Added ${targetName} to the active roster.`
          : `Added ${targetName} to the standby list.`

      showToast(message, 'success')
    })
  }

  function handleRemove(sessionId: string, userId: string, targetDisplayName: string) {
    startRemoveTransition(async () => {
      const result = await removePlayerFromSessionAction(sessionId, userId)

      if (result.error) {
        setSessionFeedback((prev) => ({ ...prev, [sessionId]: result }))
        showToast(result.error, 'error')
        return
      }

      setSessionFeedback((prev) => {
        const next = { ...prev }
        delete next[sessionId]
        return next
      })

      if (result.success === 'Player was not on this roster.') {
        showToast(result.success, 'success')
        return
      }

      const meta = (result.meta ?? {}) as Record<string, unknown>
      const targetNameFromMeta = typeof meta.targetName === 'string' ? meta.targetName.trim() : ''
      const fallbackName = targetDisplayName.trim() || 'This player'
      const targetName = targetNameFromMeta || fallbackName
      const promotedNameRaw = typeof meta.promotedName === 'string' ? meta.promotedName.trim() : ''
      const promotedName = promotedNameRaw || undefined

      let message = `${targetName} removed from this game.`
      if (promotedName) {
        message += ` Promoted ${promotedName} from the standby list to the active roster.`
      } else if (result.success && result.success.includes('Promoted the next player')) {
        message += ' Promoted the next player from the standby list.'
      }

      showToast(message, 'success')
    })
  }

  function renderSignupList(
    session: GameSessionSummary,
    label: string,
    signups: GameSignupSummary[],
    emptyMessage: string,
    targetStatus: 'active' | 'reserve'
  ) {
    const isStandbyTarget = targetStatus === 'reserve'
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h4 style={{ margin: 0 }}>{label}</h4>
        {signups.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b' }}>{emptyMessage}</p>
        ) : (
          signups.map((signup) => (
            <div
              key={signup.userId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #1f2937',
                background: '#111827',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{signup.fullName ?? 'Unnamed player'}</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{signup.phone ?? 'No phone on file'}</div>
              </div>
              {canManage && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() =>
                      handleMove(
                        session.id,
                        signup.userId,
                        targetStatus,
                        signup.fullName ?? 'Unnamed player'
                      )
                    }
                    disabled={isMoving || isRemoving}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid ' + (isStandbyTarget ? '#f59e0b' : '#22c55e'),
                      background: isStandbyTarget ? '#1c1917' : '#0f172a',
                      color: isStandbyTarget ? '#fbbf24' : '#bbf7d0',
                      cursor: isMoving || isRemoving ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {isStandbyTarget ? 'Move to standby' : 'Promote to active'}
                  </button>
                  <button
                    onClick={() => handleRemove(session.id, signup.userId, signup.fullName ?? 'Unnamed player')}
                    disabled={isRemoving || isMoving}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #ef4444',
                      background: '#1c1917',
                      color: '#fca5a5',
                      cursor: isRemoving || isMoving ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Mark inactive
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    )
  }

  function renderInactiveList(session: GameSessionSummary) {
    if (!canManage) {
      return null
    }

    const inactive = session.inactiveMembers

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h4 style={{ margin: 0 }}>Inactive members</h4>
        {inactive.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b' }}>Everyone has responded.</p>
        ) : (
          inactive.map((member) => (
            <div
              key={member.userId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #1f2937',
                background: '#111827',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{member.fullName ?? 'Unnamed player'}</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{member.phone ?? 'No phone on file'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() =>
                    handleAdd(session.id, member.userId, 'active', member.fullName ?? 'Unnamed player')
                  }
                  disabled={isAdding || isRemoving}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #22c55e',
                    background: '#0f172a',
                    color: '#bbf7d0',
                    cursor: isAdding || isRemoving ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Add to active
                </button>
                <button
                  onClick={() =>
                    handleAdd(session.id, member.userId, 'reserve', member.fullName ?? 'Unnamed player')
                  }
                  disabled={isAdding || isRemoving}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #f59e0b',
                    background: '#1c1917',
                    color: '#fbbf24',
                    cursor: isAdding || isRemoving ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Add to standby
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {toast && (
        <div
          key={toast.id}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid ' + (toast.tone === 'error' ? '#f87171' : '#22c55e'),
            background: toast.tone === 'error' ? '#7f1d1d' : '#14532d',
            color: '#f8fafc',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: 320,
          }}
        >
          {toast.message}
        </div>
      )}

      <div>
        <h3 style={{ margin: 0 }}>Game sessions for {teamName}</h3>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>
          Manage recurring runs, active rosters, and the automatic waitlist for this team.
        </p>
      </div>

      {canManage && (
        <form
          action={sessionAction}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}
        >
          <input type="hidden" name="teamId" value={teamId} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: '#cbd5f5' }}>Title</span>
            <input
              type="text"
              name="title"
              required
              placeholder="Sunday Run"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: '#cbd5f5' }}>Location</span>
            <input
              type="text"
              name="location"
              placeholder="Downtown Gym"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: '#cbd5f5' }}>Notes</span>
            <textarea
              name="notes"
              rows={2}
              placeholder="Bring dark/light shirts"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff', resize: 'vertical' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: '#cbd5f5' }}>Starts at</span>
            <input
              type="datetime-local"
              name="startsAt"
              required
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: '#cbd5f5' }}>Ends at</span>
            <input
              type="datetime-local"
              name="endsAt"
              required
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: '#cbd5f5' }}>Max players</span>
            <input
              type="number"
              name="maxPlayers"
              required
              min={1}
              defaultValue={12}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: '#cbd5f5' }}>Repeat</span>
            <select
              name="repeatMode"
              value={repeatMode}
              onChange={(event) => setRepeatMode(event.target.value as 'none' | 'weekly')}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
            >
              <option value="none">One-off</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          {repeatMode === 'weekly' ? (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ color: '#cbd5f5' }}>Occurrences (including first)</span>
              <input
                type="number"
                name="repeatCount"
                min={1}
                max={12}
                defaultValue={4}
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#000', color: '#fff' }}
              />
            </label>
          ) : (
            <input type="hidden" name="repeatCount" value="1" />
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #22c55e',
                background: '#022c22',
                color: '#bbf7d0',
                cursor: 'pointer',
                fontWeight: 600,
                width: '100%',
              }}
            >
              Schedule game
            </button>
          </div>
        </form>
      )}

      {canManage && sessionState.error && <p style={{ margin: 0, color: '#f87171' }}>{sessionState.error}</p>}
      {canManage && sessionState.success && <p style={{ margin: 0, color: '#22c55e' }}>{sessionState.success}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h4 style={{ margin: 0 }}>Upcoming games</h4>
        {upcomingSessions.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b' }}>No games scheduled yet.</p>
        ) : (
          upcomingSessions.map((session) => {
            const feedback = sessionFeedback[session.id]
            return (
              <article
                key={session.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid #1f2937',
                  background: '#0f172a',
                }}
              >
                <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 18 }}>{session.title}</h4>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }} suppressHydrationWarning>
                        {formatRange(session.startsAt, session.endsAt)}
                      </p>
                    </div>
                    <span style={{ color: '#bfdbfe', fontSize: 13 }}>
                      Active {session.activeSignups.length}/{session.maxPlayers}
                    </span>
                  </div>
                  {session.location && (
                    <p style={{ margin: 0, color: '#cbd5f5', fontSize: 13 }}>📍 {session.location}</p>
                  )}
                  {session.notes && (
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>{session.notes}</p>
                  )}
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  {renderSignupList(
                    session,
                    'Active roster',
                    session.activeSignups,
                    'No players confirmed yet.',
                    'reserve'
                  )}
                  {renderSignupList(
                    session,
                    'Standby list',
                    session.reserveSignups,
                    'Standby list is empty.',
                    'active'
                  )}
                  {renderInactiveList(session)}
                </div>

                {feedback?.error && <p style={{ margin: 0, color: '#f87171' }}>{feedback.error}</p>}
                {feedback?.success && <p style={{ margin: 0, color: '#22c55e' }}>{feedback.success}</p>}
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
