# Instructor handoff

## Instructor secrets

Keep .env private and untracked. The default finance password is a published, fictional training credential (`Summer2026`); it is not an instructor secret. Employee/admin seed passwords, SESSION_SECRET, POSTGRES_PASSWORD and Wazuh enrollment material are instructor-only. Override FINANCE_SEED_PASSWORD in .env if your class needs a private target, and place that chosen value in the sanitized classroom wordlist. Never use a real password. `npm run lab:init` generates the other four private values without printing them.

## Student-visible information

Provide the assigned private target IP/port, authorised time window, assigned fictional account, classroom contact channel and instructor-approved artifact. Complete STUDENT_SCOPE_TEMPLATE.md. The portal clearly displays the training warning and logs actions for the exercise.

## Pre-class checks

1. Confirm written scope and private ingress restrictions.
2. Set APP_ORIGIN and HOST_BIND_IP for the assigned private address. Start in LAB_MODE=vulnerable.
3. Prepare host paths with scripts/prepare-host.sh, deploy, migrate and seed.
4. Verify /health, wrong-password marker, successful dashboard access, sign-out and upload receipt.
5. Run the tiny synthetic compatibility check before issuing classroom instructions.
6. Compare an uploaded harmless text fixture's bytes/hash in /opt/northstar/uploads with the receipt and JSON log.
7. Verify Wazuh enrollment, FIM creation, the reviewed YARA integration and matching EICAR training rule in the manager. A receipt does not establish detection.
8. Check resets on the actual Ubuntu training host before students arrive. Review VERIFICATION.md for locally tested versus deployment-only items.

## Live exercise

Use the instructor-run SET exercise with fictional identities and issued lab-only credentials. Sanitize those synthetic values into a small wordlist. Follow the authorised Hydra command in README against finance@northstar.test only. Failed login marker: **Invalid email or password**. Success redirects to /dashboard and issues a session.

After signing in, upload the supplied harmless artifact. Record the receipt UUID/hash/time. Correlate with the upload event at /var/log/northstar/security.json, host file at /opt/northstar/uploads/<UUID>.artifact and Wazuh FIM/YARA alerts.

For the mitigation comparison, set LAB_MODE=secured in .env and recreate the app with `docker compose up -d --force-recreate app`. Show rate limiting/lockout and stricter text validation. The portal never claims a detection verdict itself.

## Emergency stop

Run `docker compose stop app` from this project's directory. If needed, remove student ingress through the instructor-controlled security group. Preserve logs and monitoring. Do not disable Wazuh. Review unexpected behavior before restarting.

## Post-class reset

Run `sudo bash scripts/reset-lab.sh`. It stops the app, resets only fictional lab records, validates and empties only the two fixed artifact directories, reseeds, restarts, health-checks and appends lab_reset. Host JSON security logs remain for review. For final shutdown run `docker compose down`; the named database volume and evidence remain.

The reset is intended for the dedicated Ubuntu host. The optional Windows/macOS Compose override uses different bind sources and does not validate the production reset's host-path assumptions.
