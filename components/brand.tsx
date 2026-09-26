export function NorthstarMark({ className = '' }: { className?: string }) {
  return <svg className={className} width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 0L23.6 14.8L34 6L25.2 16.4L40 20L25.2 23.6L34 34L23.6 25.2L20 40L16.4 25.2L6 34L14.8 23.6L0 20L14.8 16.4L6 6L16.4 14.8L20 0Z" fill="currentColor"/></svg>;
}
export function Brand() { return <a href="/" className="brand" aria-label="Northstar home"><NorthstarMark/><span>NORTHSTAR<span className="brand-sub">TRAINING PORTAL</span></span></a>; }
