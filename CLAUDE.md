# Knuckles Retreat website

Marketing site for a resort in Sri Lanka: https://www.knucklesretreat.com. Seven routes (`/`,
`/accommodation/`, `/inquiry/`, `/faq/`, `/privacy-policy/`, `/terms-and-conditions/`, 404). Content is
hardcoded or comes from `src/data/*.json`. The only backend call is the inquiry form, which POSTs to
`${PUBLIC_API_URL}/reservation`: a Firebase Cloud Function kept in a **separate repo**.

## Current state: migrating Qwik → Astro

- Branch `astro-migration`. The plan in `docs/astro-migration-plan.md` is the source of truth for scope,
  order and acceptance criteria. Read the relevant phase before starting work, and keep the plan
  updated when facts change.
- Order: Astro parity, launched directly on Cloudflare Workers static assets (Phases 0–5; the Astro
  site is never deployed to Vercel, which keeps serving the Qwik site as the rollback target) →
  Turnstile + backend verification (6) → improvements (8). Phase 7 (the hosting move) was merged into
  4–5. Each one ships and is verified separately.
- Phases 0 (baseline), 1 (Astro setup, layout, `<head>`), 2 (static markup, images, icons, CSS) and
  3 (interactive behaviour, inquiry form, Qwik removed) are done; 4 (Cloudflare setup + verification)
  is in progress. Check `git log` and the plan for the current state. The Qwik source is in git history (commit `817c272`); port from there.

## Parity rules (Phases 1–5)

The migrated site must look, animate and index exactly like the Qwik site.

- Copy CSS (`*.module.css`, `global.css`) byte-for-byte. The only allowed edit is a relative `url()`
  path that breaks because a file moved.
- Port `useVisibleTask$` logic line for line: same thresholds, parallax factors, clamps and timings.
  Component scripts use `src/lib/qwik-runtime.ts` (Qwik's scheduling and re-render semantics) and get
  class maps/URLs through `ScriptData.astro`. Never import a `.module.css` in a client `<script>`
  (Astro then emits that CSS twice).
- Initial server HTML must match Qwik's SSR output: classes, inline styles, attributes, `<head>` order.
- Keep known quirks (missing Poppins `@font-face`, the "Please select" country bug, reCAPTCHA on every
  page, the no-op Partytown, the testimonial star classes appearing only after some re-renders, the
  outgoing testimonial card showing the incoming text, internal links without trailing slashes).
  They are listed in Phase 8 of the plan; don't fix them during parity.
- Images: use `ResponsiveImage.astro` where Qwik used `?jsx` and `reencodedUrl()` where it used `?url`
  (Qwik re-encoded those). Read image metadata through `metadataOf()`, never `img.width` etc., or
  Astro ships the multi-MB originals. Icons: `Icon.astro` (generated from qwikest), not Iconify.
- Don't change the browser targets, CSS minifier or `inlineStylesheets` in `astro.config.mjs`; they
  make the CSS match Qwik's (plan §4.3).
- Don't change markup semantics for style (e.g. a `<button>` that navigates stays a `<button>`).
- If parity seems impossible, stop and ask. Don't approximate silently.

## Parity tooling: `scripts/parity/`

Has its own `package.json`; see its `README.md`. The baseline from Qwik commit `817c272` is in
`scripts/parity/baseline/{local,live}/`. Screenshots and video are gitignored and exist only on the
developer's machine; regenerate them from that commit if they're missing. Write captures of the new
site to `scripts/parity/candidate/`, never over `baseline/`.

A phase is done only when its acceptance checks in the plan pass against the baseline. Report diffs
honestly, including ones that look like noise.

## Commands

Astro (7.3.8, needs Node ≥ 22.23.4):

```sh
npm run dev
npm run build && npm run preview   # preview runs as a daemon on :4173
npx astro preview stop
npm run build && npm run preview.cf  # Cloudflare's local runtime on :8787 (redirects, _headers, 404)
npm run deploy                     # build + wrangler deploy
npm run check                      # types (astro check)
npm run lint
```

Parity check (a production preview must be running on :4173):

```sh
cd scripts/parity
node capture.mjs --base http://localhost:4173 --out candidate/local [--no-screens]
node compare.mjs --baseline baseline/local --candidate candidate/local [--only body,css] [--routes faq]
```

`astro preview` doesn't redirect `/faq` → `/faq/`; `npm run preview.cf` does (via `public/_redirects`),
so check redirects there or on the `*.workers.dev` deploy. Screenshot captures are timing-sensitive under heavy machine load;
re-run before treating a one-off diff as real.

## Project facts

- Canonical host is `www.knucklesretreat.com`. URLs have trailing slashes (`/faq` → 301 → `/faq/`).
- `public/site/sitemap.xml` is hand-maintained; `robots.txt` points to that path.
- `PUBLIC_API_URL` is inlined at build time (`.env` locally, Workers Builds build variables in deploys).
- Images live in `src/media/` (some sources are 2–4 MB; don't replace or resize the source files during
  parity — the build output has to stay what Qwik produced).

## Workflow

- Commit only when asked. Work on `astro-migration`, never directly on `main`.
- Don't submit the real inquiry form against the production API while testing.
