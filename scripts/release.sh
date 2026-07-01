#!/usr/bin/env bash
#
# Build, tag (:latest + :<git-sha>), compress, ship, and run share-net on the
# Proxmox host. Run from your dev machine: `pnpm release`.
#
# First-time setup on the server (once): create the folder and place the env
# file. Release ships the compose file, the Caddyfile and the image, but NEVER
# the secrets:
#   ssh user@host 'mkdir -p share-net'
#   scp .env user@host:share-net/.env     # set DATA_DIR to a real folder on the server
#
set -euo pipefail

# --- config (override via env) ----------------------------------------------
REMOTE="${REMOTE:-share-net@192.168.15.39}"   # same Proxmox host as luna; override as needed
REMOTE_DIR="${REMOTE_DIR:-share-net}"           # path on the server (relative to login home, or absolute)
KEEP_VERSIONS="${KEEP_VERSIONS:-3}"             # how many :<sha> images to keep on the server for rollback
ARCHIVE="${ARCHIVE:-/tmp/share-net-image.tar.gz}"
IMAGES=(share-net)                              # caddy is pulled on the server

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# --- derive version tag ------------------------------------------------------
if git rev-parse --short HEAD >/dev/null 2>&1; then
  SHA="$(git rev-parse --short HEAD)"
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "WARNING: working tree has uncommitted changes - tagging as ${SHA}-dirty"
    SHA="${SHA}-dirty"
  fi
else
  SHA="$(date +%Y%m%d-%H%M%S)"
  echo "WARNING: not a git repo - using timestamp version ${SHA}"
fi
echo "> releasing version: ${SHA}"

# --- 1. build ----------------------------------------------------------------
echo "> building image..."
docker compose -f docker-compose.yml build

# --- 2. tag ------------------------------------------------------------------
echo "> tagging image :${SHA}"
for img in "${IMAGES[@]}"; do
  docker tag "${img}:latest" "${img}:${SHA}"
done

# --- 3. save + compress ------------------------------------------------------
echo "> saving + compressing -> ${ARCHIVE}"
save_tags=()
for img in "${IMAGES[@]}"; do
  save_tags+=("${img}:latest" "${img}:${SHA}")
done
docker save "${save_tags[@]}" | gzip > "${ARCHIVE}"
echo "  archive size: $(du -h "${ARCHIVE}" | cut -f1)"

# --- 4. ship -----------------------------------------------------------------
echo "> shipping to ${REMOTE}:${REMOTE_DIR}"
ssh "${REMOTE}" "mkdir -p ${REMOTE_DIR}"
scp "${ARCHIVE}" docker-compose.yml Caddyfile "${REMOTE}:${REMOTE_DIR}/"

# --- 5. load + run + prune + health (inline on remote) -----------------------
echo "> loading + starting on remote..."
ssh "${REMOTE}" "bash -s" "${REMOTE_DIR}" "$(basename "${ARCHIVE}")" "${KEEP_VERSIONS}" "${IMAGES[@]}" <<'REMOTE_SCRIPT'
set -euo pipefail
REMOTE_DIR="$1"; ARCHIVE="$2"; KEEP="$3"; shift 3; IMAGES=("$@")
cd "$REMOTE_DIR"

[ -f .env ] || { echo "x ${REMOTE_DIR}/.env missing on server - copy .env there once (see release.sh header)"; exit 1; }

gunzip -c "$ARCHIVE" | docker load
docker compose up -d
rm -f "$ARCHIVE"

# Retain the newest $KEEP :<sha> images per repo (docker lists newest first);
# :latest is always kept.
for img in "${IMAGES[@]}"; do
  docker images "$img" --format '{{.Tag}}' \
    | grep -vx 'latest' \
    | tail -n +"$((KEEP + 1))" \
    | while read -r tag; do docker rmi "$img:$tag" >/dev/null 2>&1 || true; done
done
docker image prune -f >/dev/null

# Wait for share-net to report healthy (90s budget).
echo "waiting for share-net health..."
st=starting
for _ in $(seq 1 18); do
  cid="$(docker compose ps -q share-net)"
  st="$(docker inspect -f '{{.State.Health.Status}}' "$cid" 2>/dev/null || echo starting)"
  [ "$st" = healthy ] && break
  sleep 5
done
if [ "$st" = healthy ]; then
  echo "ok: share-net healthy"
else
  echo "WARNING: share-net not healthy (status: ${st}) - recent logs:"
  docker compose logs --tail=30 share-net || true
  exit 1
fi
REMOTE_SCRIPT

echo "ok: released ${SHA} to ${REMOTE}"
