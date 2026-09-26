import { db } from '../db';
import { getEnv } from '../validation/env';
import { recordEvent } from '../logging';
import { verifyPassword, hashPassword } from './password';
import { newSession } from './session';
import type { RequestContext } from './request';
import { randomBytes } from 'node:crypto';
const dummyHash = hashPassword(randomBytes(24).toString('hex'));
export const FAILURE_MARKER = 'Invalid email or password';
export async function authenticate(email: string, password: string, context: RequestContext) {
  const secured = getEnv().LAB_MODE === 'secured';
  return db().$transaction(async tx => {
    if (secured) {
      // Database-scoped locks make counters reliable across concurrent app processes.
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${'ip:' + context.sourceIp}))`;
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${'account:' + email}))`;
    }
    const now = new Date();
    const user = await tx.user.findUnique({ where: { email } });
    let reason = 'invalid_credentials';
    let throttled = false;
    if (secured) {
      const since = new Date(Date.now() - 15 * 60000);
      const ipCount = await tx.loginAttempt.count({ where: { sourceIp: context.sourceIp, createdAt: { gte: since } } });
      const accountCount = await tx.loginAttempt.count({ where: { submittedEmail: email, createdAt: { gte: since } } });
      if (user?.lockedUntil && user.lockedUntil > now) { reason = 'account_locked'; throttled = true; }
      else if (ipCount >= 30 || accountCount >= 8) { reason = ipCount >= 30 ? 'ip_rate_limit' : 'account_rate_limit'; throttled = true; }
    }
    const matches = !throttled && await verifyPassword(password, user?.passwordHash ?? await dummyHash);
    const success = !!user?.active && matches;
    if (user && secured) {
      const previous = user.lockedUntil && user.lockedUntil <= now ? 0 : user.failedLoginCount;
      const failures = success ? 0 : previous + (throttled ? 0 : 1);
      await tx.user.update({ where: { id: user.id }, data: {
        failedLoginCount: failures,
        lockedUntil: success ? null : (!throttled && failures >= 5 ? new Date(Date.now() + 15 * 60000) : user.lockedUntil)
      } });
    }
    await tx.loginAttempt.create({ data: {
      ...context, submittedEmail: email, userId: user?.id,
      result: success ? 'SUCCESS' : 'FAILURE', reason: success ? 'authenticated' : reason
    } });
    await recordEvent({ ...context, eventType: success ? 'authentication_success' : 'authentication_failure',
      submittedEmail: email, userId: user?.id, result: success ? 'success' : 'failure', reason: success ? 'authenticated' : reason }, tx);
    if (!success || !user) return { success: false as const, throttled };
    const session = newSession();
    await tx.session.create({ data: { userId: user.id, tokenHash: session.tokenHash, expiresAt: session.expiresAt } });
    return { success: true as const, session };
  }, { timeout: 20000, maxWait: 20000 });
}
