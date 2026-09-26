import { randomUUID, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { getEnv } from '../validation/env';
import { csrfToken } from './session';
export type RequestContext = { requestId: string; sourceIp: string; userAgent: string };
export function requestContext(headers: Headers): RequestContext {
  const ip = headers.get('x-northstar-source-ip') ?? '';
  return { requestId: randomUUID(), sourceIp: isIP(ip) ? ip : 'unknown', userAgent: (headers.get('user-agent') ?? 'unknown').replace(/[\r\n\x00-\x1f]/g, '').slice(0, 256) };
}
export function validOrigin(headers: Headers, required = true) {
  const origin = headers.get('origin');
  if (!origin) return !required;
  return origin === new URL(getEnv().APP_ORIGIN).origin;
}
export function validCsrf(value: FormDataEntryValue | null, token: string) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(csrfToken(token)));
}
export async function boundedBody(request: Request, limit: number) {
  if (Number(request.headers.get('content-length') ?? 0) > limit) throw new Error('body_too_large');
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  let total = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    total += chunk.value.byteLength;
    if (total > limit) { await reader.cancel(); throw new Error('body_too_large'); }
    chunks.push(chunk.value);
  }
  return Buffer.concat(chunks);
}
