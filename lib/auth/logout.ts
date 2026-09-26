import { NextRequest, NextResponse } from 'next/server';
import { db } from '../db';
import { recordEvent } from '../logging';
import { COOKIE_NAME, cookieOptions, sessionForToken } from './session';
import { boundedBody, requestContext, validCsrf, validOrigin } from './request';
export async function logout(request: NextRequest, all: boolean) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = await sessionForToken(token);
    if (!session || !token) return new NextResponse(null, { status: 303, headers: { Location: '/login' } });
    const form = new URLSearchParams((await boundedBody(request, 4096)).toString());
    if (!validOrigin(request.headers, false) || !validCsrf(form.get('csrf'), token)) return NextResponse.json({ error: 'Invalid form. Please reload and try again.' }, { status: 403 });
    const revoked = await db().session.updateMany({ where: all ? { userId: session.userId, revokedAt: null } : { id: session.id }, data: { revokedAt: new Date() } });
    await recordEvent({ ...requestContext(request.headers), eventType: all ? 'session_revoked' : 'logout', userId: session.userId, submittedEmail: session.user.email, result: 'success', reason: all ? 'user_revoked_all_sessions' : 'user_logout', metadata: { revoked_count: revoked.count } });
    const response = new NextResponse(null, { status: 303, headers: { Location: '/login' } });
    response.cookies.set(COOKIE_NAME, '', { ...cookieOptions(), maxAge: 0 });
    return response;
  } catch { return NextResponse.json({ error: 'Unable to sign out. Please try again.' }, { status: 503 }); }
}
