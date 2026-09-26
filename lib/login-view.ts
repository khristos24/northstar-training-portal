export const starSvg = '<svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 0L23.6 14.8L34 6L25.2 16.4L40 20L25.2 23.6L34 34L23.6 25.2L20 40L16.4 25.2L6 34L14.8 23.6L0 20L14.8 16.4L6 6L16.4 14.8L20 0Z" fill="currentColor"/></svg>';
export function loginMarkup(error = false, unavailable = false) {
  return `<div class="login-layout">
    <aside class="identity-panel">
      <a class="brand" href="/login" aria-label="Northstar home">${starSvg}<span>NORTHSTAR<span class="brand-sub">TRAINING PORTAL</span></span></a>
      <div class="identity-copy"><span class="eyebrow"><span class="tiny-line"></span> THE NORTHSTAR ENVIRONMENT</span><h1>Practice with<br>purpose.</h1><p>A controlled space to explore security.<br>Build your skills. Understand the signals.</p></div>
      <div class="orbital-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="orbit orbit-three"></div><div class="axis axis-x"></div><div class="axis axis-y"></div><div class="art-star">${starSvg}</div><span class="orbit-dot dot-one"></span><span class="orbit-dot dot-two"></span><span class="art-label label-n">N / 001</span><span class="art-label label-s">CONTROLLED BY DESIGN</span><span class="art-plus plus-one">+</span><span class="art-plus plus-two">+</span></div>
      <div class="identity-footer"><span>BUILT FOR THE EXERCISE.</span><span>HAVOC / NORTHSTAR <span class="footer-cross">↗</span></span></div>
    </aside>
    <main class="login-main">
      <div class="login-topline"><span class="status-dot"></span> ISOLATED TRAINING RANGE <span class="topline-code">NS—01</span></div>
      <section class="login-content" aria-labelledby="sign-in-title">
        <div class="section-index">01 <span>/ PORTAL ACCESS</span></div>
        <h2 id="sign-in-title">Welcome back.</h2><p class="login-subtitle">Sign in to your assigned Northstar workspace.</p>
        <div class="training-notice"><svg width="18" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3l8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3z"/><path d="M12 8v5m0 3v.5"/></svg><p>AUTHORISED CYBERSECURITY TRAINING ENVIRONMENT. USE ONLY ASSIGNED LAB CREDENTIALS.</p></div>
        ${error ? '<div class="form-error" role="alert"><strong>Sign-in unsuccessful</strong><span>Invalid email or password</span></div>' : ''}
        ${unavailable ? '<div class="form-error" role="alert">The portal is temporarily unavailable. Please try again shortly.</div>' : ''}
        <form action="/login" method="post" enctype="application/x-www-form-urlencoded" class="login-form">
          <label for="email">Email address <span>YOUR ASSIGNED ACCOUNT</span></label><input id="email" name="email" type="email" placeholder="you@northstar.test" autocomplete="username" maxlength="254" required>
          <label for="password">Password</label><div class="password-wrap"><input id="password" name="password" type="password" placeholder="Enter your lab password" autocomplete="current-password" maxlength="72" required><button class="password-toggle" type="button" aria-label="Show password" aria-pressed="false"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/></svg></button></div>
          <button class="button button-primary login-submit" type="submit">Sign in to workspace <span aria-hidden="true">↗</span></button>
        </form>
        <p class="access-help">Need access? <a href="/help">Contact your instructor <span aria-hidden="true">↗</span></a></p>
        <div class="login-note"><svg width="14" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span>Fictional identities. Real learning.<br>Activity in this environment is recorded for training.</span></div>
      </section>
      <footer class="login-footer"><span>© ${new Date().getUTCFullYear()} Northstar Training</span><a href="/scope">Environment guidelines <span aria-hidden="true">↗</span></a></footer>
    </main></div>`;
}
export function loginDocument(error = false, unavailable = false) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Sign in · Northstar</title><link rel="icon" href="/icon.svg"><link rel="stylesheet" href="/portal.css"></head><body>' + loginMarkup(error, unavailable) + '<script src="/login.js" defer></script></body></html>';
}
