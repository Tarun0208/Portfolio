const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Theme toggle (dark/light)
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');

function setTheme(theme) {
  if (theme) root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
  try {
    localStorage.setItem('theme', theme || '');
  } catch {}
}

// init theme
try {
  const saved = localStorage.getItem('theme');
  if (saved) setTheme(saved);
} catch {}

if (themeToggle) {
  const label = () => (root.getAttribute('data-theme') === 'light' ? 'Light' : 'Dark');
  themeToggle.textContent = label();

  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? '' : 'light';
    setTheme(next);
    themeToggle.textContent = label();
  });
}

// Mobile nav toggle
const toggle = document.querySelector('.nav__toggle');
const links = document.getElementById('nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

// Copy email
const copyBtn = document.getElementById('copy-email');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    const mailto = document.querySelector('a[href^="mailto:"]');
    const email = mailto?.getAttribute('href')?.replace('mailto:', '') || '';
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      const prev = copyBtn.textContent;
      copyBtn.textContent = 'Copied';
      setTimeout(() => (copyBtn.textContent = prev), 900);
    } catch {
      // Clipboard may be blocked on file:// — silently ignore.
    }
  });
}
