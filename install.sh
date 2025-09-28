#!/usr/bin/env bash
set -euo pipefail

# ===== Config =====
NODE_VERSION="v20.16.0"
PNPM_VERSION="9.10.0"
APP_NAME="gotnext"
BAILEYS_IMAGE="ghcr.io/pointersoftware/baileys-2025-rest-api:latest"
USE_DOCKER="${1:-""}"

say() { printf "\033[1;32m==>\033[0m %s\n" "$*"; }
die() { printf "\033[1;31mERROR:\033[0m %s\n" "$*"; exit 1; }

# ===== Preflight =====
command -v git >/dev/null || die "git is required"
if [[ "$USE_DOCKER" == "--docker" ]]; then
  command -v docker >/dev/null || die "Docker is required for --docker mode"
fi
[[ -d "$APP_NAME" ]] && die "Directory '$APP_NAME' already exists"

# ===== Repo scaffold =====
say "Creating repo: $APP_NAME"
mkdir -p "$APP_NAME"/{services/baileys,data,packages/shared,.github/workflows,supabase/migrations}
cd "$APP_NAME"
WEB_DIR="web"   # relative to project root

git init -q

# Node version + npm config
echo "$NODE_VERSION" > .nvmrc
cat > .npmrc <<'EOF'
ignore-scripts=true
fund=false
audit-level=high
EOF

# .gitignore
cat > .gitignore <<'EOF'
node_modules
.next
.env*
data/
services/baileys/data/
web/.next/
pnpm-lock.yaml
EOF

# CI workflow
cat > .github/workflows/ci.yaml <<'EOF'
name: ci
on:
  push: { branches: ["main"] }
  pull_request:
jobs:
  web-build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
      - run: corepack enable
      - run: corepack prepare pnpm@9.10.0 --activate
      - run: pnpm install --frozen-lockfile --config.ignore-scripts=true
      - run: pnpm run build
EOF

# Docker compose (web dev container + Baileys)
cat > docker-compose.yml <<EOF
services:
  web:
    image: node:20.16-bookworm
    working_dir: /app
    command: bash -lc "corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate && pnpm dev"
    ports: [ "3000:3000" ]
    volumes:
      - ./web:/app
      - ./data/.pnpm-store:/root/.local/share/pnpm/store
    environment:
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
  baileys:
    image: ${BAILEYS_IMAGE}
    environment:
      SERVER_PORT: 3001
      SESSION_FOLDER: /data/session
    ports: [ "3001:3001" ]
    volumes:
      - ./services/baileys/data:/data
EOF

# Supabase migration placeholder
if [[ ! -f supabase/migrations/0001_init_schema.sql ]]; then
  cat > supabase/migrations/0001_init_schema.sql <<'EOF'
-- Paste the GotNext schema + RLS SQL here or keep as placeholder.
EOF
fi

# ===== Create Next.js app =====
say "Scaffolding Next.js (TS, Tailwind, App Router)…"
if [[ "$USE_DOCKER" == "--docker" ]]; then
  docker run --rm -e CI=1 -it -v "$PWD":/ws -w /ws node:20.16-bookworm bash -lc "
    set -e
    corepack enable
    corepack prepare pnpm@${PNPM_VERSION} --activate
    pnpm dlx create-next-app@latest ${WEB_DIR} \
      --ts --eslint --tailwind --src-dir --app --import-alias '@/*' --no-experimental-app
  "
else
  command -v node >/dev/null || die "Node is required (recommend $NODE_VERSION via nvm/asdf)."
  export CI=1
  corepack enable
  corepack prepare pnpm@"${PNPM_VERSION}" --activate
  pnpm dlx create-next-app@latest "${WEB_DIR}" \
    --ts --eslint --tailwind --src-dir --app --import-alias "@/*" --no-experimental-app
fi

# ===== Pin packageManager (path-safe) =====
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('${WEB_DIR}/package.json','utf8'));p.packageManager='pnpm@${PNPM_VERSION}';fs.writeFileSync('${WEB_DIR}/package.json',JSON.stringify(p,null,2));console.log('Pinned packageManager to pnpm@${PNPM_VERSION}')"

# ===== Add minimal deps + safe npm config + env template + homepage =====
(
  cd "${WEB_DIR}"
  corepack enable && corepack prepare pnpm@"${PNPM_VERSION}" --activate
  pnpm install --frozen-lockfile --config.ignore-scripts=true
  pnpm add @tanstack/react-query zod date-fns @supabase/supabase-js @supabase/ssr resend
  pnpm add -D @types/node @types/react @types/react-dom

  # Local npm safety
  cat > .npmrc <<'EOF'
ignore-scripts=true
fund=false
audit-level=high
EOF

  # Env template
  cat > .env.local.example <<'EOF'
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=__set_me__
SUPABASE_SERVICE_ROLE_KEY=__set_me__   # server-only
EMAIL_FROM="GotNext <noreply@example.test>"
EMAIL_PROVIDER=postmark
POSTMARK_API_TOKEN=__set_me__
EOF
  cp -n .env.local.example .env.local || true

  # Simple homepage at /
  mkdir -p src/app
  cat > src/app/page.tsx <<'EOF'
export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">GotNext</h1>
      <p className="mt-2 text-sm text-gray-600">
        Next.js scaffold ready. Hook up Supabase, RSVP API, and Baileys webhooks.
      </p>
      <ul className="mt-4 list-disc pl-5 text-sm">
        <li>Dev: http://localhost:3000</li>
        <li>Baileys: http://localhost:3001 (scan QR once)</li>
      </ul>
    </main>
  );
}
EOF
)

# ===== Dev helper =====
cat > dev.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == "--docker" ]]; then
  docker compose up
else
  (cd web && corepack enable && corepack prepare pnpm@9.10.0 --activate && pnpm install --frozen-lockfile --config.ignore-scripts=true && pnpm dev)
fi
EOF
chmod +x dev.sh

say "Done."
if [[ "$USE_DOCKER" == "--docker" ]]; then
  say "Run: ./dev.sh --docker"
  say "Then open http://localhost:3000 and http://localhost:3001 (scan QR once)."
else
  say "Run: ./dev.sh"
  say "For Baileys sidecar: docker compose up baileys"
fi