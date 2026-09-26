'use client';
import { useRef, useState } from 'react';
import { Upload, FileText, X, ArrowUpRight, LoaderCircle } from 'lucide-react';
export function UploadForm({ csrf, maxBytes, secured }: { csrf: string; maxBytes: number; secured: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  function select(file: File | null) {
    setError('');
    if (file && file.size > maxBytes) { setError('This file exceeds the upload size limit.'); setFile(null); if (input.current) input.current.value = ''; return; }
    setFile(file);
  }
  return <form action="/upload" method="post" encType="multipart/form-data" onSubmit={e => { if (!file) { e.preventDefault(); setError('Choose a file to continue.'); } else setPending(true); }}>
    <input name="csrf" type="hidden" value={csrf}/>
    <div className={'dropzone ' + (dragging ? 'dragging' : '')} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); const dropped = e.dataTransfer.files[0]; if (dropped && input.current) { const transfer = new DataTransfer(); transfer.items.add(dropped); input.current.files = transfer.files; select(dropped); } }}>
      <div className="upload-icon"><Upload size={28} strokeWidth={1.3}/></div><h3>Drop your artifact here</h3><p>or <button className="inline-button" type="button" onClick={() => input.current?.click()}>browse files</button> on your device</p><span className="mono muted">{secured ? 'PLAIN TEXT (.TXT)' : 'INSTRUCTOR-APPROVED ARTIFACTS'} <span aria-hidden="true">·</span> UP TO {Math.round(maxBytes / 1024)} KB</span>
      <input className="sr-only" ref={input} type="file" name="file" aria-label="Choose artifact" accept={secured ? '.txt,text/plain' : undefined} onChange={e => select(e.target.files?.[0] ?? null)}/>
    </div>
    {file && <div className="selected-file"><FileText size={22}/><div><strong>{file.name}</strong><span>{file.size.toLocaleString()} bytes · Ready to submit</span></div><button className="icon-button" type="button" aria-label="Remove selected file" onClick={() => { setFile(null); if (input.current) input.current.value = ''; }}><X size={18}/></button></div>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="upload-actions"><p>Your file is stored as an inert artifact.<br/>Uploaded content is never executed.</p><button className="button button-primary" disabled={!file || pending}>{pending ? 'Submitting…' : 'Submit artifact'}{pending ? <LoaderCircle size={18} className="spin"/> : <ArrowUpRight size={18}/>}</button></div>
  </form>;
}
