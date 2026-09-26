# Verification record

The repository was built and tested on Windows with Docker Desktop. The exact commands and observed results are recorded here. Production host preparation, AWS ingress, reset on Ubuntu and Wazuh enrollment need verification by the instructor on the assigned training host.

| Check | Command | Result |
| --- | --- | --- |
| Dependency installation | `npm install` | Completed; patched transitive overrides installed |
| Dependency audit | `npm audit --audit-level=high` | 0 vulnerabilities |
| PostgreSQL 17 | `docker compose -f compose.yaml -f compose.local.yaml up -d db` | Started |
| Migration | `npx prisma migrate deploy` | `202609260001_init` applied |
| Seed | `npm run db:seed` | Three fictional accounts seeded |
| Unit tests | `npm test` | 23 passed |
| TypeScript | `npm run typecheck` | Passed |
| Next production build | `npm run build` | Passed |
| Playwright core workflow | `npm run test:e2e`; `npx playwright test -g 'secured per-account and per-IP'` | Two core workflows and a separate per-account/per-IP source-IP test passed |
| Linux reset guard | PowerShell: `$taskRoot = (Get-Location).Path; docker run --rm --mount "type=bind,source=$taskRoot,target=/work,readonly" --workdir /work node:24-bookworm-slim bash tests/reset-guards.sh` | Passed |
| Healthy local Compose stack | `docker compose -f compose.yaml -f compose.local.yaml up -d --build --wait --wait-timeout 180 app`; then `docker compose -f compose.yaml -f compose.local.yaml up -d --wait --wait-timeout 180 app` | The initial rebuild wait reported unhealthy during a slow startup. The second check passed; both services were healthy and `/health` returned 200 with a connected database. |
| Docker production image | `docker compose -f compose.yaml -f compose.local.yaml build app` | Built |
| Public source review | `git add -A && node scripts/check-publication.mjs` | Passed: 85 staged files, no required secrets or generated data |
| Host bind mount | `docker compose -f compose.yaml -f compose.local.yaml exec -T app npm run lab:smoke` | Passed in local Compose with .local host bind sources; host file confirmed |
| Actual Hydra command | `node scripts/hydra-check.mjs` against the fixed Compose app service | Passed with a temporary three-entry synthetic wordlist; credential output redacted |
| Ubuntu reset/Wazuh | Instructor host checks in README | Not available on this Windows machine |

The supplied `tests/reset-guards.sh` asserts that the reset helper rejects broad and unexpected paths. The reset itself intentionally requires root and the exact Ubuntu paths. It must not be treated as proven safe by a Windows-only run.

All generated credentials are in ignored .env. Test artifacts, screenshots, container data and audit logs are ignored. The repository contains only an example env template with blank secret values.

The app is intentionally configured with LAB_MODE=vulnerable for the controlled exercise. It must remain restricted to a private authorised range.
