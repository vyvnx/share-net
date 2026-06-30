#!/usr/bin/env bash
#
# Back up share-net's persistent state from the server to ./backups/.
# Run from your dev machine: `pnpm backup`.
#
# share-net has no database. The only docker-owned state is the caddy_data
# volume (the TLS internal CA + issued certs) - this is what gets backed up by
# default, so you don't have to re-trust a regenerated CA on every device.
#
# The vault FILES live in your DATA_DIR host folder (a bind mount), which you
# back up at the host level (e.g. ZFS snapshots). Set BACKUP_DATA=1 to also
# stream /data here - WARNING: this can be very large.
#
# Restore (manual) - certs, then restart caddy:
#   gunzip -c backups/share-net-caddy-<ts>.tgz | ssh user@host \
#     'cd share-net && docker compose exec -T caddy tar -C /data -xzf -'
#   ssh user@host 'cd share-net && docker compose restart caddy'
#
set -euo pipefail

# --- config (override via env) ----------------------------------------------
REMOTE="${REMOTE:-luna-server@192.168.15.38}"
REMOTE_DIR="${REMOTE_DIR:-share-net}"
BACKUP_DATA="${BACKUP_DATA:-0}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p backups
ts="$(date +%Y%m%d-%H%M%S)"

echo "> backing up caddy CA + certs from ${REMOTE}"
out="backups/share-net-caddy-${ts}.tgz"
ssh "${REMOTE}" "cd ${REMOTE_DIR} && docker compose exec -T caddy tar -C /data -czf - ." > "${out}"
[ -s "${out}" ] || { echo "x caddy backup is empty - check the server"; rm -f "${out}"; exit 1; }
echo "  ${out} ($(du -h "${out}" | cut -f1))"

if [ "${BACKUP_DATA}" = "1" ]; then
  echo "> backing up vault data (/data) - this can be large..."
  outd="backups/share-net-data-${ts}.tgz"
  ssh "${REMOTE}" "cd ${REMOTE_DIR} && docker compose exec -T share-net tar -C /data -czf - ." > "${outd}"
  [ -s "${outd}" ] || { echo "x data backup is empty"; rm -f "${outd}"; exit 1; }
  echo "  ${outd} ($(du -h "${outd}" | cut -f1))"
fi

echo "ok: backup complete"
