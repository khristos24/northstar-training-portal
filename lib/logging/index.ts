import { constants, openSync, writeSync, closeSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { Prisma, PrismaClient } from '@prisma/client';
import { db } from '../db';
import { getEnv } from '../validation/env';
import type { RequestContext } from '../auth/request';
export type EventType = 'authentication_failure' | 'authentication_success' | 'logout' | 'upload_started' | 'upload_completed' | 'upload_rejected' | 'session_revoked' | 'lab_reset';
export type AuditEvent = RequestContext & {
  eventType: EventType; submittedEmail?: string | null; userId?: string | null;
  result: 'success' | 'failure'; reason: string;
  metadata?: { upload_id?: string; original_name?: string; stored_name?: string; size_bytes?: number; sha256?: string; revoked_count?: number; uploaded_at?: string };
};
function redactValue(value: string) {
  for (const secret of [process.env.FINANCE_SEED_PASSWORD, process.env.EMPLOYEE_SEED_PASSWORD,
    process.env.ADMIN_SEED_PASSWORD, process.env.SESSION_SECRET, process.env.POSTGRES_PASSWORD]) {
    if (secret) value = value.replaceAll(secret, '[REDACTED]');
  }
  return value;
}
export function serializeEvent(event: AuditEvent) {
  let line = JSON.stringify({
    timestamp: new Date().toISOString(), event_type: event.eventType,
    request_id: event.requestId, source_ip: event.sourceIp,
    user_agent: event.userAgent.slice(0, 256), submitted_email: event.submittedEmail ?? null,
    user_id: event.userId ?? null, result: event.result, reason: event.reason,
    ...(event.metadata ? { metadata: event.metadata } : {})
  });
  // Client-supplied fields must not expose configured instructor secrets.
  for (const value of [process.env.FINANCE_SEED_PASSWORD, process.env.EMPLOYEE_SEED_PASSWORD,
    process.env.ADMIN_SEED_PASSWORD, process.env.SESSION_SECRET, process.env.POSTGRES_PASSWORD]) {
    if (value) line = line.replaceAll(JSON.stringify(value).slice(1, -1), '[REDACTED]');
  }
  return line + '\n';
}
export function appendSecurityLog(event: AuditEvent, directory = getEnv().LOG_DIR) {
  mkdirSync(directory, { recursive: true, mode: 0o750 });
  const line = Buffer.from(serializeEvent(event));
  // A single O_APPEND write on the local Linux bind mount; no read/modify/write race.
  if (line.length > 4096) throw new Error('audit_record_too_large');
  let fd: number | undefined;
  try {
    fd = openSync(path.join(directory, 'security.json'), constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | (constants.O_NOFOLLOW ?? 0), 0o640);
    if (writeSync(fd, line) !== line.length) throw new Error('audit_short_write');
  } catch {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), event_type: 'audit_write_failure', request_id: event.requestId }));
    throw new Error('audit_unavailable');
  } finally { if (fd !== undefined) closeSync(fd); }
}
export async function recordEvent(event: AuditEvent, client: Prisma.TransactionClient | PrismaClient = db()) {
  const safe: AuditEvent = {
    ...event,
    userAgent: redactValue(event.userAgent),
    submittedEmail: event.submittedEmail ? redactValue(event.submittedEmail) : event.submittedEmail,
    metadata: event.metadata ? Object.fromEntries(Object.entries(event.metadata).map(([key, value]) =>
      [key, typeof value === 'string' ? redactValue(value) : value])) : undefined
  };
  await client.securityEvent.create({ data: {
    eventType: safe.eventType, requestId: safe.requestId, sourceIp: safe.sourceIp,
    userAgent: safe.userAgent, submittedEmail: safe.submittedEmail,
    userId: safe.userId, result: safe.result, reason: safe.reason, metadata: safe.metadata
  } });
  appendSecurityLog(safe);
}
