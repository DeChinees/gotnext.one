-- Drop triggers
drop trigger if exists set_profiles_updated_at on public.profiles;
drop trigger if exists set_teams_updated_at on public.teams;
drop trigger if exists set_team_members_updated_at on public.team_members;
drop trigger if exists ensure_owner_team_membership on public.teams;

-- Drop functions
drop function if exists public.handle_updated_at cascade;
drop function if exists public.ensure_team_owner_membership cascade;
drop function if exists public.accept_team_invite cascade;
drop function if exists public.get_team_invite cascade;

-- Drop policies
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Team members can view each other" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists "Members can view teams" on public.teams;
drop policy if exists "Owners can update team" on public.teams;
drop policy if exists "Authenticated users can create team" on public.teams;

drop policy if exists "Members can view team membership" on public.team_members;
drop policy if exists "Owners manage membership roles" on public.team_members;
drop policy if exists "Owners remove members" on public.team_members;

drop policy if exists "Team admins manage invites" on public.team_invites;

-- Drop tables
drop table if exists public.team_invites cascade;
drop table if exists public.team_members cascade;
drop table if exists public.teams cascade;
drop table if exists public.profiles cascade;

-- Drop type
drop type if exists public.team_role cascade;