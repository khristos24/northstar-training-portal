#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
bash scripts/verify-host-paths.sh
docker compose up -d --build
for ((attempt = 0; attempt < 60; attempt++)); do
  if bash scripts/health-check.sh >/dev/null 2>&1; then
    bash scripts/health-check.sh
    exit 0
  fi
  sleep 5
done
echo "Northstar did not become healthy within five minutes; inspect the app container." >&2
exit 1
