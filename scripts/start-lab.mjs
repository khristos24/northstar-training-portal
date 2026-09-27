import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import path from 'node:path';
import { validatePublicConfig } from './public-config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicMode = process.argv.includes('--public');
if (process.argv.slice(2).some(arg => arg !== '--public')) throw new Error('Usage: node scripts/start-lab.mjs [--public]');
if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required for the starter.');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.slice(0, 2).join(' ')} failed with exit code ${result.status}.`);
}

function docker(args) {
  if (process.platform === 'linux' && process.getuid?.() !== 0) run('sudo', ['docker', ...args]);
  else run('docker', args);
}

async function main() {
  const envPath = path.join(root, '.env');
  if (!existsSync(envPath)) run(process.execPath, ['scripts/init-env.mjs']);
  // Match Compose's project file even when the invoking shell has old values.
  Object.assign(process.env, parseEnv(readFileSync(envPath, 'utf8')));

  if (publicMode) {
    const tunnelPath = path.join(root, '.env.tunnel');
    const tunnelToken = existsSync(tunnelPath) ? parseEnv(readFileSync(tunnelPath, 'utf8')).TUNNEL_TOKEN : undefined;
    const issues = validatePublicConfig({ ...process.env, TUNNEL_TOKEN: tunnelToken });
    if (issues.length) throw new Error(`Public startup is not configured:\n- ${issues.join('\n- ')}\nCreate the Tunnel route and Access policy described in README.md before running this command.`);
  }

  run('docker', ['compose', 'version']);
  try { docker(['info', '--format', '{{.ServerVersion}}']); }
  catch { throw new Error('Docker engine is unavailable. Start Docker Desktop on Windows or the Docker service on Ubuntu, then retry.'); }
  const files = ['-f', 'compose.yaml'];
  if (process.platform !== 'linux') files.push('-f', 'compose.local.yaml');
  if (publicMode) files.push('-f', 'compose.public.yaml');

  if (process.platform === 'linux') {
    if (process.getuid?.() === 0) run('bash', ['scripts/prepare-host.sh']);
    else run('sudo', ['bash', 'scripts/prepare-host.sh']);
    if (process.getuid?.() === 0) run('bash', ['scripts/verify-host-paths.sh']);
    else run('sudo', ['bash', 'scripts/verify-host-paths.sh']);
  }

  docker(['compose', ...files, 'up', '-d', '--build']);
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch('http://127.0.0.1:8080/health', { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        console.log('Northstar is healthy at http://127.0.0.1:8080');
        if (publicMode) {
          docker(['compose', ...files, 'ps', 'cloudflared']);
          console.log(`Tunnel started. Verify Cloudflare reports it connected, then visit ${new URL(process.env.APP_ORIGIN).origin} through Access.`);
        }
        return;
      }
    } catch { /* Keep waiting while migrations and startup complete. */ }
    await delay(5000);
  }
  docker(['compose', ...files, 'ps']);
  throw new Error('Northstar did not become healthy within five minutes. Inspect the app container logs.');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
