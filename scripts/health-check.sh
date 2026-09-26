#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
docker compose exec -T app node -e "fetch('http://127.0.0.1:8080/health').then(async r=>{const j=await r.json();console.log(JSON.stringify(j));process.exit(r.ok&&j.database==='connected'?0:1)}).catch(()=>process.exit(1))"
