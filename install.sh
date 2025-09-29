#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/gotnext"

log() {
  printf '\033[1;34m==>\033[0m %s\n' "$*"
}

abort() {
  printf '\033[1;31mERROR:\033[0m %s\n' "$*"
  exit 1
}

require() {
  command -v "$1" >/dev/null 2>&1 || abort "Missing required command: $1"
}

log "Checking prerequisites"
require node
require npm

if [[ ! -d "$APP_DIR" ]]; then
  abort "Cannot find Next.js app directory at $APP_DIR"
fi

NODE_VERSION=$(node -p "process.versions.node")
if [[ ${NODE_VERSION%%.*} -lt 20 ]]; then
  abort "Node 20 or newer is required (detected $NODE_VERSION)"
fi

log "Installing dependencies with npm"
cd "$APP_DIR"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

if [[ ! -f .env.local.example ]]; then
  log "Creating .env.local.example"
  cat <<'ENVEOF' > .env.local.example
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
ENVEOF
fi

if [[ ! -f .env.local ]]; then
  log "Creating .env.local from template (edit it with your Supabase credentials)"
  cp .env.local.example .env.local
fi

log "Setup complete."
log "Next steps:"
cat <<'STEPS'
  1. Create or open your Supabase project.
  2. Apply the SQL in supabase/migrations/* via Supabase Studio or the Supabase CLI.
  3. Edit gotnext/.env.local with your Supabase URL and keys.
  4. Start the dev server:
       cd gotnext && npm run dev

For database work with the Supabase CLI:
  - npm install -g supabase (if you don't have it)
  - supabase db push     # apply migrations locally
STEPS
