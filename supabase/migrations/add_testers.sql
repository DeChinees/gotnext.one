-- Ensure required extensions
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- CREATE EXTENSION IF NOT EXISTS uuid-ossp; -- if you prefer, but gen_random_uuid() is from pgcrypto

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE lower(name) = 'hoopers') THEN
    RAISE EXCEPTION 'Team "Hoopers" not found. Create it before running add_testers.sql.';
  END IF;
END;
$$;

BEGIN;

-- Seed list (the source of truth)
WITH tester_seed AS (
  SELECT
    gen_random_uuid() AS user_id,
    full_name,
    email,
    phone,
    role
  FROM (
    VALUES
      ('Roberto Tsang', 'Robertotsang@hotmail.com', '+15555550101', 'admin'),
      ('Jeff Jong', 'groteJeff@gotnext.one', '+15555550102', 'admin'),
      ('John Smith', 'johnsmith@example.com', '+15555550103', 'player'),
      ('Michael Jordan', 'mjordan@gotnext.one', '+15555550111', 'player'),
      ('Magic Johnson', 'mjohnson@gotnext.one', '+15555550112', 'player'),
      ('Larry Bird', 'lbird@gotnext.one', '+15555550113', 'player'),
      ('Charles Barkley', 'cbarkley@gotnext.one', '+15555550114', 'player'),
      ('Karl Malone', 'kmalone@gotnext.one', '+15555550115', 'player'),
      ('John Stockton', 'jstockton@gotnext.one', '+15555550116', 'player'),
      ('Patrick Ewing', 'pewing@gotnext.one', '+15555550117', 'player'),
      ('Scottie Pippen', 'spippen@gotnext.one', '+15555550118', 'player'),
      ('David Robinson', 'drobinson@gotnext.one', '+15555550119', 'player'),
      ('Clyde Drexler', 'cdrexler@gotnext.one', '+15555550120', 'player'),
      ('Chris Mullin', 'cmullin@gotnext.one', '+15555550121', 'player'),
      ('Fransisco Elson', 'felson@gotnext.one', '+15555550122', 'player')
  ) AS t(full_name, email, phone, role)
),

-- Upsert users by email; keep existing accounts but refresh metadata + confirmation
upserted_user AS (
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
    crypt('TestPass123!', gen_salt('bf')),
    timezone('utc', now()),
    timezone('utc', now()),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', full_name, 'phone', phone),
    'authenticated',
    'authenticated',
    timezone('utc', now()),
    timezone('utc', now())
  FROM tester_seed
  ON CONFLICT (email) DO UPDATE
    SET
      -- do not change id; keep existing account
      encrypted_password   = EXCLUDED.encrypted_password,
      raw_user_meta_data   = EXCLUDED.raw_user_meta_data,
      raw_app_meta_data    = EXCLUDED.raw_app_meta_data,
      updated_at           = timezone('utc', now()),
      -- make sure email is confirmed for testers
      email_confirmed_at   = COALESCE(auth.users.email_confirmed_at, timezone('utc', now())),
      last_sign_in_at      = timezone('utc', now()),
      aud                  = EXCLUDED.aud,
      role                 = EXCLUDED.role
  RETURNING id, email, raw_user_meta_data
),

-- Ensure identities exist (idempotent)
inserted_identity AS (
  INSERT INTO auth.identities (
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    u.id,
    jsonb_build_object(
      'sub', u.id::text,
      'email', u.email,
      'email_verified', true,
      'phone_verified', false,
      'provider_id', u.email
    ),
    'email',
    u.email,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  FROM upserted_user u
  ON CONFLICT DO NOTHING
  RETURNING user_id
),

-- >>> Your fix, now applied in bulk to ALL tester emails <<<
cleared_tokens AS (
  UPDATE auth.users au
  SET
    confirmation_token     = '',
    email_change           = '',
    email_change_token_new = '',
    recovery_token         = ''
  WHERE au.email IN (SELECT email FROM tester_seed)
  RETURNING au.id
),

-- Upsert profiles
upserted_profile AS (
  INSERT INTO public.profiles (id, full_name, phone)
  SELECT
    u.id,
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'phone'
  FROM upserted_user u
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        phone     = EXCLUDED.phone
  RETURNING id
),

-- Create accepted invites if missing (keeps history tidy)
inserted_invite AS (
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
    ts.role::public.team_role,
    gen_random_uuid(),
    t.owner_id,
    timezone('utc', now()) + interval '7 days',
    timezone('utc', now()),
    u.id,
    timezone('utc', now())
  FROM upserted_user u
  JOIN tester_seed ts ON ts.email = u.email
  JOIN public.teams t ON lower(t.name) = 'hoopers'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.team_invites ti
    WHERE ti.team_id = t.id
      AND ti.accepted_user_id = u.id
  )
  RETURNING id, accepted_user_id, role
)

-- Ensure team membership (idempotent)
INSERT INTO public.team_members (team_id, user_id, role, invited_by)
SELECT
  t.id,
  u.id,
  ts.role::public.team_role,
  t.owner_id
FROM upserted_user u
JOIN tester_seed ts ON ts.email = u.email
JOIN public.teams t ON lower(t.name) = 'hoopers'
ON CONFLICT (team_id, user_id) DO NOTHING;

COMMIT;