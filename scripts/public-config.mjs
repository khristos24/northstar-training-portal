export function validatePublicConfig(env) {
  const issues = [];
  if (!env.TUNNEL_TOKEN?.trim()) issues.push('Set TUNNEL_TOKEN in the ignored .env.tunnel file.');
  if (env.LAB_MODE !== 'secured') issues.push('Set LAB_MODE=secured for the internet path.');
  if (env.HTTPS_ENABLED !== 'true') issues.push('Set HTTPS_ENABLED=true for the public HTTPS hostname.');
  if (env.HOST_BIND_IP !== '127.0.0.1') issues.push('Set HOST_BIND_IP=127.0.0.1 so the host port stays local.');
  if (env.TRUST_PROXY !== 'false') issues.push('Set TRUST_PROXY=false for this tunnel setup.');
  let url;
  try { url = new URL(env.APP_ORIGIN); } catch { /* Report a single useful origin error below. */ }
  if (!url || url.protocol !== 'https:' || !url.hostname || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    issues.push('Set APP_ORIGIN to the exact public HTTPS origin, such as https://lab.example.com.');
  }
  return issues;
}
