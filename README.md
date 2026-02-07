# Single-page portfolio

This is a tiny, single-page portfolio site (no build step).

## Run locally

Option A (simplest): open `index.html` in a browser.

Option B (recommended, avoids some browser restrictions): run a local server:

```bash
cd /Users/tarunkishore/.openclaw/workspace/portfolio
python3 -m http.server 5173
```

Then open: http://localhost:5173

## Customize

- `index.html`
  - Replace name/title/bio
  - Update GitHub/LinkedIn links
  - Replace placeholder projects
  - Set your email in the `mailto:` links
- `styles.css` for theme/layout

## Deploy

You can deploy this folder to:
- GitHub Pages
- Netlify
- Vercel (as static)
- Any static host
