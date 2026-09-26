import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { recordEvent } from '../lib/logging';
import { db } from '../lib/db';
try { await recordEvent({ requestId: randomUUID(), sourceIp: 'local', userAgent: 'northstar-reset', eventType: 'lab_reset', result: 'success', reason: 'instructor_reset_completed' }); console.log('Lab-reset event recorded.'); }
catch { console.error('Reset audit failed. Check the log mount.'); process.exitCode = 1; }
finally { await db().$disconnect(); }
