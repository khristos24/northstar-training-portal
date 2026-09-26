import { cookies } from 'next/headers';
import { ArrowUpRight, ArrowRight, FileUp, Fingerprint, Clock3, Check, ShieldCheck } from 'lucide-react';
import { requireSession, COOKIE_NAME, csrfToken } from '../../lib/auth/session';
import { db } from '../../lib/db';
import { getEnv } from '../../lib/validation/env';
import { Shell } from '../../components/shell';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Overview' };
function time(date: Date) { return date.toISOString().replace('T', ' · ').slice(0, 24) + ' UTC'; }
export default async function Dashboard() {
  const session = await requireSession();
  const user = session.user;
  const [activity, uploads, signIns, lastLogin] = await Promise.all([
    db().securityEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 6 }),
    db().upload.count({ where: { userId: user.id } }),
    db().loginAttempt.count({ where: { userId: user.id, result: 'SUCCESS' } }),
    db().loginAttempt.findFirst({ where: { userId: user.id, result: 'SUCCESS' }, orderBy: { createdAt: 'desc' } })
  ]);
  const token = (await cookies()).get(COOKIE_NAME)?.value ?? '';
  const names: Record<string, string> = { authentication_success: 'Signed in to workspace', authentication_failure: 'Unsuccessful sign-in', upload_started: 'Artifact upload started', upload_completed: 'Artifact received', upload_rejected: 'Artifact rejected', logout: 'Signed out', session_revoked: 'Sessions revoked' };
  return <Shell active="dashboard" user={user}>
    <div className="page-heading"><div><div className="eyebrow dark">YOUR TRAINING WORKSPACE</div><h1>Welcome, {user.displayName.split(' ')[0]}<span className="muted">.</span></h1><p>You’re signed in. Your next step starts here.</p></div><span className="session-label"><span className="status-dot"/> SESSION ACTIVE</span></div>
    <section className="stat-grid" aria-label="Workspace summary">
      <div className="stat-card"><span className="stat-label">ACCOUNT <Fingerprint size={18}/></span><div className="stat-value role-value">{user.role.toLowerCase()}</div><span className="stat-detail">{user.email}</span></div>
      <div className="stat-card"><span className="stat-label">ARTIFACTS SUBMITTED <FileUp size={18}/></span><div className="stat-value">{String(uploads).padStart(2, '0')}</div><span className="stat-detail">Recorded in your activity</span></div>
      <div className="stat-card"><span className="stat-label">SUCCESSFUL SIGN-INS <Clock3 size={18}/></span><div className="stat-value">{String(signIns).padStart(2, '0')}</div><span className="stat-detail">This lab cycle</span></div>
    </section>
    <section className="next-step"><div><div className="eyebrow">NEXT IN YOUR EXERCISE</div><h2>Make a signal.<br/>Follow the evidence.</h2><p>Submit your instructor-provided test artifact.<br/>Every upload creates a traceable activity record.</p><a className="button button-white" href="/upload">Upload an artifact <ArrowUpRight size={18}/></a></div><div className="next-art" aria-hidden="true"><div className="file-outline"><FileUp size={60} strokeWidth={1}/><span>ARTIFACT / 01</span></div><span className="next-art-plus">+</span></div></section>
    <div className="dashboard-lower"><section className="activity-section"><div className="section-heading"><h2>Recent activity</h2><span className="mono muted">YOUR ACCOUNT ONLY</span></div>
      <div className="activity-list">{activity.map(event => <div className="activity-row" key={event.id}><span className="activity-icon">{event.result === 'success' ? <Check size={16}/> : <ShieldCheck size={16}/>}</span><div><strong>{names[event.eventType] ?? 'Account activity'}</strong><time dateTime={event.createdAt.toISOString()}>{time(event.createdAt)}</time></div><span className={'event-status ' + (event.result === 'failure' ? 'event-failure' : '')}>{event.result === 'success' ? 'Recorded' : 'Unsuccessful'}</span></div>)}{!activity.length && <p className="empty-note">Your activity will appear here as you work.</p>}</div>
    </section><aside className="session-card"><div className="section-heading"><h2>Session details</h2><ShieldCheck size={18}/></div><dl><dt>Environment</dt><dd>{getEnv().LAB_MODE === 'vulnerable' ? 'Vulnerable training lab' : 'Secured training lab'}</dd><dt>Last successful login</dt><dd>{lastLogin ? time(lastLogin.createdAt) : 'No login recorded'}</dd><dt>Session expires</dt><dd>{time(session.expiresAt)}</dd></dl><form action="/api/auth/revoke" method="post"><input name="csrf" type="hidden" value={csrfToken(token)}/><button className="text-button">Sign out of all sessions <ArrowRight size={16}/></button></form></aside></div>
  </Shell>;
}
