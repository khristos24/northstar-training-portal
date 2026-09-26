import { NextResponse } from 'next/server';
import { authenticate } from '../../../../lib/auth/login';
import { boundedBody, requestContext, validOrigin } from '../../../../lib/auth/request';
import { COOKIE_NAME, cookieOptions } from '../../../../lib/auth/session';
import { loginDocument } from '../../../../lib/login-view';
import { getEnv } from '../../../../lib/validation/env';
export const runtime = 'nodejs';
function failure(status: number) { return new Response(loginDocument(true), { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '900' } : {}) } }); }
export async function POST(request: Request) {
  try {
    if (getEnv().LAB_MODE === 'secured' && !validOrigin(request.headers)) return failure(403);
    if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return failure(400);
    let form: URLSearchParams;
    try { form = new URLSearchParams((await boundedBody(request, 4096)).toString('utf8')); } catch { return failure(413); }
    const rawEmail = (form.get('email') ?? '').trim().toLowerCase();
    const email = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@northstar\.test$/.test(rawEmail) && rawEmail.length <= 254 ? rawEmail : 'invalid@northstar.test';
    const outcome = await authenticate(email, form.get('password') ?? '', requestContext(request.headers));
    if (!outcome.success) return failure(outcome.throttled ? 429 : 200);
    const response = new NextResponse(null, { status: 303, headers: { Location: '/dashboard', 'Cache-Control': 'no-store' } });
    response.cookies.set(COOKIE_NAME, outcome.session.token, { ...cookieOptions(), expires: outcome.session.expiresAt });
    return response;
  } catch { return new Response(loginDocument(false, true), { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }); }
}
