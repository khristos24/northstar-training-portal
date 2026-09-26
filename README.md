# Northstar Training Portal

A monochrome, resettable cybersecurity classroom application for the fictional **northstar.test** environment. This project implements the supplied HAVOC brief in the repository root.

**Authorised isolated training only. Never allow unrestricted public ingress. Use fictional credentials and harmless instructor-approved artifacts. Stop the environment after class.**

## Application

- Native `GET /login` and URL-encoded `POST /login` with exact fields `email` and `password`.
- Stable failed-credential text: **Invalid email or password** (HTTP 200 in the normal form flow; throttling returns 429).
- Protected dashboard, current-user activity, inert file upload and SHA-256 receipt.
- Server-side PostgreSQL sessions; logout and all-session revocation.
- Vulnerable and secured modes; real database-backed limits in secured mode.
- Separate app audit records and host-visible JSON lines for Wazuh.

The visual interface uses self-hosted fonts and monochrome CSS/SVG graphics. No remote image/font service or analytics is needed.

## Architecture

Browser / classroom tool → custom Node server → Next.js App Router → Prisma → PostgreSQL 17.

The Node entry point preserves the direct socket IP and internally dispatches POST /login and POST /upload to App Router handlers. GET routes remain normal Next.js pages. Do not replace `npm start` with `next start`: it would bypass the direct-IP and native POST dispatch integration. A custom server intentionally uses a complete production build instead of Next standalone output ([Next.js custom server documentation](https://nextjs.org/docs/app/guides/custom-server)).

Uploads: host `/opt/northstar/uploads` → container `/app/uploads`.
Audit: host `/var/log/northstar/security.json` → container `/app/logs/security.json`.
PostgreSQL: dedicated named volume `northstar-lab_postgres_data`; no published database port in production.

## Prerequisites and AWS boundaries

Use an Ubuntu training host with Docker Engine and Compose v2, Bash, realpath and find. Use Node 24 and npm for local development, or generate the env file with Node before copying the project to the host. Suggested starting capacity: 2 vCPU, 4 GB RAM and 20 GB disk; build with more memory if necessary. Size Wazuh separately. Runtime resource caps are in compose.yaml.

Assign a private address and restrict the AWS security group to the classroom/VPN subnet on TCP 8080. Restrict SSH to instructor administration addresses. Do not expose 5432. Never add 0.0.0.0/0 or ::/0 application ingress. Compose binds localhost by default; change HOST_BIND_IP only to the assigned private interface. If TLS is used, terminate it at an instructor-controlled proxy.

## Prepare and deploy on Ubuntu

```bash
# From this repository:
cp .env.example .env
chmod 600 .env
# Edit .env locally. Supply all five secrets before continuing.
sudo bash scripts/prepare-host.sh
sudo bash scripts/verify-host-paths.sh
docker compose up -d --build --wait --wait-timeout 180
bash scripts/health-check.sh
```

Alternatively, `npm run lab:init` creates .env with unique random lab-only values and refuses to overwrite an existing file. Credentials are never printed. Review and configure the finance password locally before class.

Required: FINANCE_SEED_PASSWORD, EMPLOYEE_SEED_PASSWORD, ADMIN_SEED_PASSWORD, SESSION_SECRET (at least 32 characters), POSTGRES_PASSWORD (at least 16 characters). Seed passwords must be 1–72 bytes because bcrypt has a 72-byte limit. Startup errors identify missing/invalid variable names without echoing their values.

Set APP_ORIGIN to the exact browser origin, e.g. `http://<assigned-private-ip>:8080`. Set HOST_BIND_IP to that private host address. Configure LAB_MODE=vulnerable for the exercise or secured for the mitigation comparison. Keep .env out of source control. Do not define DATABASE_URL when using the provided Compose database; host/port are set by Compose.

Container startup validates configuration, deploys committed migrations and seeds the three accounts only when the lab is first initialized. The finance, employee and admin accounts use the corresponding seed variables. Bcrypt salts vary, but the resulting account identities and roles are deterministic.

```bash
docker compose exec -T app npm run db:migrate
docker compose exec -T app npm run db:seed
```

Explicit reseeding updates account passwords/unlocks accounts. If rotating passwords after class, use the complete reset to revoke existing sessions too. Changing POSTGRES_PASSWORD in .env does not change an already-initialized PostgreSQL role; use a planned database password rotation or a fresh dedicated lab volume.

## Modes and sessions

Vulnerable mode has no login throttling, lockout, MFA or CAPTCHA. The instructor alone selects the intentionally weak classroom password. Do not reuse personal passwords.

Secured mode adds per-IP (30 attempts / 15 minutes), per-account (8 attempts / 15 minutes), and account lockout (5 failed passwords → 15 minutes). Counters are stored in PostgreSQL and serialized across processes. All requests count toward the rate windows, including successful and throttled requests. Secured uploads accept UTF-8 .txt only, reject binary controls and block the EICAR teaching marker.

Session cookies are HttpOnly, SameSite=Lax and Secure when HTTPS_ENABLED=true. Session records store HMAC digests, never raw cookie tokens, and expire after SESSION_HOURS (8 by default). The dashboard offers all-session revocation. Logout, revocation and upload require a session-bound CSRF token.

## Source IP and trusted TLS proxy

Leave TRUST_PROXY=false for direct access. The custom server ignores supplied forwarding headers and overwrites its internal source-IP header.

To deploy behind a trusted proxy, set TRUST_PROXY=true, list exact proxy socket addresses in TRUSTED_PROXY_IPS, restrict application network ingress to those proxies, set APP_ORIGIN to the external HTTPS origin and HTTPS_ENABLED=true. The proxy must overwrite (not append) X-Forwarded-For with exactly one client address. Example Nginx location directives in your existing instructor-managed TLS server:

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto https;
    client_max_body_size 2m;
}
```

No Nginx service is bundled. Do not trust proxy headers from arbitrary peers. For container NAT, verify the actual proxy socket address observed by the server before setting the allowlist.

## Uploads and monitoring

Default maximum file size is 1 MB; MAX_UPLOAD_BYTES supports up to 10 MB. The request body is also bounded. Names with traversal, absolute paths or hidden basenames are rejected; harmless directory prefixes are discarded. The stored name is a new UUID with .artifact extension. Files are created exclusively, hashed while writing and never executed, served, previewed or placed in public/.

The receipt includes the original name, stored name, UUID, byte size, SHA-256 and UTC timestamp. The same metadata accompanies the upload audit event.

Enroll the host's Wazuh agent using your own manager address and enrollment secret: **[INSTRUCTOR ENROLLMENT PLACEHOLDER]**. Follow [wazuh/README.md](wazuh/README.md) to merge agent FIM/localfile configuration, manager rules, example decoder and reviewed YARA rule. The instructor must verify the [current official Wazuh integration](https://documentation.wazuh.com/current/user-manual/capabilities/malware-detection/fim-yara.html) against their installed version. No community rules, malware or monitoring changes are downloaded/applied automatically.

## Controlled compatibility check

For an instructor-approved PRIVATE target and sanitized fictional wordlist only:

```bash
hydra \
  -l finance@northstar.test \
  -P harvested-passwords.txt \
  -t 1 -W 2 -f -V \
  TARGET_PRIVATE_IP \
  http-post-form \
  '/login:email=^USER^&password=^PASS^:F=Invalid email or password' \
  -s 8080
```

Place the instructor-configured FINANCE_SEED_PASSWORD in the sanitized classroom list. Do not collect or test real passwords. The app does not implement or distribute a credential-collection tool. Secured mode intentionally disrupts automated guessing.

## Tests and local development

```bash
npm ci
npm run lab:init
npm run db:generate
# Optional Windows/macOS/local-development override; DB exposed to localhost only:
docker compose -f compose.yaml -f compose.local.yaml up -d db
npm run db:migrate
npm run db:seed
npm test
npm run typecheck
npm run build
npm run test:e2e
npm run dev
```

Playwright uses installed Google Chrome and two production servers (ports 8080/8081), exercises vulnerable and secured behavior, and saves desktop/mobile screenshots under test-results/. Stop another server on these ports first. E2E tests act on the disposable seeded lab accounts, including temporarily locking the employee account; reseed/reset between repeated full runs.

The local Compose override substitutes .local/uploads and .local/logs for the two Linux bind sources. Production uses compose.yaml alone. Avoid mixing running native and container apps on port 8080.

Smoke check on the Ubuntu host (Node deps installed and database reachable through an instructor-controlled path), or inside the running app:

```bash
docker compose exec -T -e SMOKE_ORIGIN=http://127.0.0.1:8080 app npm run lab:smoke
# Independently inspect the UUID printed by the smoke test on the actual host:
sudo ls -l /opt/northstar/uploads
sudo sha256sum /opt/northstar/uploads/<printed-uuid>.artifact
```

The smoke uploads harmless text, verifies stored bytes and hash, checks separate login attempts, and scans the JSON audit for configured secrets/session tokens. On a local Docker Desktop setup, run `node scripts/hydra-check.mjs` to test the fixed Compose target with a temporary three-entry synthetic wordlist. It redacts credential-containing tool output and removes the wordlist when complete. Container-only verification must be paired with the host command above to establish the bind mount.

## Reset and emergency stop

```bash
sudo bash scripts/reset-lab.sh
# Emergency stop; retains evidence and database:
docker compose stop app
# End of class:
docker compose down
```

Reset validates fixed real paths, rejects symlinks/unexpected subdirectories, stops the application, clears fictional exercise records, reseeds accounts, removes only top-level files/symlinks in /opt/northstar/uploads and /opt/northstar/quarantine, restarts, health-checks and logs lab_reset. JSON host logs are retained. No broad recursive deletion is used. If a step fails, keep the app stopped and resolve the failure before retrying.

## Troubleshooting

- Docker permission/engine error: start Docker, then use an authorised Docker operator account.
- Missing variables: fill .env; do not print it into a ticket or terminal log.
- Database auth after changing .env: the existing volume retains its original role password.
- Login 503: check database health and UID 1001 write access to the log mount. Security audit failure prevents successful authentication.
- Login 429: secured-mode limits/lockout are active; wait for the configured window or perform an instructor reset.
- Secured login 403: APP_ORIGIN must match the browser Origin.
- POST /login 405 or missing client IP: start the custom server with npm start, not next start.
- Upload rejected: check mode, size, valid filename and CSRF token. Secured mode rejects the teaching marker.
- No Wazuh alert: verify agent enrollment, host (not container) path, FIM rule, active response, YARA output decoder and manager test results separately.
- Health is red after boot: inspect container state; allow time for migrations. /health reports no credentials or stack traces.

## Uninstall

Stop the project with `docker compose down`. Keep evidence according to classroom policy. Only after reviewing backups and confirming this dedicated volume contains no needed data, use `docker compose down -v` to remove the lab database. Artifact/log bind directories remain. Review their contents and remove individually if permitted; this project deliberately supplies no bulk log-deletion command. Remove the host agent's Northstar monitoring entries through your approved Wazuh maintenance procedure.

See [INSTRUCTOR_GUIDE.md](INSTRUCTOR_GUIDE.md), [STUDENT_SCOPE_TEMPLATE.md](STUDENT_SCOPE_TEMPLATE.md), [SECURITY.md](SECURITY.md) and [VERIFICATION.md](VERIFICATION.md).
