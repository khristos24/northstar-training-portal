import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const sensitiveNames = /(^|\/)(\.env(\.|$)|\.local\/|uploads\/|logs\/|test-results\/|node_modules\/|\.next\/)/;
const privateKeys = ['EMPLOYEE_SEED_PASSWORD', 'ADMIN_SEED_PASSWORD', 'SESSION_SECRET', 'POSTGRES_PASSWORD'];
const secrets = privateKeys.map(k => process.env[k]).filter(Boolean);
if (secrets.length !== privateKeys.length || !process.env.FINANCE_SEED_PASSWORD) throw new Error('Load a local .env before checking publication.');
const publishedFinance = readFileSync('.env.example', 'utf8').match(/^FINANCE_SEED_PASSWORD=([^\r\n]+)$/m)?.[1];
if (!publishedFinance) throw new Error('Published fictional finance password is missing from .env.example.');
if (process.env.FINANCE_SEED_PASSWORD !== publishedFinance) secrets.push(process.env.FINANCE_SEED_PASSWORD);
let findings = 0;
for (const filename of files) {
  if (filename !== '.env.example' && sensitiveNames.test(filename.replaceAll('\\', '/'))) { console.error('Forbidden tracked path: ' + filename); findings++; continue; }
  if (statSync(filename).size > 2 * 1024 * 1024) { console.error('Oversized tracked file: ' + filename); findings++; continue; }
  if (filename.endsWith('.woff2')) continue;
  const data = readFileSync(filename, 'utf8');
  if (secrets.some(s => data.includes(s))) { console.error('Local secret found in: ' + filename); findings++; }
  if (/gh[opusr]_[A-Za-z0-9_]{30,}/.test(data) || /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/.test(data)) { console.error('Credential-like material found in: ' + filename); findings++; }
}
if (findings) process.exit(1);
console.log('Publication review passed: ' + files.length + ' tracked files, private secrets absent, fictional finance default reviewed.');
