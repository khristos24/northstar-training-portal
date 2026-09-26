import 'dotenv/config';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
const run = promisify(execFile);
const password = process.env.FINANCE_SEED_PASSWORD;
if (!password || /[\r\n]/.test(password)) throw new Error('Configure a single-line fictional finance seed password.');
const directory = path.resolve('.local');
await mkdir(directory, { recursive: true });
const filename = path.join(directory, 'hydra-synthetic-wordlist.txt');
await writeFile(filename, 'synthetic-incorrect-one\n' + password + '\nsynthetic-incorrect-two\n', { flag: 'wx', mode: 0o600 });
try {
  // Fixed target: this Compose network's app service. No public target argument.
  const { stdout } = await run('docker', [
    'run', '--rm', '--network', 'northstar-lab_lab',
    '--mount', 'type=bind,source=' + filename + ',target=/tmp/wordlist,readonly',
    'node:24-bookworm-slim', 'sh', '-c',
    "apt-get update -qq >/dev/null && apt-get install -y -qq --no-install-recommends hydra >/dev/null 2>&1 && hydra -l finance@northstar.test -P /tmp/wordlist -t 1 -W 2 -f app http-post-form '/login:email=^USER^&password=^PASS^:F=Invalid email or password' -s 8080"
  ], { timeout: 600000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  if (!stdout.includes('1 valid password found') || !stdout.includes('password: ' + password)) throw new Error('Compatibility failed');
  // Never persist or print Hydra's credential-containing output.
  console.log('PASS: Hydra identified the configured fictional password from a three-entry synthetic list. Output redacted.');
} catch {
  console.error('Hydra verification failed; no credential-containing tool output was retained.');
  process.exitCode = 1;
} finally { await unlink(filename); }
