#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)
APP_DIR="$ROOT_DIR/gotnext"

if [[ ! -d "$APP_DIR" ]]; then
  echo "Could not find Next.js app at $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies locally (node_modules/)…"
  npm install
fi

echo "Starting Next.js dev server on http://localhost:3000"
npm run dev
