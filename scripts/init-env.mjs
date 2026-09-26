import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const template = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
let output = template;
for (const key of ['FINANCE_SEED_PASSWORD', 'EMPLOYEE_SEED_PASSWORD', 'ADMIN_SEED_PASSWORD', 'SESSION_SECRET', 'POSTGRES_PASSWORD']) {
  output = output.replace(key + '=\n', key + '=' + randomBytes(24).toString('hex') + '\n');
}
try { writeFileSync(new URL('../.env', import.meta.url), output, { flag: 'wx', mode: 0o600 }); console.log('Created private .env with generated lab-only credentials. Read it locally; do not share or commit it.'); }
catch (error) { if (error.code === 'EEXIST') console.log('.env already exists; left unchanged.'); else throw error; }
