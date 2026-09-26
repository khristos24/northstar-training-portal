import 'dotenv/config';
import { db } from '../lib/db';
import { seed } from '../prisma/seed';
try { if (!await db().labState.findUnique({ where: { id: 'northstar' } })) await seed(); }
catch { console.error('Database bootstrap failed; check configuration.'); process.exitCode = 1; }
finally { await db().$disconnect(); }
