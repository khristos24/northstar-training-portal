import { cookies } from 'next/headers';
import { ArrowLeft, Check, ShieldCheck, FileText, ArrowUpRight } from 'lucide-react';
import { requireSession, COOKIE_NAME, csrfToken } from '../../lib/auth/session';
import { getEnv } from '../../lib/validation/env';
import { db } from '../../lib/db';
import { Shell } from '../../components/shell';
import { UploadForm } from '../../components/upload-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Artifact upload' };
const errors: Record<string, string> = { invalid: 'The file could not be accepted. Check its name, content and size, then try again.', size: 'The file exceeds the upload size limit.', csrf: 'Your form expired. Please try again.', unavailable: 'Upload storage is temporarily unavailable. Please try again shortly.' };
export default async function UploadPage({ searchParams }: { searchParams: Promise<{ receipt?: string; error?: string }> }) {
  const session = await requireSession();
  const env = getEnv();
  const params = await searchParams;
  const id = typeof params.receipt === 'string' && /^[0-9a-f-]{36}$/.test(params.receipt) ? params.receipt : undefined;
  const receipt = id ? await db().upload.findFirst({ where: { id, userId: session.userId } }) : null;
  const token = (await cookies()).get(COOKIE_NAME)?.value ?? '';
  return <Shell active="upload" user={session.user}>
    <a className="back-link" href="/dashboard"><ArrowLeft size={16}/> Back to overview</a>
    <div className="page-heading"><div><div className="eyebrow dark">THE NEXT STEP</div><h1>Artifact upload<span className="muted">.</span></h1><p>A small file. A traceable signal.</p></div><span className="outline-badge">AUTHENTICATED ACCESS</span></div>
    {receipt ? <section className="receipt"><div className="receipt-heading"><span className="receipt-check"><Check size={26}/></span><div><span className="eyebrow dark">SUBMISSION RECORDED</span><h2>Artifact received.</h2><p>Your upload is saved and its metadata has been recorded.</p></div></div><dl className="receipt-details"><dt>Upload ID</dt><dd>{receipt.id}</dd><dt>Original filename</dt><dd>{receipt.originalName}</dd><dt>Stored filename</dt><dd>{receipt.storedName}</dd><dt>Size</dt><dd>{receipt.sizeBytes.toLocaleString()} bytes</dd><dt>SHA-256</dt><dd className="hash">{receipt.sha256}</dd><dt>Timestamp (UTC)</dt><dd>{receipt.createdAt.toISOString()}</dd></dl><div className="receipt-note"><ShieldCheck size={20}/><p>This receipt confirms storage. Your instructor will verify detection separately in Wazuh.</p></div><a className="button button-primary" href="/upload">Upload another artifact <ArrowUpRight size={18}/></a></section> :
    <div className="upload-grid"><section className="upload-card"><div className="section-heading"><h2>Select your artifact</h2><span className="mono muted">01 / SUBMIT</span></div>{params.error && <div className="form-error" role="alert">{errors[params.error] ?? errors.invalid}</div>}<UploadForm csrf={csrfToken(token)} maxBytes={env.MAX_UPLOAD_BYTES} secured={env.LAB_MODE === 'secured'}/></section><aside className="upload-guidance"><ShieldCheck size={25} strokeWidth={1.5}/><h2>Keep it in scope.</h2><p>Use only the harmless test artifact supplied or approved by your instructor.</p><ol><li><span>01</span><div><strong>Choose the assigned file</strong><p>No personal data or functioning malware.</p></div></li><li><span>02</span><div><strong>Submit and save the receipt</strong><p>Your file gets a unique ID and SHA-256 fingerprint.</p></div></li><li><span>03</span><div><strong>Follow the signal</strong><p>Work with your instructor to correlate the upload with detection.</p></div></li></ol><a className="text-button" href="/scope">Read environment guidelines <ArrowUpRight size={16}/></a></aside></div>}
    <div className="upload-bottom-note"><FileText size={17}/><p>{env.LAB_MODE === 'secured' ? 'Secured mode accepts UTF-8 .txt files and blocks the EICAR training signature.' : 'Your instructor controls the test artifact. This portal does not provide downloadable test files.'}</p></div>
  </Shell>;
}
