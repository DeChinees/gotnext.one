DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE lower(name) = 'hoopers') THEN
    RAISE EXCEPTION 'Team "Hoopers" not found. Create it before running add_players.sql.';
  END IF;
END;
$$;

BEGIN;

WITH player_seed AS (
  SELECT
    seed.user_id,
    seed.suffix,
    concat('player', seed.suffix) AS full_name,
    concat('player', seed.suffix, '@gotnext.one') AS email,
    concat('+', lpad((floor(random() * 9e9) + 1e9)::text, 10, '0')) AS phone
  FROM (
    SELECT
      gen_random_uuid() AS user_id,
      lpad(gs::text, 2, '0') AS suffix
    FROM generate_series(1, 10) AS gs
  ) AS seed
),
inserted_users AS (
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  )
  SELECT
    user_id,
    '00000000-0000-0000-0000-000000000000',
    email,
    crypt('TempPass123!', gen_salt('bf')),
    timezone('utc', now()),
    timezone('utc', now()),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', full_name, 'phone', phone),
    'authenticated',
    'authenticated',
    timezone('utc', now()),
    timezone('utc', now())
  FROM player_seed
  RETURNING id, email, raw_user_meta_data
),
inserted_profiles AS (
  INSERT INTO public.profiles (id, full_name, phone)
  SELECT
    id,
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'phone'
  FROM inserted_users
  RETURNING id
),
inserted_invites AS (
  INSERT INTO public.team_invites (
    team_id,
    email,
    phone,
    role,
    token,
    invited_by,
    expires_at,
    accepted_at,
    accepted_user_id,
    created_at
  )
  SELECT
    t.id,
    u.email,
    u.raw_user_meta_data->>'phone',
    'player',
    gen_random_uuid(),
    t.owner_id,
    timezone('utc', now()) + interval '7 days',
    timezone('utc', now()),
    u.id,
    timezone('utc', now())
  FROM inserted_users u
  JOIN public.teams t ON lower(t.name) = 'hoopers'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.team_invites ti
    WHERE ti.team_id = t.id
      AND ti.accepted_user_id = u.id
  )
  RETURNING id
)
INSERT INTO public.team_members (team_id, user_id, role, invited_by)
SELECT
  t.id,
  u.id,
  'player',
  t.owner_id
FROM inserted_users u
JOIN public.teams t ON lower(t.name) = 'hoopers'
ON CONFLICT (team_id, user_id) DO NOTHING;

COMMIT;
