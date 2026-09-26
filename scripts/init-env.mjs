import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const template = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
let output = template;
// Keep the published fictional finance target stable across fresh local installs.
for (const key of ['EMPLOYEE_SEED_PASSWORD', 'ADMIN_SEED_PASSWORD', 'SESSION_SECRET', 'POSTGRES_PASSWORD']) {
  const blankValue = new RegExp('^' + key + '=(?=\\r?$)', 'm');
  if (!blankValue.test(output)) throw new Error('Expected a blank ' + key + ' in .env.example');
  output = output.replace(blankValue, key + '=' + randomBytes(24).toString('hex'));
}
try { writeFileSync(new URL('../.env', import.meta.url), output, { flag: 'wx', mode: 0o600 }); console.log('Created private .env with the fictional finance target and generated remaining secrets. Do not commit it.'); }
catch (error) { if (error.code === 'EEXIST') console.log('.env already exists; left unchanged.'); else throw error; }
