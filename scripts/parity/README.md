# Parity tooling

Captures a reference snapshot of the site so the Astro migration (see
`docs/astro-migration-plan.md`) can be checked against it. It has its own `package.json` so it keeps
working while the site's framework is swapped underneath it.

```sh
cd scripts/parity
npm install
npx playwright install chromium
```

## Capture

Start the site locally first (Qwik: `npm run build.client && npm run build.preview && npx vite preview --port 4173`;
Astro: `npm run astro:build && npm run astro:preview`, stopped with `npx astro preview stop`), then:

```sh
# HTML, <head>, DOM facts, full-page screenshots, animation states, scroll video
node capture.mjs --base http://localhost:4173 --out baseline/local

# Live site: HTML / <head> / DOM / CSS only (screenshots come from the local build)
node capture.mjs --base https://www.knucklesretreat.com --out baseline/live --no-screens

# Only the stylesheets (added to both baselines in Phase 2; the local Qwik build served the same
# content-hashed sHOefXpa-style.css as production, so baseline/local/css is a copy of the live one)
node capture.mjs --base https://www.knucklesretreat.com --out baseline/live --css-only

# Redirects and status codes (live run also checks apex/www and http/https)
node redirects.mjs --base https://www.knucklesretreat.com --out baseline/live
node redirects.mjs --base http://localhost:4173 --out baseline/local --local

# Lighthouse, median of 3 runs, mobile + desktop (live or deployed preview only)
node lighthouse.mjs --base https://www.knucklesretreat.com --out baseline/live
```

## Compare

Capture the migrated site into `candidate/` (gitignored), then:

```sh
node compare.mjs --baseline baseline/local --candidate candidate/local                     # all checks
node compare.mjs --baseline baseline/live --candidate candidate/local --only head,body,css # vs production
node compare.mjs --baseline baseline/local --candidate candidate/local --routes faq,404    # some pages
```

Exits 1 on any difference.

| Check | What must match |
| --- | --- |
| `head` | Title, `<html>`/`<body>` lang, every non-framework `<head>` element in order, canonical (by path), exact Partytown snippet text. Ignored: assets under `/build/`, `/assets/`, `/_astro/`, `<style>` tags, inline module scripts |
| `responses` | Status code and content type per route |
| `body` | Server HTML `<body>` parsed with JS off, one line per node. Normalized: framework attributes (`q:*`, `on:*`, `data-qwikest-icon`, …), comments (adjacent text merged), `<script>`/`<style>`, attribute order, whitespace runs, asset hashes (→ `asset:name.ext`), date-input `min` |
| `css` | Union of all stylesheets, compared declaration by declaration through Chromium's CSSOM (formatting and rule grouping drop out), plus the raw vendor-prefixed declarations and `@import` URLs (Chromium drops prefixes it doesn't support). Ignored: Qwik City's `:root{view-transition-name:none}` |
| `screens` | Full-page screenshots per viewport: same size and ≤ 0.1 % differing pixels (pixelmatch threshold 0.1). Diffs are written to `<candidate>/screens-diff/` |

The `states/` screenshots and the scroll video are compared by eye.

## Output

| Path | Contents |
| --- | --- |
| `html/<route>.html` | Raw server HTML (what crawlers see) |
| `responses.json` | Status code and key headers per route |
| `css/` | Every stylesheet the routes load (inline `<style>` blocks as `<route>-inline-<n>.css`); `css/index.json` maps routes to files |
| `head/<route>.json` | `<html>`/`<body>` lang, title and every `<head>` element in order (framework attributes stripped) |
| `dom/<route>.json` | Headings, images (`img`/`source`/`svg` attributes), inline styles, links, buttons, form fields, iframes |
| `screens/<width>/<route>.png` | Full-page screenshots at 375/768/1280/1920 after all scroll reveals have fired (iframes masked, CSS animations finished) |
| `states/*.png` | Viewport screenshots of animation/interaction states (hero slides, sticky header, mobile menu, each section's reveal, testimonial transition, form validation) |
| `video/home-scroll-1280.webm` | Slow scroll of the home page — manual reference for parallax |
| `console.json` | Browser console errors/warnings seen during capture |
| `redirects.json` | Every hop for each URL variant |
| `lighthouse.json` | Category scores and core metrics (median of runs) |

Screenshots and the video are large and are not committed (see `.gitignore`); everything else is.
Re-create them from the commit recorded in `meta.json` when needed.

## Known nondeterminism

- The Google Maps and reCAPTCHA iframes are masked. On `localhost`, reCAPTCHA shows an
  "invalid domain" state.
- The hero slider auto-advances every 15 s; captures finish well within that window.
- The testimonial mid-transition shot is timing-based; compare it by eye, not by pixel diff.
