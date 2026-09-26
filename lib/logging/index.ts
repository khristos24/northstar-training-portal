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
export function serializeEvent(event: AuditEvent) {
  return JSON.stringify({
    timestamp: new Date().toISOString(), event_type: event.eventType,
    request_id: event.requestId, source_ip: event.sourceIp,
    user_agent: event.userAgent.slice(0, 256), submitted_email: event.submittedEmail ?? null,
    user_id: event.userId ?? null, result: event.result, reason: event.reason,
    ...(event.metadata ? { metadata: event.metadata } : {})
  }) + '\n';
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
  await client.securityEvent.create({ data: {
    eventType: event.eventType, requestId: event.requestId, sourceIp: event.sourceIp,
    userAgent: event.userAgent, submittedEmail: event.submittedEmail,
    userId: event.userId, result: event.result, reason: event.reason, metadata: event.metadata
  } });
  appendSecurityLog(event);
}
