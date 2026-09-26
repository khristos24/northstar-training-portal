import { describe, it, expect } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { hashPassword, verifyPassword } from '../../lib/auth/password';
import { parseEnv } from '../../lib/validation/env';
import { sanitizeFilename, validateContent, saveUpload, sha256 } from '../../lib/upload/files';
import { serializeEvent, appendSecurityLog, type AuditEvent } from '../../lib/logging';
import { loginDocument } from '../../lib/login-view';
import { boundedBody } from '../../lib/auth/request';
const secrets = Object.fromEntries(['FINANCE_SEED_PASSWORD','EMPLOYEE_SEED_PASSWORD','ADMIN_SEED_PASSWORD','SESSION_SECRET','POSTGRES_PASSWORD'].map(k => [k, randomBytes(24).toString('hex')]));
describe('passwords and environment', () => {
  it('hashes and verifies without storing plaintext', async () => { const value = randomBytes(18).toString('hex'); const hash = await hashPassword(value); expect(hash).not.toContain(value); expect(await verifyPassword(value, hash)).toBe(true); expect(await verifyPassword(value + 'x', hash)).toBe(false); });
  it('rejects bcrypt truncation and empty passwords', async () => { await expect(hashPassword('x'.repeat(73))).rejects.toThrow(); await expect(hashPassword('')).rejects.toThrow(); expect(await verifyPassword('x'.repeat(73), 'invalid')).toBe(false); });
  it('fails clearly for every required secret without echoing values', () => { for (const key of Object.keys(secrets)) { const env = { ...secrets }; delete env[key]; expect(() => parseEnv(env)).toThrow(key); } });
  it('validates both lab modes and proxy prerequisites', () => { expect(parseEnv(secrets).LAB_MODE).toBe('vulnerable'); expect(parseEnv({ ...secrets, LAB_MODE: 'secured' }).LAB_MODE).toBe('secured'); expect(() => parseEnv({ ...secrets, LAB_MODE: 'anything' })).toThrow(); expect(() => parseEnv({ ...secrets, TRUST_PROXY: 'true' })).toThrow('TRUSTED_PROXY_IPS'); expect(() => parseEnv({ ...secrets, TRUST_PROXY: 'yes' })).toThrow(); });
  it('requires secure cookies for HTTPS', () => { expect(() => parseEnv({ ...secrets, APP_ORIGIN: 'https://northstar.test' })).toThrow('HTTPS_ENABLED'); });
});
describe('upload boundary', () => {
  it.each(['../../etc/passwd', '..\\secret', '/etc/passwd', 'C:\\secret.txt', 'a/../x', '.hidden', 'x\0.txt'])('rejects unsafe filename %s', name => { expect(() => sanitizeFilename(name)).toThrow(); });
  it('discards harmless directory components and sanitizes special characters', () => { expect(sanitizeFilename('folder/lab file.txt')).toBe('lab file.txt'); expect(sanitizeFilename('folder\\safe.txt')).toBe('safe.txt'); expect(sanitizeFilename('<script>.txt')).toBe('_script_.txt'); });
  it('enforces size, including empty files', () => { expect(() => validateContent(Buffer.alloc(0), 'a.txt', 'vulnerable', 10)).toThrow(); expect(() => validateContent(Buffer.alloc(11), 'a.txt', 'vulnerable', 10)).toThrow(); });
  it('enforces secured text content and signature policy', () => { const text = Buffer.from('A harmless classroom fixture.'); expect(() => validateContent(text, 'lab.txt', 'secured', 1024)).not.toThrow(); expect(() => validateContent(text, 'lab.exe', 'secured', 1024)).toThrow(); expect(() => validateContent(Buffer.from([0]), 'lab.txt', 'secured', 1024)).toThrow(); const signature = Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE'); expect(() => validateContent(signature, 'lab.txt', 'secured', 1024)).toThrow(); expect(() => validateContent(signature, 'lab.com', 'vulnerable', 1024)).not.toThrow(); });
  it('calculates the known SHA-256 vector', () => { expect(sha256(Buffer.from('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'); });
  it('saves under a generated UUID and hashes the exact stored bytes', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'northstar-upload-'));
    try { const bytes = randomBytes(80000); const stored = await saveUpload(bytes, dir); expect(stored.storedName).toMatch(/^[a-f0-9-]{36}\.artifact$/); expect(await readFile(stored.storagePath)).toEqual(bytes); expect(stored.sha256).toBe(sha256(bytes)); } finally { await rm(dir, { recursive: true, force: true }); }
  });
  it('bounds streaming bodies without trusting content-length', async () => { const request = new Request('http://localhost', { method: 'POST', body: 'a'.repeat(20) }); await expect(boundedBody(request, 10)).rejects.toThrow('body_too_large'); });
});
describe('audit and form compatibility', () => {
  const event: AuditEvent = { eventType: 'authentication_failure', requestId: randomUUID(), sourceIp: '127.0.0.1', userAgent: 'unit-test', submittedEmail: 'finance@northstar.test', userId: null, result: 'failure', reason: 'invalid_credentials' };
  it('whitelists structured JSON fields and excludes extra secret properties', () => { const line = serializeEvent({ ...event, password: secrets.FINANCE_SEED_PASSWORD, sessionToken: 'not-a-real-token' } as AuditEvent); expect(JSON.parse(line).event_type).toBe('authentication_failure'); for (const value of Object.values(secrets)) expect(line).not.toContain(value); expect(line).not.toContain('sessionToken'); expect(line.endsWith('\n')).toBe(true); });
  it('redacts a configured password from client-controlled log fields', () => {
    const previous = process.env.FINANCE_SEED_PASSWORD;
    process.env.FINANCE_SEED_PASSWORD = secrets.FINANCE_SEED_PASSWORD;
    try {
      const line = serializeEvent({ ...event, userAgent: secrets.FINANCE_SEED_PASSWORD, metadata: { original_name: secrets.FINANCE_SEED_PASSWORD } });
      expect(line).not.toContain(secrets.FINANCE_SEED_PASSWORD);
      expect(line).toContain('[REDACTED]');
      expect(JSON.parse(line).user_agent).toBe('[REDACTED]');
    } finally {
      if (previous === undefined) delete process.env.FINANCE_SEED_PASSWORD;
      else process.env.FINANCE_SEED_PASSWORD = previous;
    }
  });
  it('appends independent JSON records', async () => { const dir = await mkdtemp(path.join(os.tmpdir(), 'northstar-audit-')); try { appendSecurityLog(event, dir); appendSecurityLog(event, dir); const records = (await readFile(path.join(dir, 'security.json'), 'utf8')).trim().split('\n').map(s => JSON.parse(s)); expect(records).toHaveLength(2); expect(records.every(e => e.request_id === event.requestId)).toBe(true); } finally { await rm(dir, { recursive: true, force: true }); } });
  it('returns the exact failure marker with a native POST form', () => { const html = loginDocument(true); expect(html).toContain('Invalid email or password'); expect(html).toContain('name="email"'); expect(html).toContain('name="password"'); expect(html).toContain('enctype="application/x-www-form-urlencoded"'); expect(loginDocument()).not.toContain('Invalid email or password'); });
  it('guards reset paths and preserves security logs', async () => { const script = await readFile('scripts/reset-lab.sh', 'utf8'); const guard = await readFile('scripts/host-paths.sh', 'utf8'); expect(script).not.toContain('rm -rf'); expect(script).toContain('verify_emptyable_path /opt/northstar/uploads'); expect(guard).toContain('realpath -e'); expect(guard).toContain('! -L'); expect(script).not.toMatch(/find.*\/var\/log.*-delete/); });
});
