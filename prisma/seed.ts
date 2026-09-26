import 'dotenv/config';
import { db } from '../lib/db';
import { getEnv } from '../lib/validation/env';
import { hashPassword } from '../lib/auth/password';
export async function seed() {
  const e = getEnv();
  const accounts = [
    { email: 'finance@northstar.test', displayName: 'Alex Morgan', role: 'FINANCE' as const, password: e.FINANCE_SEED_PASSWORD },
    { email: 'employee@northstar.test', displayName: 'Jordan Lee', role: 'EMPLOYEE' as const, password: e.EMPLOYEE_SEED_PASSWORD },
    { email: 'admin@northstar.test', displayName: 'Sam Taylor', role: 'ADMIN' as const, password: e.ADMIN_SEED_PASSWORD }
  ];
  for (const { password, ...account } of accounts) {
    const passwordHash = await hashPassword(password);
    await db().user.upsert({ where: { email: account.email }, create: { ...account, passwordHash },
      update: { ...account, passwordHash, active: true, failedLoginCount: 0, lockedUntil: null } });
  }
  await db().labState.upsert({ where: { id: 'northstar' }, create: { id: 'northstar' }, update: {} });
}
if (process.argv[1]?.replace(/\\/g, '/').endsWith('prisma/seed.ts')) {
  seed().then(() => console.log('Seeded three fictional Northstar accounts.')).catch(() => { console.error('Seed failed. Check configuration and database connectivity.'); process.exitCode = 1; }).finally(() => db().$disconnect());
}
