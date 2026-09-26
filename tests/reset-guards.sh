#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
source scripts/host-paths.sh
for candidate in / /tmp /opt /opt/northstar /opt/northstar/uploads/../quarantine /var/log/northstar/security.json /opt/northstar/uploads/; do
  if verify_northstar_path "$candidate" 2>/dev/null; then echo "FAIL: accepted an unexpected path"; exit 1; fi
done
if verify_emptyable_path /var/log/northstar 2>/dev/null; then echo "FAIL: audit directory accepted for deletion"; exit 1; fi
echo "PASS: reset refuses unresolved, broad, non-allowlisted and audit-log targets."
