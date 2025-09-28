# GotNext Supabase Magic-Link Demo

Minimal Next.js App Router project showing only the files required for a Supabase email magic-link flow.

## Setup

1. Copy `.env.local.example` to `.env.local` and confirm the Supabase values (update `NEXT_PUBLIC_APP_URL`/`NEXT_PUBLIC_SITE_URL` if your dev URL differs).
2. Install dependencies and start dev server:

```bash
npm install
npm run dev
```

3. Open `http://localhost:3000/signin`, submit your email, then open the magic link in the same browser.

## Routes

- `/signin` – enter email, request magic link, see inline errors.
- `/auth/callback` – exchanges the Supabase PKCE code and redirects to `/welcome`.
- `/welcome` – protected page showing Supabase profile details and a sign-out button.

All Supabase helpers live in `lib/supabase/`.
