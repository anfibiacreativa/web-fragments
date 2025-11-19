#!/usr/bin/env bash
set -euo pipefail

if ! command -v pnpm >/dev/null 2>&1; then
  printf 'pnpm is required on your PATH.\n' >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
  printf '[restart] %s\n' "$*"
}

kill_by_pattern() {
  for pattern in "$@"; do
    if pkill -f "$pattern" >/dev/null 2>&1; then
      log "Stopped processes matching '$pattern'"
    fi
  done
}

kill_by_port() {
  if ! command -v lsof >/dev/null 2>&1; then
    log "Skipping port cleanup because lsof is missing"
    return
  fi

  for port in "$@"; do
    local pids
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      log "Stopping processes bound to port $port"
      for pid in $pids; do
        if kill -0 "$pid" >/dev/null 2>&1; then
          kill "$pid" >/dev/null 2>&1 || true
          sleep 0.5
          if kill -0 "$pid" >/dev/null 2>&1; then
            kill -9 "$pid" >/dev/null 2>&1 || true
          fi
        fi
      done
    fi
  done
}

PORTS_TO_CLEAR=(3000 3005 4182 5173 5174 8123)
PATTERNS_TO_KILL=(
  "remix-serve"
  "remix vite:dev"
  "pierced-react___remix-fragment buildAndServe"
  "pierced-react___qwik-fragment buildAndServe"
  "vite preview --port 4182"
  "sw-vite-test/server.js"
  "wrangler pages"
)

log "Shutting down existing fragment processes"
kill_by_pattern "${PATTERNS_TO_KILL[@]}"
kill_by_port "${PORTS_TO_CLEAR[@]}"

sleep 1


PIDS=()
LABELS=()

start_process() {
  local label="$1"
  local dir="$2"
  shift 2

  log "Starting $label"
  (
    cd "$dir"
    exec "$@"
  ) &

  local pid=$!
  PIDS+=("$pid")
  LABELS+=("$label")
}

cleanup() {
  if [[ ${#PIDS[@]} -eq 0 ]]; then
    return
  fi

  log "Cleaning up started processes"
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
}

trap cleanup EXIT INT TERM

start_process "Qwik fragment dev (http://localhost:8123)" \
  "$ROOT_DIR/e2e/pierced-react/fragments/qwik" \
  pnpm buildAndServe

start_process "Remix fragment dev (http://localhost:3000)" \
  "$ROOT_DIR/e2e/pierced-react/fragments/remix" \
  pnpm buildAndServe

log "Building Service Worker..."
(cd "$ROOT_DIR/e2e/sw-vite-test" && pnpm build)

start_process "Service worker host (http://localhost:4182)" \
  "$ROOT_DIR/e2e/sw-vite-test" \
  env REMIX_TARGET=http://localhost:3000 QWIK_TARGET=http://localhost:8123 pnpm serve

log "Servers are up. Press Ctrl+C to stop everything."

for index in "${!PIDS[@]}"; do
  pid="${PIDS[$index]}"
  label="${LABELS[$index]}"
  if ! wait "$pid"; then
    status=$?
    log "$label exited with status $status"
    exit "$status"
  fi
done
