#!/usr/bin/env bash
set -euo pipefail
# Fixed allowlist. Reject symlink aliases, unexpected paths, nested mounts and subdirectories.
verify_northstar_path() {
  local target="$1"
  case "$target" in
    /opt/northstar/uploads|/opt/northstar/quarantine|/var/log/northstar) ;;
    *) echo "Refusing unexpected Northstar path" >&2; return 1 ;;
  esac
  [[ -d "$target" && ! -L "$target" ]] || { echo "Missing or symlinked Northstar directory" >&2; return 1; }
  [[ "$(realpath -e -- "$target")" == "$target" ]] || { echo "Resolved path differs from expected path" >&2; return 1; }
}
verify_emptyable_path() {
  local target="$1"
  case "$target" in /opt/northstar/uploads|/opt/northstar/quarantine) ;; *) return 1 ;; esac
  verify_northstar_path "$target"
  [[ -z "$(find "$target" -mindepth 1 -type d -print -quit)" ]] || { echo "Unexpected subdirectory; refusing reset" >&2; return 1; }
  [[ -z "$(find "$target" -mindepth 1 ! -type f ! -type l -print -quit)" ]] || { echo "Unexpected file type; refusing reset" >&2; return 1; }
}
