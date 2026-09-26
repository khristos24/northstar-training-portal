import 'dotenv/config';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getEnv } from '../lib/validation/env';
import { db } from '../lib/db';
import { sha256 } from '../lib/upload/files';
const env = getEnv();
const base = process.env.SMOKE_ORIGIN ?? env.APP_ORIGIN;
if (env.LAB_MODE !== 'vulnerable') throw new Error('Run the compatibility smoke test in vulnerable lab mode.');
try {
  assert.equal((await fetch(base + '/health')).status, 200);
  const started = new Date();
  for (const password of ['synthetic-wrong-entry', env.FINANCE_SEED_PASSWORD]) {
    const response = await fetch(base + '/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: 'finance@northstar.test', password }), redirect: 'manual' });
    if (password !== env.FINANCE_SEED_PASSWORD) { assert.equal(response.status, 200); assert.match(await response.text(), /Invalid email or password/); continue; }
    assert.equal(response.status, 303); assert.equal(response.headers.get('location'), '/dashboard');
    const cookie = response.headers.get('set-cookie')!.split(';')[0];
    const page = await (await fetch(base + '/upload', { headers: { Cookie: cookie } })).text();
    const csrf = page.match(/name="csrf"[^>]*value="([^"]+)"/)?.[1]; assert.ok(csrf);
    const bytes = Buffer.from('Northstar harmless host-mount smoke fixture.\n');
    const form = new FormData(); form.set('csrf', csrf); form.set('file', new Blob([bytes], { type: 'text/plain' }), 'host-smoke.txt');
    const uploaded = await fetch(base + '/upload', { method: 'POST', headers: { Cookie: cookie }, body: form, redirect: 'manual' });
    const id = new URL(uploaded.headers.get('location')!, base).searchParams.get('receipt'); assert.ok(id);
    const stored = await db().upload.findUniqueOrThrow({ where: { id } }); assert.equal(stored.sha256, sha256(bytes));
    const hostDirectory = process.env.SMOKE_UPLOAD_DIR ?? env.UPLOAD_DIR;
    assert.deepEqual(await readFile(path.join(hostDirectory, stored.storedName)), bytes);
    const log = await readFile(path.join(process.env.SMOKE_LOG_DIR ?? env.LOG_DIR, 'security.json'), 'utf8');
    assert.ok(log.includes(stored.sha256));
    for (const secret of [env.FINANCE_SEED_PASSWORD, env.EMPLOYEE_SEED_PASSWORD, env.ADMIN_SEED_PASSWORD, env.SESSION_SECRET, env.POSTGRES_PASSWORD, cookie.split('=')[1]]) assert.ok(!log.includes(secret), 'Secret found in audit log');
    const attempts = await db().loginAttempt.count({ where: { submittedEmail: 'finance@northstar.test', createdAt: { gte: started } } }); assert.equal(attempts, 2);
    console.log('PASS health, form failure marker, session redirect, separate attempts, stored bytes, SHA-256 and secret-free audit.');
    console.log('Stored artifact: ' + stored.storedName);
  }
} catch { console.error('Smoke test failed. Check the local service, mounts, mode and configuration.'); process.exitCode = 1; }
finally { await db().$disconnect(); }
