-- Remove the ten demo players inserted by players.sql
BEGIN;

WITH target_emails AS (
  SELECT format('player%02s@gotnext.one', gs) AS email
  FROM generate_series(1, 10) AS gs
),
matching_users AS (
  SELECT id
  FROM auth.users u
  JOIN target_emails e ON u.email = e.email
)
DELETE FROM auth.users
WHERE id IN (SELECT id FROM matching_users);

COMMIT;
