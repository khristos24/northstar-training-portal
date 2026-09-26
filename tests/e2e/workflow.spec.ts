import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from '../../lib/db';
import { sha256 } from '../../lib/upload/files';
import { getEnv } from '../../lib/validation/env';
test.afterAll(async () => { await db().$disconnect(); });
test('native form, session, upload receipt, scoped records and logout', async ({ page, request }) => {
  const env = getEnv();
  const start = new Date();
  const anon = await request.get('/dashboard', { maxRedirects: 0 }); expect(anon.status()).toBe(307);
  expect((await request.post('/upload', { maxRedirects: 0 })).headers().location).toBe('/login');
  const wrong = 'synthetic-wrong-' + randomUUID();
  for (let i = 0; i < 2; i++) { const response = await request.post('/login', { form: { email: 'finance@northstar.test', password: wrong }, maxRedirects: 0 }); expect(response.status()).toBe(200); expect(await response.text()).toContain('Invalid email or password'); }
  const success = await request.post('/login', { form: { email: 'finance@northstar.test', password: env.FINANCE_SEED_PASSWORD }, maxRedirects: 0 });
  expect(success.status()).toBe(303); expect(success.headers().location).toBe('/dashboard'); expect(await success.text()).not.toContain('Invalid email or password');
  expect(success.headers()['set-cookie']).toContain('HttpOnly'); expect(success.headers()['set-cookie']).toContain('SameSite=lax');
  const attempts = await db().loginAttempt.findMany({ where: { submittedEmail: 'finance@northstar.test', createdAt: { gte: start } } });
  expect(attempts).toHaveLength(3); expect(new Set(attempts.map(a => a.requestId)).size).toBe(3);
  expect(await db().securityEvent.count({ where: { requestId: { in: attempts.map(a => a.requestId) } } })).toBe(3);
  await page.goto('/login');
  await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true });
  await page.getByLabel('Email address').fill('finance@northstar.test'); await page.getByLabel('Password', { exact: true }).fill(env.FINANCE_SEED_PASSWORD);
  await page.getByRole('button', { name: 'Sign in to workspace' }).click();
  await expect(page).toHaveURL(/\/dashboard$/); await expect(page.getByRole('heading', { name: /Welcome, Alex/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Upload an artifact', exact: true }).click();
  const bytes = Buffer.from('Northstar harmless plain-text smoke fixture.\n');
  await page.getByLabel('Choose artifact').setInputFiles({ name: 'classroom-fixture.txt', mimeType: 'text/plain', buffer: bytes });
  await page.screenshot({ path: 'test-results/upload-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Submit artifact' }).click();
  await expect(page.getByRole('heading', { name: 'Artifact received.' })).toBeVisible();
  const id = new URL(page.url()).searchParams.get('receipt')!;
  const upload = await db().upload.findUniqueOrThrow({ where: { id } });
  expect(upload.sha256).toBe(sha256(bytes)); expect(await readFile(upload.storagePath)).toEqual(bytes); await expect(page.getByText(upload.sha256, { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/receipt-desktop.png', fullPage: true });
  const logs = await readFile(path.join(env.LOG_DIR, 'security.json'), 'utf8');
  for (const secret of [wrong, env.FINANCE_SEED_PASSWORD, env.ADMIN_SEED_PASSWORD, env.EMPLOYEE_SEED_PASSWORD, env.SESSION_SECRET, env.POSTGRES_PASSWORD]) expect(logs).not.toContain(secret);
  expect(logs).toContain(upload.sha256);
  const rawCookies = await page.context().cookies();
  const cookie = rawCookies.find(c => c.name === 'northstar_session')!;
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  const stale = await request.get('/dashboard', { headers: { Cookie: 'northstar_session=' + cookie.value }, maxRedirects: 0 });
  expect(stale.status()).toBe(307);
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/login'); await page.screenshot({ path: 'test-results/login-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('secured mode locks repeated attempts and rejects binary uploads', async ({ playwright }) => {
  const env = getEnv();
  const api = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:8081', extraHTTPHeaders: { Origin: 'http://127.0.0.1:8081' } });
  // Use the independently seeded employee account; finance remains the vulnerable exercise target.
  const success = await api.post('/login', { form: { email: 'employee@northstar.test', password: env.EMPLOYEE_SEED_PASSWORD }, maxRedirects: 0 });
  expect(success.status()).toBe(303);
  const html = await (await api.get('/upload')).text();
  const csrf = html.match(/name="csrf"[^>]*value="([^"]+)"/)?.[1]; expect(csrf).toBeTruthy();
  const reject = await api.post('/upload', { multipart: { csrf: csrf!, file: { name: 'binary.txt', mimeType: 'text/plain', buffer: Buffer.from([0, 1, 2]) } }, maxRedirects: 0 });
  expect(reject.headers().location).toBe('/upload?error=invalid');
  const revoked = await api.post('/api/auth/revoke', { form: { csrf: csrf! }, maxRedirects: 0 }); expect(revoked.headers().location).toBe('/login');
  expect((await api.get('/dashboard', { maxRedirects: 0 })).status()).toBe(307);
  for (let i = 0; i < 5; i++) await api.post('/login', { form: { email: 'employee@northstar.test', password: randomUUID() } });
  const locked = await api.post('/login', { form: { email: 'employee@northstar.test', password: env.EMPLOYEE_SEED_PASSWORD }, maxRedirects: 0 });
  expect(locked.status()).toBe(429); expect(await locked.text()).toContain('Invalid email or password');
  const user = await db().user.findUniqueOrThrow({ where: { email: 'employee@northstar.test' } }); expect(user.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
  await api.dispose();
});

test('secured per-account and per-IP limits ignore forged forwarding headers', async ({ playwright }) => {
  const api = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:8081', extraHTTPHeaders: { Origin: 'http://127.0.0.1:8081', 'X-Forwarded-For': '198.51.100.99', 'X-Northstar-Source-IP': '198.51.100.98' } });
  const email = 'rate-' + randomUUID() + '@northstar.test';
  let response;
  for (let i = 0; i < 9; i++) response = await api.post('/login', { form: { email, password: randomUUID() }, maxRedirects: 0 });
  expect(response!.status()).toBe(429);
  const accountAttempt = await db().loginAttempt.findFirstOrThrow({ where: { submittedEmail: email }, orderBy: { createdAt: 'desc' } });
  expect(accountAttempt.reason).toBe('account_rate_limit');
  expect(accountAttempt.sourceIp).toBe('127.0.0.1');
  let sawIpLimit = false;
  for (let i = 0; i < 31; i++) {
    const address = 'ip-' + randomUUID() + '@northstar.test';
    const result = await api.post('/login', { form: { email: address, password: randomUUID() }, maxRedirects: 0 });
    if (result.status() === 429) {
      const attempt = await db().loginAttempt.findFirstOrThrow({ where: { submittedEmail: address } });
      expect(attempt.reason).toBe('ip_rate_limit'); sawIpLimit = true; break;
    }
  }
  expect(sawIpLimit).toBe(true);
  await api.dispose();
});
