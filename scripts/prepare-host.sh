#!/usr/bin/env bash
set -euo pipefail
[[ "${EUID}" -eq 0 ]] || { echo "Run as root." >&2; exit 1; }
# Inspect existing path components before creating or changing ownership.
for target in /opt /opt/northstar /opt/northstar/uploads /opt/northstar/quarantine /var /var/log /var/log/northstar; do
  [[ ! -L "$target" ]] || { echo "Refusing symlink in host path" >&2; exit 1; }
  if [[ -e "$target" ]]; then [[ -d "$target" && "$(realpath -e -- "$target")" == "$target" ]] || exit 1; fi
done
install -d -m 0750 -o 1001 -g 1001 /opt/northstar/uploads /opt/northstar/quarantine /var/log/northstar
echo "Prepared fixed Northstar directories for UID/GID 1001."
