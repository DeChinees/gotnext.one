# GotNext.one

Invite-only pickup basketball manager. GotNext keeps your crew organised with private teams, invite-based onboarding, RSVP caps with waitlists, and rotating trash-talk that keeps the dashboard lively.

## Features
- **Team management** – Owners and admins create teams, promote organisers, and invite hoopers privately.
- **Session scheduling** – Upcoming runs appear automatically with roster counts, waitlists, and real-time RSVP status.
- **Player self-service** – Every hooper controls their profile, signs in from the landing page, and sees random hype lines each visit.
- **Admin tooling** – Dashboard users can rename teams, manage invites, promote/demote or remove players, and watch rotating team taglines.
- **Supabase auth & data** – All users, profiles, sessions, and RSVP flows live in Supabase with row-level security.

## Tech stack
- [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- [React 19](https://react.dev/) with suspense/`useTransition`
- [Supabase](https://supabase.com/) for auth, database, RPC
- Vanilla CSS-in-JS via inline styles for rapid MVP iteration

## Prerequisites
- **Node.js 20** (use `nvm use 20` or install from nodejs.org)
- **npm** (ships with Node)
- A **Supabase project** (free tier is fine) with service role & anon keys
- Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) for managing migrations locally

## Quick start
1. **Clone the repo**
   ```bash
   git clone https://github.com/your-org/gotnext.one.git
   cd gotnext.one
   ```

2. **Install dependencies & scaffold env files**
   ```bash
   ./install.sh
   ```
   The script:
   - verifies Node ≥20
   - runs `npm ci` inside `gotnext/`
   - creates `gotnext/.env.local` (from `.env.local.example`)

3. **Configure Supabase**
   - Create a project in Supabase.
   - In Supabase Studio → SQL editor, run each file in `gotnext/supabase/migrations/` to create tables, functions, and RLS policies. (With the Supabase CLI you can also run `supabase db push`.)
   - Update `gotnext/.env.local` with:
     ```env
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
     SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
     ```

4. **Run the dev server**
   ```bash
   cd gotnext
   npm run dev
   ```
   Then open [`http://localhost:3000`](http://localhost:3000).

## Available npm scripts
Inside `gotnext/`:
- `npm run dev` – start Next.js in development mode
- `npm run build` – production build
- `npm run start` – run the compiled build

## Environment variables
All runtime configuration lives in `gotnext/.env.local`:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Base URL for links and redirects. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase REST endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key used by the browser client. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key used by server actions (rename team, etc.). Keep this private. |

## Project structure
```
.
├── install.sh                   # one-shot setup helper
├── gotnext/
│   ├── app/                     # Next.js App Router pages & components
│   ├── lib/                     # Supabase helpers, tagline pool, etc.
│   ├── public/                  # Logos, favicons, PWA icons
│   ├── supabase/migrations/     # SQL schema & policies
│   └── package.json             # Next.js app manifest
└── README.md
```

## Supabase migrations
The SQL files under `gotnext/supabase/migrations/` contain the full schema: teams, members, sessions, signups, invites, and helper functions. Apply them in order via Supabase Studio or the CLI. Whenever you edit the database, create a new migration SQL file to keep environments in sync.

## Contributing / next steps
- Flesh out email + WhatsApp notifications (hooks are ready in Supabase RPC).
- Add automated tests (Playwright / Vitest) and linting workflows.
- Harden the RSVP flow for mobile with responsive UI components.

GotNext is built by hoopers, for hoopers—PRs welcome.
