# GotNext — Starter

This bundle sets up a clean Next.js (App Router, TS, Tailwind) project with:
- **No global npm installs** (Corepack + pinned pnpm)
- **Dockerized dev** option (no Node on host)
- **Baileys-2025-Rest-API** sidecar on :3001
- **Supabase** ready (schema + RLS via SQL migration file)

## Quickstart

1) Unzip and `cd gotnext`
2) (Recommended) Dockerized dev:
   ```bash
   bash install.sh --docker
   ```
   Then open:
   - Web: http://localhost:3000
   - Baileys: http://localhost:3001 (scan QR once with a dedicated WhatsApp number)

   If you prefer host dev (no Docker for web):
   ```bash
   bash install.sh
   ./dev.sh
   ```
   And (optional) run Baileys in Docker:
   ```bash
   docker compose up baileys
   ```

3) Supabase
   - Create a Supabase project (free tier is fine)
   - In Supabase Studio → SQL Editor → paste the contents of `supabase/migrations/0001_init_schema.sql` (or use Supabase CLI migrations)
   - Add env vars to `web/.env.local` after the install (examples printed by the installer)

4) Next steps
   - Wire Supabase Auth (magic link)
   - Implement `/api/rsvp` with capacity + waitlist + promo logic
   - Configure email provider (Postmark/Resend)
   - Connect WhatsApp DM triggers via Baileys REST

## What GotNext should do

GotNext is the ad-free alternative to Teamy, built for your core basketball crew but adaptable to any pickup group. The application should:

- **Manage teams and groups**
  - Signed-in users can create teams and assign roles (owner, admin, player)
  - Team owners invite players privately; sign-ups stay closed to the public
  - Users join teams only via an invite; responding to an invite prompts sign-up for newcomers or sign-in for existing accounts and auto-adds them to the team
- **User accounts**
  - Every user can edit their own profile details
  - Profiles always include name, password, email, and phone number with an international code (e.g., +31, +32)
- **Schedule events**
  - Create games or sessions with date, time, location, notes, and capacity
  - Offer optional repeats every week or on a custom cadence
- **Handle RSVPs smoothly**
  - Let players mark themselves as Going, Maybe, or Out
  - Enforce capacity limits and RSVP deadlines
  - Maintain a waitlist with auto-promotions when slots open
- **Notify players**
  - Send updates via email and WhatsApp (through the Baileys REST API)
  - Notify players when they are confirmed, waitlisted, promoted, or dropped
- **Respect privacy and usability**
  - Keep teams invite-only and hidden from search
  - Remain GDPR-compliant by avoiding unnecessary data storage
  - Deliver a lightweight, mobile-friendly PWA experience

## Repo layout (after install)
```
gotnext/
  .github/workflows/ci.yaml
  .nvmrc
  .npmrc
  docker-compose.yml
  dev.sh
  services/baileys/data/         # persists WhatsApp session
  web/                            # Next.js app (created by installer)
  supabase/
    migrations/
      0001_init_schema.sql
```
