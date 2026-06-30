#!/usr/bin/env bash
#
# Roll the running share-net back to a previously shipped image version.
#   pnpm rollback           # list the :<sha> versions available on the server
#   pnpm rollback <sha>     # retag <sha> -> latest and restart
#
# Swaps the app image only; the vault files and the caddy certs are untouched.
#
set -euo pipefail

# --- config (override via env) ----------------------------------------------
REMOTE="${REMOTE:-luna-server@192.168.15.38}"
REMOTE_DIR="${REMOTE_DIR:-share-net}"
IMAGES=(share-net)

sha="${1:-}"

if [ -z "${sha}" ]; then
  echo "available versions on ${REMOTE} (newest first):"
  ssh "${REMOTE}" "docker images share-net --format '{{.Tag}}'" | grep -vx 'latest' || true
  echo
  echo "usage: pnpm rollback <sha>"
  exit 0
fi

echo "> rolling back to ${sha}..."
ssh "${REMOTE}" "bash -s" "${REMOTE_DIR}" "${sha}" "${IMAGES[@]}" <<'REMOTE_SCRIPT'
set -euo pipefail
REMOTE_DIR="$1"; SHA="$2"; shift 2; IMAGES=("$@")
cd "$REMOTE_DIR"
for img in "${IMAGES[@]}"; do
  docker image inspect "$img:$SHA" >/dev/null 2>&1 \
    || { echo "x $img:$SHA not found on server"; exit 1; }
done
for img in "${IMAGES[@]}"; do
  docker tag "$img:$SHA" "$img:latest"
done
docker compose up -d
REMOTE_SCRIPT

echo "ok: rolled back to ${sha}"
