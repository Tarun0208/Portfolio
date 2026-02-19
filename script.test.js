document.body.innerHTML = `
  <div id="year"></div>
  <button id="theme-toggle"></button>
  <button class="nav__toggle" aria-expanded="false"></button>
  <div id="nav-links" class="nav__links"></div>
  <button id="copy-email"></button>
  <a href="mailto:test@example.com"></a>
`;

const root = document.documentElement;
const yearEl = document.getElementById('year');
const themeToggle = document.getElementById('theme-toggle');
const toggle = document.querySelector('.nav__toggle');
const links = document.getElementById('nav-links');
const copyBtn = document.getElementById('copy-email');
const mailto = document.querySelector('a[href^="mailto:"]');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => (store[key] = value)),
    clear: jest.fn(() => (store = {})),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
  },
});

describe('Portfolio Script', () => {
  it('updates the year element with the current year', () => {
    require('./script');
    expect(yearEl.textContent).toBe(String(new Date().getFullYear()));
  });

  it('toggles theme between light and default', () => {
    require('./script');
    themeToggle.click();
    expect(root.getAttribute('data-theme')).toBe('light');
    themeToggle.click();
    expect(root.getAttribute('data-theme')).toBe(null);
  });

  it('saves theme to localStorage', () => {
    require('./script');
    themeToggle.click();
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('initializes theme from localStorage', () => {
    localStorage.getItem.mockReturnValue('light');
    require('./script');
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('toggles mobile navigation menu', () => {
    require('./script');
    toggle.click();
    expect(links.classList.contains('is-open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.click();
    expect(links.classList.contains('is-open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('copies email to clipboard', async () => {
    require('./script');
    await copyBtn.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test@example.com');
  });

  it('shows copied message temporarily', async () => {
    require('./script');
    const originalText = copyBtn.textContent;
    await copyBtn.click();
    expect(copyBtn.textContent).toBe('Copied');
    jest.runAllTimers();
    expect(copyBtn.textContent).toBe(originalText);
  });
});
