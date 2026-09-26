#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
source scripts/host-paths.sh
for target in /opt/northstar/uploads /opt/northstar/quarantine /var/log/northstar; do
  verify_northstar_path "$target"
done
[[ -w /opt/northstar/uploads && -w /var/log/northstar ]] || { echo "Directories are not writable by this operator" >&2; exit 1; }
echo "Northstar host paths verified."
