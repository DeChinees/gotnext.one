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
