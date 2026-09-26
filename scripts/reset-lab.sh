#!/usr/bin/env bash
set -euo pipefail
[[ "${EUID}" -eq 0 ]] || { echo "Reset requires root." >&2; exit 1; }
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
source scripts/host-paths.sh
# Every path is verified BEFORE any stack or data mutation.
verify_emptyable_path /opt/northstar/uploads
verify_emptyable_path /opt/northstar/quarantine
verify_northstar_path /var/log/northstar
docker compose stop app
docker compose up -d db --wait
docker compose run --rm --no-deps -e NORTHSTAR_RESET_CONFIRMED=yes --entrypoint ./node_modules/.bin/tsx app scripts/reset-db.ts
# Revalidate after the stack is stopped. No recursive deletion, glob or symlink following.
for target in /opt/northstar/uploads /opt/northstar/quarantine; do
  verify_emptyable_path "$target"
  find "$target" -maxdepth 1 -type f -delete
  find "$target" -maxdepth 1 -type l -delete
done
# Keep JSON security logs intact for the instructor's audit trail.
docker compose up -d --wait --wait-timeout 180
bash scripts/health-check.sh
docker compose exec -T app ./node_modules/.bin/tsx scripts/record-reset.ts
echo "Reset complete. Existing host security logs retained."
