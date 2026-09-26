#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
bash scripts/verify-host-paths.sh
docker compose up -d --build --wait --wait-timeout 180
bash scripts/health-check.sh
