(() => {
  function connect() {
    const toggle = document.querySelector('.password-toggle');
    const input = document.getElementById('password');
    if (!toggle || !input || toggle.dataset.ready) return;
    toggle.dataset.ready = 'true';
    toggle.addEventListener('click', () => {
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
      toggle.setAttribute('aria-pressed', String(visible));
    });
  }
  connect();
  document.addEventListener('DOMContentLoaded', connect, { once: true });
})();
