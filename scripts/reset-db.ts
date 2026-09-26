import 'dotenv/config';
import { db } from '../lib/db';
import { seed } from '../prisma/seed';
if (process.env.NORTHSTAR_RESET_CONFIRMED !== 'yes') { console.error('Use the guarded scripts/reset-lab.sh workflow.'); process.exit(1); }
try {
  await db().$transaction(async tx => {
    await tx.session.deleteMany(); await tx.loginAttempt.deleteMany(); await tx.upload.deleteMany(); await tx.securityEvent.deleteMany();
    // All identities in this dedicated database are fictional lab data.
    await tx.user.deleteMany();
    await tx.labState.upsert({ where: { id: 'northstar' }, create: { id: 'northstar', lastResetAt: new Date(), resetCount: 1 }, update: { lastResetAt: new Date(), resetCount: { increment: 1 } } });
  });
  await seed();
  console.log('Fictional lab database reset and reseeded.');
} catch { console.error('Lab reset failed. Keep the app stopped and inspect the database.'); process.exitCode = 1; }
finally { await db().$disconnect(); }
