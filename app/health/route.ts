import { NextResponse } from 'next/server';
import { db } from '../../lib/db';
import { getEnv } from '../../lib/validation/env';
export const dynamic = 'force-dynamic';
export async function GET() {
  let connected = false;
  try { await db().$queryRaw`SELECT 1`; connected = true; } catch { /* Never return internal error details. */ }
  return NextResponse.json({ status: connected ? 'ok' : 'degraded', database: connected ? 'connected' : 'unavailable', lab_mode: getEnv().LAB_MODE, timestamp: new Date().toISOString() }, { status: connected ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
