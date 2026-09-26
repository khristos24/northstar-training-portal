# Northstar implementation

1. Build a monochrome, responsive sign-in, dashboard and artifact-upload interface.
2. Add PostgreSQL 17 / Prisma, bcrypt, database sessions, bounded uploads and structured audit logging.
3. Implement vulnerable and secured modes, trusted-proxy boundaries and session revocation.
4. Add production Docker, guarded host preparation/reset, Wazuh examples and instructor documentation.
5. Verify types, unit tests, browser workflow, production build and available deployment infrastructure; record any unverified acceptance criteria.

The custom Node entry point preserves the actual socket address and routes native POST /login and POST /upload to App Router handlers. Always use the supplied start commands.
