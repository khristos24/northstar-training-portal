import { cookies } from 'next/headers';
import { ArrowUpRight, LayoutGrid, Upload, BookOpen, LogOut, ShieldCheck } from 'lucide-react';
import { Brand } from './brand';
import { COOKIE_NAME, csrfToken } from '../lib/auth/session';
import { getEnv } from '../lib/validation/env';
type Props = { active: 'dashboard' | 'upload' | 'scope'; user: { displayName: string; role: string; email: string }; children: React.ReactNode };
export async function Shell({ active, user, children }: Props) {
  const env = getEnv();
  const token = (await cookies()).get(COOKIE_NAME)?.value ?? '';
  const links = [{ href: '/dashboard', id: 'dashboard', label: 'Overview', icon: LayoutGrid }, { href: '/upload', id: 'upload', label: 'Artifact upload', icon: Upload }, { href: '/scope', id: 'scope', label: 'Lab guidelines', icon: BookOpen }];
  return <div className="workspace">
    <aside className="sidebar"><Brand/><div className="workspace-label">YOUR WORKSPACE</div>
      <nav aria-label="Main navigation">{links.map(({ href, id, label, icon: Icon }) => <a key={id} href={href} className={'nav-item ' + (active === id ? 'active' : '')} aria-current={active === id ? 'page' : undefined}><Icon size={18}/>{label}{active === id && <span className="nav-active-dot"/>}</a>)}</nav>
      <div className="sidebar-bottom"><div className="range-card"><ShieldCheck size={22}/><strong>A controlled environment.</strong><p>Stay in scope. Use only the credentials and artifacts assigned to you.</p><a href="/scope">Review guidelines <ArrowUpRight size={15}/></a></div>
      <div className="profile"><div className="avatar">{user.displayName.split(' ').map(n => n[0]).join('')}</div><div><strong>{user.displayName}</strong><span>{user.role.toLowerCase()} account</span></div><form action="/api/auth/logout" method="post"><input type="hidden" name="csrf" value={csrfToken(token)}/><button title="Sign out" aria-label="Sign out" className="icon-button"><LogOut size={18}/></button></form></div></div>
    </aside>
    <div className="workspace-body"><header className="workspace-header"><span className="mono">NORTHSTAR <span className="muted">/</span> {active === 'dashboard' ? 'OVERVIEW' : active === 'upload' ? 'ARTIFACT UPLOAD' : 'GUIDELINES'}</span><span className="mode-badge"><span className="status-dot"/>{env.LAB_MODE === 'vulnerable' ? 'VULNERABLE LAB' : 'SECURED LAB'}</span></header>
      <main className="workspace-content">{children}</main>
      <footer className="workspace-footer"><span>AUTHORISED TRAINING ONLY</span><span>northstar.test <span className="muted">/</span> HAVOC</span></footer>
    </div></div>;
}
