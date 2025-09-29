-- Enable extensions required for UUID generation
create extension if not exists "pgcrypto";

-- Domain and enum definitions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_role') THEN
    CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'player');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_signup_status') THEN
    CREATE TYPE public.game_signup_status AS ENUM ('active', 'reserve');
  END IF;
END
$$;

-- Profiles table holds per-user metadata
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text not null check (phone ~ '^\+[0-9]{6,15}$'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists teams_owner_name_idx on public.teams (owner_id, lower(name));

-- Team membership
create table if not exists public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.team_role not null default 'player',
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (team_id, user_id)
);

create index if not exists team_members_user_idx on public.team_members (user_id);

alter table public.team_members
  drop constraint if exists team_members_user_id_profiles_fkey;

alter table public.team_members
  add constraint team_members_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

-- Team invites
create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  email text,
  phone text,
  role public.team_role not null default 'player',
  token uuid not null default gen_random_uuid(),
  invited_by uuid not null references auth.users (id),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '7 days'),
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users (id),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists team_invites_token_idx on public.team_invites (token);
create index if not exists team_invites_team_idx on public.team_invites (team_id);
create unique index if not exists team_invites_unique_pending_email
  on public.team_invites (team_id, lower(email))
  where accepted_at is null and email is not null;

-- Updated_at trigger helper
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Attach triggers
drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_teams_updated_at on public.teams;

create trigger set_teams_updated_at
  before update on public.teams
  for each row execute function public.handle_updated_at();

drop trigger if exists set_team_members_updated_at on public.team_members;

create trigger set_team_members_updated_at
  before update on public.team_members
  for each row execute function public.handle_updated_at();

-- Automatic owner membership for new teams
create or replace function public.ensure_team_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.team_members (team_id, user_id, role, invited_by)
  values (new.id, new.owner_id, 'owner', new.owner_id)
  on conflict (team_id, user_id) do update set role = excluded.role;
  return new;
end;
$$;

drop trigger if exists ensure_owner_team_membership on public.teams;

create trigger ensure_owner_team_membership
  after insert on public.teams
  for each row execute function public.ensure_team_owner_membership();

-- Helper functions for security policies ------------------------------------

create or replace function public.has_team_role(_team_id uuid, _roles public.team_role[])
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  return exists (
    select 1
    from public.team_members tm
    where tm.team_id = _team_id
      and tm.user_id = auth.uid()
      and tm.role = any(_roles)
  );
end;
$$;

create or replace function public.is_team_member(_team_id uuid)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select public.has_team_role(_team_id, array['owner','admin','player']::public.team_role[]);
$$;

create or replace function public.is_team_admin(_team_id uuid)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select public.has_team_role(_team_id, array['owner','admin']::public.team_role[]);
$$;

create or replace function public.shares_team_with(_other_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  return exists (
    select 1
    from public.team_members tm_self
    join public.team_members tm_other
      on tm_self.team_id = tm_other.team_id
    where tm_self.user_id = auth.uid()
      and tm_other.user_id = _other_user_id
  );
end;
$$;

-- Game sessions --------------------------------------------------------------

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  title text not null,
  location text,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  max_players integer not null check (max_players > 0),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists game_sessions_team_idx on public.game_sessions (team_id, starts_at);

create table if not exists public.game_signups (
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.game_signup_status not null,
  created_at timestamptz not null default timezone('utc', now()),
  promoted_at timestamptz,
  primary key (session_id, user_id)
);

create index if not exists game_signups_session_idx on public.game_signups (session_id, status, created_at);

drop trigger if exists set_game_sessions_updated_at on public.game_sessions;

create trigger set_game_sessions_updated_at
  before update on public.game_sessions
  for each row execute function public.handle_updated_at();

create or replace function public.get_game_session_team(_session_id uuid)
returns uuid
language sql
security definer
set search_path = public, extensions
as $$
  select team_id from public.game_sessions where id = _session_id;
$$;

create or replace function public.session_active_count(_session_id uuid)
returns integer
language sql
security definer
set search_path = public, extensions
as $$
  select count(*) from public.game_signups where session_id = _session_id and status = 'active';
$$;

create or replace function public.join_game_session(_session_id uuid)
returns public.game_signups
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  session_record public.game_sessions;
  result_record public.game_signups;
  target_status public.game_signup_status;
  active_count integer;
  now_utc timestamptz := timezone('utc', now());
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to RSVP';
  end if;

  select * into session_record from public.game_sessions where id = _session_id;
  if not found then
    raise exception 'Game session not found';
  end if;

  if not public.is_team_member(session_record.team_id) then
    raise exception 'You must be a team member to RSVP';
  end if;

  select * into result_record from public.game_signups where session_id = _session_id and user_id = auth.uid();
  if found then
    return result_record;
  end if;

  select count(*) into active_count
  from public.game_signups
  where session_id = _session_id and status = 'active';

  if active_count < session_record.max_players then
    target_status := 'active';
  else
    target_status := 'reserve';
  end if;

  insert into public.game_signups (session_id, user_id, status, created_at, promoted_at)
  values (_session_id, auth.uid(), target_status, now_utc, case when target_status = 'active' then now_utc else null end)
  returning * into result_record;

  return result_record;
end;
$$;

create or replace function public.leave_game_session(_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  session_team uuid;
  removed_status public.game_signup_status;
  now_utc timestamptz := timezone('utc', now());
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to update RSVP';
  end if;

  session_team := public.get_game_session_team(_session_id);

  if session_team is null then
    raise exception 'Game session not found';
  end if;

  if not public.is_team_member(session_team) then
    raise exception 'You must be a team member to update RSVP';
  end if;

  delete from public.game_signups
    where session_id = _session_id and user_id = auth.uid()
    returning status into removed_status;

  if removed_status = 'active' then
    update public.game_signups
      set status = 'active', promoted_at = now_utc
      where ctid in (
        select ctid
        from public.game_signups
        where session_id = _session_id
          and status = 'reserve'
        order by created_at
        limit 1
      );
  end if;
end;
$$;

-- Security helpers ---------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_signups enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile" on public.profiles;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Team members can view each other" on public.profiles;

create policy "Team members can view each other" on public.profiles
  for select using (
    auth.uid() = id or public.shares_team_with(profiles.id)
  );

drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Teams policies
drop policy if exists "Members can view teams" on public.teams;

create policy "Members can view teams" on public.teams
  for select using (
    public.is_team_member(id)
  );

drop policy if exists "Owners can update team" on public.teams;

create policy "Owners can update team" on public.teams
  for update using (
    public.has_team_role(id, array['owner']::public.team_role[])
  ) with check (
    public.has_team_role(id, array['owner']::public.team_role[])
  );

drop policy if exists "Authenticated users can create team" on public.teams;

create policy "Authenticated users can create team" on public.teams
  for insert with check (auth.uid() = owner_id);

-- Team members policies
drop policy if exists "Members can view team membership" on public.team_members;

create policy "Members can view team membership" on public.team_members
  for select using (
    public.is_team_member(team_members.team_id)
  );

-- Disallow direct inserts; handled via invite acceptance function
drop policy if exists "Owners manage membership roles" on public.team_members;

create policy "Owners manage membership roles" on public.team_members
  for update using (
    public.is_team_admin(team_members.team_id)
  ) with check (
    public.is_team_admin(team_members.team_id)
  );

drop policy if exists "Owners remove members" on public.team_members;

create policy "Owners remove members" on public.team_members
  for delete using (
    public.is_team_admin(team_members.team_id)
  );

-- Team invites policies
drop policy if exists "Team admins manage invites" on public.team_invites;

create policy "Team admins manage invites" on public.team_invites
  for all using (
    public.is_team_admin(team_invites.team_id)
  ) with check (
    public.is_team_admin(team_invites.team_id)
  );

-- Game sessions policies
drop policy if exists "Members can view sessions" on public.game_sessions;

create policy "Members can view sessions" on public.game_sessions
  for select using (
    public.is_team_member(game_sessions.team_id)
  );

drop policy if exists "Admins can insert sessions" on public.game_sessions;

create policy "Admins can insert sessions" on public.game_sessions
  for insert with check (public.is_team_admin(game_sessions.team_id));

drop policy if exists "Admins can update sessions" on public.game_sessions;

create policy "Admins can update sessions" on public.game_sessions
  for update using (public.is_team_admin(game_sessions.team_id)) with check (public.is_team_admin(game_sessions.team_id));

drop policy if exists "Admins can delete sessions" on public.game_sessions;

create policy "Admins can delete sessions" on public.game_sessions
  for delete using (public.is_team_admin(game_sessions.team_id));

drop policy if exists "Members can view signups" on public.game_signups;

create policy "Members can view signups" on public.game_signups
  for select using (
    public.is_team_member(public.get_game_session_team(game_signups.session_id))
  );

drop policy if exists "Admins manage signups" on public.game_signups;

create policy "Admins manage signups" on public.game_signups
  for all using (
    public.is_team_admin(public.get_game_session_team(game_signups.session_id))
  ) with check (
    public.is_team_admin(public.get_game_session_team(game_signups.session_id))
  );

drop policy if exists "Members can remove own signup" on public.game_signups;

create policy "Members can remove own signup" on public.game_signups
  for delete using (auth.uid() = game_signups.user_id);

-- Invite acceptance function ------------------------------------------------

create or replace function public.accept_team_invite(invite_token uuid)
returns public.team_members
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  invite_record public.team_invites;
  membership public.team_members;
  current_user_id uuid := auth.uid();
  now_utc timestamptz := timezone('utc', now());
begin
  if current_user_id is null then
    raise exception 'Must be signed in to accept an invite';
  end if;

  select * into invite_record
  from public.team_invites
  where token = invite_token
    and accepted_at is null
    and expires_at > now_utc
  for update;

  if not found then
    raise exception 'Invite is invalid or expired';
  end if;

  if exists (
    select 1 from public.team_members
    where team_id = invite_record.team_id and user_id = current_user_id
  ) then
    update public.team_invites
      set accepted_at = now_utc,
          accepted_user_id = current_user_id
      where id = invite_record.id
      returning * into invite_record;

    select * into membership
    from public.team_members
    where team_id = invite_record.team_id and user_id = current_user_id;

    return membership;
  end if;

  insert into public.team_members (team_id, user_id, role, invited_by)
  values (invite_record.team_id, current_user_id, invite_record.role, invite_record.invited_by)
  returning * into membership;

  update public.team_invites
    set accepted_at = now_utc,
        accepted_user_id = current_user_id
    where id = invite_record.id;

  return membership;
end;
$$;

grant execute on function public.accept_team_invite(uuid) to authenticated;

-- Helper to fetch invite by token (for display)
create or replace function public.get_team_invite(invite_token uuid)
returns table (
  id uuid,
  team_id uuid,
  email text,
  phone text,
  role public.team_role,
  token uuid,
  invited_by uuid,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz,
  team_name text
)
language sql
security definer
set search_path = public, extensions
as $$
  select ti.id,
         ti.team_id,
         ti.email,
         ti.phone,
         ti.role,
         ti.token,
         ti.invited_by,
         ti.expires_at,
         ti.accepted_at,
         ti.created_at,
         t.name as team_name
  from public.team_invites ti
  join public.teams t on t.id = ti.team_id
  where ti.token = invite_token;
$$;

grant execute on function public.get_team_invite(uuid) to authenticated;
grant execute on function public.get_team_invite(uuid) to anon;

grant execute on function public.has_team_role(uuid, public.team_role[]) to authenticated;
grant execute on function public.is_team_member(uuid) to authenticated;
grant execute on function public.is_team_admin(uuid) to authenticated;
grant execute on function public.shares_team_with(uuid) to authenticated;
grant execute on function public.get_game_session_team(uuid) to authenticated;
grant execute on function public.session_active_count(uuid) to authenticated;
grant execute on function public.join_game_session(uuid) to authenticated;
grant execute on function public.leave_game_session(uuid) to authenticated;

grant usage on type public.game_signup_status to authenticated;
grant usage on type public.team_role to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.teams to authenticated;
grant select, update, delete on public.team_members to authenticated;
grant select, insert, update, delete on public.team_invites to authenticated;
