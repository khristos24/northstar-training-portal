import 'dotenv/config';
import { createServer } from 'node:http';
import { isIP } from 'node:net';
import next from 'next';
import { getEnv } from './lib/validation/env';
let env: ReturnType<typeof getEnv>;
try { env = getEnv(); } catch (error) { console.error((error as Error).message); process.exit(1); }
const dev = !process.argv.includes('--production');
Object.assign(process.env, { NODE_ENV: dev ? 'development' : 'production' });
const app = next({ dev, hostname: env.BIND_HOST, port: env.PORT });
await app.prepare();
const handle = app.getRequestHandler();
const trusted = env.TRUSTED_PROXY_IPS.split(',').map(s => s.trim().replace(/^::ffff:/, ''));
const server = createServer({ maxHeaderSize: 16384 }, async (req, res) => {
  const directIp = (req.socket.remoteAddress ?? '').replace(/^::ffff:/, '');
  let sourceIp = directIp;
  // Always overwrite any caller-supplied internal address header.
  if (env.TRUST_PROXY && trusted.includes(directIp)) {
    const value = req.headers['x-forwarded-for'];
    // Trusted proxy must overwrite this header with exactly one client address.
    if (typeof value === 'string' && isIP(value.trim())) sourceIp = value.trim();
  }
  req.headers['x-northstar-source-ip'] = sourceIp;
  delete req.headers['x-forwarded-host'];
  if (!env.TRUST_PROXY || !trusted.includes(directIp)) {
    delete req.headers['x-forwarded-for']; delete req.headers['x-forwarded-proto'];
  }
  const pathname = (req.url ?? '/').split('?')[0];
  if (req.method === 'POST' && pathname === '/login') req.url = '/api/auth/login';
  if (req.method === 'POST' && pathname === '/upload') req.url = '/api/uploads';
  if (env.HTTPS_ENABLED) res.setHeader('Strict-Transport-Security', 'max-age=86400');
  try { await handle(req, res); }
  catch { if (!res.headersSent) { res.statusCode = 503; res.end('The training portal is temporarily unavailable.'); } else res.end(); }
});
server.requestTimeout = 30000;
server.headersTimeout = 15000;
server.listen(env.PORT, env.BIND_HOST, () => console.log(JSON.stringify({ event_type: 'server_started', port: env.PORT, lab_mode: env.LAB_MODE })));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
