# Security boundaries

- Use only in an authorised training range.
- Never deploy with unrestricted public ingress.
- Use fictional identities and credentials.
- Do not upload functioning malware.
- Do not use production data.
- Stop the environment when the class ends.

Vulnerable mode intentionally disables authentication throttling, MFA, CAPTCHA and lockout. The instructor chooses the training password; no password is committed. No other vulnerability is intended.

Both modes use bcrypt, opaque random cookies with HMAC digests stored in PostgreSQL, expiry checks, server-side access control, SQL parameter binding, inert UUID upload names, exclusive file creation and bounded input reads. Upload/logout/revocation forms require a session-bound CSRF token. Secured login requires the configured Origin, while vulnerable login permits the native form exercise.

Secured mode serializes per-IP and per-account decisions using PostgreSQL transaction advisory locks: 30 attempts per IP or 8 per submitted account in 15 minutes; 5 failed passwords temporarily lock a known account for 15 minutes. Logs record the reason while clients receive the stable generic failure marker. All-sessions revocation is available in both modes. Apply network controls to both modes; this is not an Internet-facing identity service.

Only the custom `server.ts` entry point may serve the app. It overwrites internal address headers with the socket address. `TRUST_PROXY=false` ignores forwarded client addresses. If true, only exact `TRUSTED_PROXY_IPS` can supply one overwritten X-Forwarded-For address. Do not use a comma-appending proxy chain. Restrict direct app ingress to that proxy and set APP_ORIGIN/HTTPS_ENABLED explicitly. HTTPS is supplied by the instructor's trusted reverse proxy, not by the Node server.

Session tokens, passwords, database URLs and seed secrets must never be placed in audit metadata. Audit serialization uses an explicit field allowlist. Application errors and health responses are generic. Audit storage failure fails the operation closed and emits a fixed stderr record; monitor container stderr too. File and database auditing are not one atomic distributed transaction: a filesystem failure or DB commit failure can leave an audit discrepancy requiring instructor review. O_APPEND writes assume a local Linux filesystem, not NFS/network storage.

Uploads have no download route, preview or execution facility and live outside public/. A 1 MB file limit plus bounded multipart overhead protects memory. Secured mode requires UTF-8 plain text with a .txt suffix and rejects the teaching marker. This is not a malware scanner. Formal detection belongs to Wazuh FIM + YARA.

Reset is a destructive instructor operation confined to this project's fictional database and two fixed host artifact directories. It preserves host audit logs. Stop the app before database reset and never share this database with other applications. Do not manually run the reset database script on another deployment.

No outbound callbacks, reverse shells, persistence, anti-forensics, Wazuh disabling, log-clearing or lateral-movement features are included. The deployment does not automatically configure AWS, TLS or Wazuh.
