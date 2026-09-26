import { createHmac, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '../db';
import { getEnv } from '../validation/env';
export const COOKIE_NAME = 'northstar_session';
export function tokenHash(token: string) { return createHmac('sha256', getEnv().SESSION_SECRET).update(token).digest('hex'); }
export function newSession() {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + getEnv().SESSION_HOURS * 3600000) };
}
export function cookieOptions() { return { httpOnly: true, sameSite: 'lax' as const, secure: getEnv().HTTPS_ENABLED, path: '/' }; }
export async function sessionForToken(token?: string) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const session = await db().session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: true } });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.active) return null;
  return session;
}
export async function currentSession() { return sessionForToken((await cookies()).get(COOKIE_NAME)?.value); }
export async function requireSession() { const s = await currentSession(); if (!s) redirect('/login'); return s; }
export function csrfToken(token: string) { return createHmac('sha256', getEnv().SESSION_SECRET).update('csrf:' + token).digest('hex'); }
