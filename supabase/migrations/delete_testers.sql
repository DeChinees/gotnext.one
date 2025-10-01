-- Remove the named tester accounts inserted by add_testers.sql
BEGIN;

WITH target_emails AS (
  SELECT email
  FROM (VALUES
    ('Robertotsang@hotmail.com'),
    ('groteJeff@gotnext.one'),
    ('johnsmith@example.com'),
    ('mjordan@gotnext.one'),
    ('mjohnson@gotnext.one'),
    ('lbird@gotnext.one'),
    ('cbarkley@gotnext.one'),
    ('kmalone@gotnext.one'),
    ('jstockton@gotnext.one'),
    ('pewing@gotnext.one'),
    ('spippen@gotnext.one'),
    ('drobinson@gotnext.one'),
    ('cdrexler@gotnext.one'),
    ('cmullin@gotnext.one'),
    ('felson@gotnext.one')
  ) AS t(email)
),
target_users AS (
  SELECT u.id, u.email
  FROM auth.users u
  JOIN target_emails te ON lower(u.email) = lower(te.email)
),
deleted_invites AS (
  DELETE FROM public.team_invites ti
  WHERE ti.accepted_user_id IN (SELECT id FROM target_users)
     OR lower(ti.email) IN (SELECT lower(email) FROM target_emails)
  RETURNING ti.id
),
deleted_users AS (
  DELETE FROM auth.users
  WHERE id IN (SELECT id FROM target_users)
  RETURNING id
)
SELECT
  (SELECT count(*) FROM deleted_invites) AS invites_removed,
  (SELECT count(*) FROM deleted_users) AS users_removed;

COMMIT;
