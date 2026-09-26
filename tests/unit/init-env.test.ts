import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'dotenv';

describe('fresh local environment setup', () => {
  it.each(['LF', 'CRLF'])('keeps the fictional finance credential on %s checkouts and generates private values', async lineEnding => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'northstar-init-'));
    try {
      await mkdir(path.join(root, 'scripts'));
      const template = await readFile('.env.example', 'utf8');
      await writeFile(path.join(root, '.env.example'), lineEnding === 'CRLF' ? template.replace(/\r?\n/g, '\r\n') : template.replace(/\r\n/g, '\n'));
      const entry = path.join(root, 'scripts', 'init-env.mjs');
      await writeFile(entry, await readFile('scripts/init-env.mjs'));
      execFileSync(process.execPath, [entry], { cwd: root, stdio: 'pipe' });
      const generated = await readFile(path.join(root, '.env'), 'utf8');
      const values = parse(generated);
      expect(values.FINANCE_SEED_PASSWORD).toBe('Summer2026');
      const privateValues = ['EMPLOYEE_SEED_PASSWORD', 'ADMIN_SEED_PASSWORD', 'SESSION_SECRET', 'POSTGRES_PASSWORD'].map(key => values[key]);
      expect(privateValues.every(value => /^[0-9a-f]{48}$/.test(value ?? ''))).toBe(true);
      expect(new Set(privateValues).size).toBe(4);
      execFileSync(process.execPath, [entry], { cwd: root, stdio: 'pipe' });
      expect(await readFile(path.join(root, '.env'), 'utf8')).toBe(generated);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
